const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatWindow = document.getElementById("chatWindow");
const languageSelect = document.getElementById("languageSelect");
const cefrLevel = document.getElementById("cefrLevel");
const modeSelect = document.getElementById("modeSelect");
const correctionStyleField = document.getElementById("correctionStyleField");
const correctionStyle = document.getElementById("correctionStyle");
const lessonSelect = document.getElementById("lessonSelect");
const strictLanguage = document.getElementById("strictLanguage");
const apiStatus = document.getElementById("apiStatus");
const progressPanel = document.getElementById("progressPanel");
const progressSummary = document.getElementById("progressSummary");
const submitButton = document.getElementById("submitButton");
const providerButtons = document.querySelectorAll(".provider-btn");

const PROVIDER_STORAGE_KEY = "lpp-chat-provider";
const sessionId = crypto.randomUUID();
let isSending = false;
let lessonProgress = null;

const API_BASE = "";

function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  const bubble = document.createElement("p");

  wrapper.className = `message ${role}`;
  bubble.textContent = text;
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setSending(sending) {
  isSending = sending;
  submitButton.disabled = sending;
  messageInput.disabled = sending;
  submitButton.textContent = sending ? "…" : "Send";
}

function syncModeView() {
  const showCorrection = modeSelect.value === "correct";
  correctionStyleField.classList.toggle("hidden", !showCorrection);
}

function getSelectedProvider() {
  const active = document.querySelector(".provider-btn.active");
  return active?.dataset.provider === "openai" ? "openai" : "gemini";
}

function setSelectedProvider(provider) {
  for (const button of providerButtons) {
    const isActive = button.dataset.provider === provider;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
  localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
}

function syncProviderAvailability(health) {
  for (const button of providerButtons) {
    const provider = button.dataset.provider;
    const available =
      provider === "gemini" ? health.geminiConfigured : health.openaiConfigured;
    button.dataset.unavailable = available ? "false" : "true";
    button.disabled = !available;
    button.title = available
      ? ""
      : `${provider === "gemini" ? "Gemini" : "OpenAI"} API key not configured`;
  }

  const preferred = localStorage.getItem(PROVIDER_STORAGE_KEY) || "gemini";
  const preferredBtn = document.querySelector(
    `.provider-btn[data-provider="${preferred}"]`,
  );
  if (preferredBtn && preferredBtn.dataset.unavailable !== "true") {
    setSelectedProvider(preferred);
  } else {
    const fallback = document.querySelector(
      '.provider-btn[data-unavailable="false"]',
    );
    if (fallback) {
      setSelectedProvider(fallback.dataset.provider);
    }
  }
}

function updateProgressDisplay(progress) {
  if (!progress || !lessonSelect.value) {
    progressPanel.classList.add("hidden");
    return;
  }

  lessonProgress = progress;
  progressPanel.classList.remove("hidden");

  const completed = progress.completedObjectives?.length
    ? progress.completedObjectives.join(", ")
    : "none yet";
  const phrases = progress.phrasesPracticed?.length
    ? progress.phrasesPracticed.join(", ")
    : "none yet";

  progressSummary.textContent = `Completed: ${completed}. Phrases practiced: ${phrases}. ${progress.notes || ""}`;
}

function filterLessonsForLanguage() {
  const lang = languageSelect.value;
  for (const option of lessonSelect.options) {
    if (!option.dataset.language) {
      continue;
    }
    option.hidden = option.dataset.language !== lang;
  }

  const selected = lessonSelect.selectedOptions[0];
  if (selected?.hidden) {
    lessonSelect.value = "";
    updateProgressDisplay(null);
  }
}

async function loadLessons() {
  try {
    const response = await fetch(`${API_BASE}/api/lessons`);
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    for (const lesson of data.lessons || []) {
      const option = document.createElement("option");
      option.value = lesson.unitId;
      option.textContent = `${lesson.title} (${lesson.cefrLevel})`;
      option.dataset.language = lesson.targetLanguage;
      lessonSelect.appendChild(option);
    }

    filterLessonsForLanguage();
  } catch {
    // Lessons are optional for free conversation
  }
}

async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();

    if (data.chatReady) {
      syncProviderAvailability(data);
      const selected = getSelectedProvider();
      const model =
        selected === "openai" ? data.openaiModel : data.geminiModel;
      apiStatus.textContent = `Server ready · using ${selected === "openai" ? "OpenAI" : "Gemini"} (${model})`;
      apiStatus.classList.remove("notice-error");
    } else {
      apiStatus.textContent =
        "Server running, but no API keys found. Add GOOGLE_API_KEY and/or OPENAI_API_KEY to .env and restart.";
      apiStatus.classList.add("notice-error");
    }
  } catch {
    apiStatus.textContent =
      "Cannot reach the API. Run npm run dev from the project folder.";
    apiStatus.classList.add("notice-error");
  }
}

function formatChatError(message) {
  if (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("RESOURCE_EXHAUSTED")
  ) {
    return "The AI hit a usage limit. Add OPENAI_API_KEY to .env (for automatic fallback), or set CHAT_PROVIDER=openai and restart the server.";
  }
  if (message.length > 280) {
    return `${message.slice(0, 280)}…`;
  }
  return message.startsWith("Error:") ? message : `Error: ${message}`;
}

async function sendChatMessage(message) {
  const body = {
    sessionId,
    message,
    targetLanguage: languageSelect.value,
    cefrLevel: cefrLevel.value,
    mode: modeSelect.value,
    correctionStyle: correctionStyle.value,
    lessonUnitId: lessonSelect.value || null,
    strictTargetLanguageOnly: strictLanguage.checked,
    supportLanguage: "en",
    chatProvider: getSelectedProvider(),
  };

  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Chat request failed");
  }

  return data;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const value = messageInput.value.trim();
  if (!value || isSending) {
    return;
  }

  appendMessage("user", value);
  messageInput.value = "";
  setSending(true);

  try {
    const data = await sendChatMessage(value);
    appendMessage("bot", data.reply);
    if (data.progress) {
      updateProgressDisplay(data.progress);
    }
  } catch (error) {
    const message = formatChatError(
      error instanceof Error ? error.message : "Something went wrong.",
    );
    appendMessage("bot", message);
  } finally {
    setSending(false);
    messageInput.focus();
  }
});

modeSelect.addEventListener("change", syncModeView);
languageSelect.addEventListener("change", () => {
  filterLessonsForLanguage();
  messageInput.placeholder =
    languageSelect.value === "de"
      ? "Schreibe deine Nachricht..."
      : "Write your message...";
});
lessonSelect.addEventListener("change", () => {
  lessonProgress = null;
  if (!lessonSelect.value) {
    updateProgressDisplay(null);
  } else {
    progressPanel.classList.remove("hidden");
    progressSummary.textContent = "Progress will update as you practice.";
  }
});

for (const button of providerButtons) {
  button.addEventListener("click", () => {
    if (button.disabled || button.dataset.unavailable === "true") {
      return;
    }
    setSelectedProvider(button.dataset.provider);
    const modelHint =
      button.dataset.provider === "openai" ? "GPT-4o mini" : "Gemini Flash";
    apiStatus.textContent = `Using ${button.dataset.provider === "openai" ? "OpenAI" : "Gemini"} (${modelHint})`;
    apiStatus.classList.remove("notice-error");
  });
}

syncModeView();
loadLessons();
checkHealth();
