import { hasGemini, hasOpenAI, config } from "../config.js";
import { buildProgressGradingPrompt } from "../prompt.js";
import { chatWithGemini } from "./gemini.js";
import { chatWithOpenAI } from "./openai.js";

function isQuotaOrRateLimitError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota")
  );
}

async function chatWithProvider(provider, { system, messages }) {
  if (provider === "openai") {
    const text = await chatWithOpenAI({ system, messages });
    return { text, provider: "openai", model: config.openai.model };
  }

  const text = await chatWithGemini({ system, messages });
  return { text, provider: "gemini", model: config.gemini.model };
}

/**
 * @param {{
 *   system: string;
 *   messages: Array<{ role: string; content: string }>;
 *   chatProvider?: "gemini" | "openai" | "auto";
 * }} params
 */
export async function chat({ system, messages, chatProvider }) {
  const mode = chatProvider || config.chatProvider;

  if (mode === "openai") {
    if (!hasOpenAI()) {
      throw new Error(
        "OpenAI selected but OPENAI_API_KEY is not set. See docs/MODELS.md.",
      );
    }
    return chatWithProvider("openai", { system, messages });
  }

  if (mode === "gemini") {
    if (!hasGemini()) {
      throw new Error(
        "Gemini selected but GOOGLE_API_KEY is not set. See docs/MODELS.md.",
      );
    }
    return chatWithProvider("gemini", { system, messages });
  }

  // auto: prefer Gemini, fall back to OpenAI on quota/rate limits
  if (hasGemini()) {
    try {
      return await chatWithProvider("gemini", { system, messages });
    } catch (error) {
      if (hasOpenAI() && isQuotaOrRateLimitError(error)) {
        console.warn(
          "Gemini quota or rate limit hit; falling back to OpenAI for this request.",
        );
        return chatWithProvider("openai", { system, messages });
      }
      throw error;
    }
  }

  if (hasOpenAI()) {
    return chatWithProvider("openai", { system, messages });
  }

  throw new Error(
    "No chat provider configured. Set GOOGLE_API_KEY and/or OPENAI_API_KEY in .env.",
  );
}

/**
 * @param {{
 *   lessonUnit: object;
 *   progress: object | null;
 *   userMessage: string;
 *   assistantReply: string;
 * }} params
 */
export async function gradeProgress(params) {
  if (!hasOpenAI()) {
    return null;
  }

  const prompt = buildProgressGradingPrompt(params);
  const raw = await chatWithOpenAI({
    system:
      "You output only valid JSON for lesson progress updates. No markdown.",
    user: prompt,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(raw);
    return {
      unitId: parsed.unitId || params.lessonUnit.unitId,
      completedObjectives: parsed.completedObjectives || [],
      phrasesPracticed: parsed.phrasesPracticed || [],
      notes: parsed.notes || "",
    };
  } catch {
    return null;
  }
}

export function shouldGradeProgress(mode, userTurnCount) {
  if (mode !== "teach" && mode !== "correct") {
    return false;
  }
  if (!hasOpenAI()) {
    return false;
  }
  const n = config.progressGradeEveryN;
  return n > 0 && userTurnCount > 0 && userTurnCount % n === 0;
}
