/** @type {"auto" | "gemini" | "openai"} */
const chatProvider = (process.env.CHAT_PROVIDER || "auto").toLowerCase();

export const config = {
  port: Number(process.env.PORT) || 3000,
  chatProvider:
    chatProvider === "gemini" || chatProvider === "openai"
      ? chatProvider
      : "auto",
  gemini: {
    apiKey: process.env.GOOGLE_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    baseUrl:
      process.env.GEMINI_API_BASE ||
      "https://generativelanguage.googleapis.com/v1beta",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    baseUrl: process.env.OPENAI_API_BASE || "https://api.openai.com/v1",
  },
  progressGradeEveryN: Number(process.env.PROGRESS_GRADE_EVERY_N) || 3,
};

export function hasGemini() {
  return Boolean(config.gemini.apiKey);
}

export function hasOpenAI() {
  return Boolean(config.openai.apiKey);
}

export function hasChatProvider() {
  return hasGemini() || hasOpenAI();
}
