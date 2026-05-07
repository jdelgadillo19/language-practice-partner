const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatWindow = document.getElementById("chatWindow");
const languageSelect = document.getElementById("languageSelect");
const confirmLanguageButton = document.getElementById("confirmLanguageButton");
const modelSource = document.getElementById("modelSource");
const defaultAgentNotice = document.getElementById("defaultAgentNotice");
const customModelFields = document.getElementById("customModelFields");

let activeLanguage = "en";

function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  const bubble = document.createElement("p");

  wrapper.className = `message ${role}`;
  bubble.textContent = text;
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function syncModelSourceView() {
  const isBringYourOwn = modelSource.value === "bring-your-own";
  customModelFields.classList.toggle("hidden", !isBringYourOwn);
  defaultAgentNotice.classList.toggle("hidden", isBringYourOwn);
}

function buildBotReply(userText) {
  if (activeLanguage === "de") {
    const germanReplies = [
      "Super! Erzaehl mir mehr darueber.",
      "Sehr gut. Kannst du das mit mehr Details sagen?",
      "Ich verstehe dich gut. Worueber moechtest du als Naechstes sprechen?",
      "Tolle Uebung! Stell mir jetzt eine Frage.",
      "Gut gemacht! Wollen wir ueber Reisen, Essen, Arbeit oder Hobbys sprechen?",
    ];

    const normalizedGerman = userText.trim().toLowerCase();
    if (normalizedGerman.includes("wie geht")) {
      return "Mir geht es gut, danke. Wie geht es dir heute?";
    }
    if (normalizedGerman.endsWith("?")) {
      return "Gute Frage. Ich denke ja. Was meinst du dazu?";
    }

    const germanIndex = Math.floor(Math.random() * germanReplies.length);
    return germanReplies[germanIndex];
  }

  const replies = [
    `Great message! Let's keep going: tell me one fun thing you did today.`,
    `Nice start. Can you say that again with a little more detail?`,
    `I understand you well. What would you like to talk about next?`,
    `Awesome practice. Ask me a question now, and I will answer in conversation style.`,
    `Good job! Want to continue with travel, food, work, or hobbies?`,
  ];

  const normalized = userText.trim().toLowerCase();
  if (normalized.includes("how are you")) {
    return "I'm doing great, thanks for asking. How is your day going?";
  }
  if (normalized.endsWith("?")) {
    return "Great question. I would say yes, and I can explain more if you want. What do you think?";
  }

  const index = Math.floor(Math.random() * replies.length);
  return replies[index];
}

function confirmLanguage() {
  activeLanguage = languageSelect.value;

  if (activeLanguage === "de") {
    appendMessage("bot", "Sprache bestaetigt: Deutsch. Lass uns auf Deutsch sprechen.");
    messageInput.placeholder = "Schreibe deine Nachricht...";
    return;
  }

  appendMessage("bot", "Language confirmed: English. Let's continue in English.");
  messageInput.placeholder = "Write your message...";
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const value = messageInput.value.trim();
  if (!value) {
    return;
  }

  appendMessage("user", value);
  messageInput.value = "";

  const reply = buildBotReply(value);
  window.setTimeout(() => {
    appendMessage("bot", reply);
  }, 250);
});

modelSource.addEventListener("change", syncModelSourceView);
confirmLanguageButton.addEventListener("click", confirmLanguage);
syncModelSourceView();
