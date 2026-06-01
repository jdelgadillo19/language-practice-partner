import { buildSystemPrompt } from "./prompt.js";
import { getLessonById } from "./lessons.js";
import {
  appendMessage,
  getOrCreateSession,
  updateProgress,
} from "./session.js";
import * as providers from "./providers/index.js";

/**
 * @param {{
 *   sessionId: string;
 *   message: string;
 *   targetLanguage: string;
 *   cefrLevel: string;
 *   mode: string;
 *   correctionStyle: string;
 *   lessonUnitId?: string | null;
 *   strictTargetLanguageOnly?: boolean;
 *   supportLanguage?: string;
 *   chatProvider?: "gemini" | "openai";
 * }} body
 */
export async function handleChat(body) {
  const {
    sessionId,
    message,
    targetLanguage,
    cefrLevel,
    mode,
    correctionStyle,
    lessonUnitId,
    strictTargetLanguageOnly,
    supportLanguage,
    chatProvider,
  } = body;

  if (!sessionId || !message?.trim()) {
    throw new Error("sessionId and message are required");
  }

  const session = getOrCreateSession(sessionId);
  let lessonUnit = null;

  if (lessonUnitId) {
    lessonUnit = getLessonById(lessonUnitId);
  }

  const system = buildSystemPrompt({
    targetLanguage,
    cefrLevel,
    mode,
    correctionStyle,
    lessonUnit,
    progress: session.progress,
    strictTargetLanguageOnly,
    supportLanguage,
  });

  appendMessage(sessionId, "user", message.trim());

  const { text: reply, provider, model } = await providers.chat({
    system,
    messages: session.messages,
    chatProvider,
  });

  appendMessage(sessionId, "assistant", reply);

  let progress = session.progress;

  if (
    lessonUnit &&
    providers.shouldGradeProgress(mode, session.userTurnCount)
  ) {
    const graded = await providers.gradeProgress({
      lessonUnit,
      progress: session.progress,
      userMessage: message.trim(),
      assistantReply: reply,
    });

    if (graded) {
      progress = graded;
      updateProgress(sessionId, progress);
    }
  }

  return {
    reply,
    progress,
    sessionId,
    provider,
    model,
  };
}
