const LANGUAGE_NAMES = {
  en: "English",
  de: "German",
};

const CEFR_GUIDANCE = {
  A1: "Use very short sentences, basic vocabulary, high repetition. Allow minor learner errors without interrupting flow unless in correct mode.",
  A2: "Use simple everyday language, short paragraphs, limited idioms.",
  B1: "Use varied sentence patterns, moderate topic depth, some common idioms.",
  B2: "Use natural conversational length, broader vocabulary, light idioms.",
  C1: "Use nuanced vocabulary and complex structures while staying clear.",
  C2: "Use idiomatic, fluent language appropriate for advanced learners.",
};

const MODE_BEHAVIOR = {
  chat: `Mode: Chat with me.
- Prioritize natural conversation and confidence.
- Understand imperfect input; do not over-correct.
- Keep the exchange engaging and warm.`,
  correct: `Mode: Correct me.
- Reply naturally in the target language first.
- Then add a brief correction block (see correction style).
- Be encouraging; never shame the learner.`,
  teach: `Mode: Teach me.
- Reply naturally, then teach 1-2 words or phrases tied to the user's message.
- Include a short grammar tip linked to what they wrote.
- Prompt the learner to reuse new language in their next message.`,
};

const CORRECTION_STYLE = {
  inline: "Correction style: inline — weave the fix into your natural reply when possible, then note the original vs corrected form briefly.",
  end: "Correction style: end-of-message — put all corrections after your natural reply under a line starting with 'Corrections:'",
  explain: "Correction style: explain — after your natural reply, give the fix and one sentence explaining the rule.",
};

/**
 * @param {{
 *   targetLanguage: string;
 *   cefrLevel: string;
 *   mode: string;
 *   correctionStyle: string;
 *   lessonUnit?: object | null;
 *   progress?: object | null;
 *   strictTargetLanguageOnly?: boolean;
 *   supportLanguage?: string;
 * }} params
 */
export function buildSystemPrompt(params) {
  const {
    targetLanguage,
    cefrLevel,
    mode,
    correctionStyle,
    lessonUnit,
    progress,
    strictTargetLanguageOnly = false,
    supportLanguage = "en",
  } = params;

  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  const supportName = LANGUAGE_NAMES[supportLanguage] || supportLanguage;
  const cefrGuide = CEFR_GUIDANCE[cefrLevel] || CEFR_GUIDANCE.A1;
  const modeGuide = MODE_BEHAVIOR[mode] || MODE_BEHAVIOR.chat;
  const correctionGuide =
    mode === "correct"
      ? CORRECTION_STYLE[correctionStyle] || CORRECTION_STYLE.end
      : "";

  const lessonBlock = lessonUnit
    ? `
Active lesson unit: ${lessonUnit.title} (${lessonUnit.unitId})
CEFR: ${lessonUnit.cefrLevel}
Objectives: ${lessonUnit.objectives.join("; ")}
Target phrases: ${lessonUnit.targetPhrases.join(" | ")}
Grammar focus: ${(lessonUnit.grammarFocus || []).join("; ") || "none"}
Progress completed: ${(progress?.completedObjectives || []).join("; ") || "none yet"}
`
    : "No active lesson unit — free conversation.";

  const languageRule = strictTargetLanguageOnly
    ? `Speak only in ${langName}. Do not switch to ${supportName} unless the user explicitly asks for help in ${supportName}.`
    : `Primary language: ${langName}. You may use brief ${supportName} explanations for A1–A2 learners when teaching grammar, but keep practice in ${langName}.`;

  return `You are a supportive language practice partner for ${langName} learners.

${languageRule}

Learner CEFR level: ${cefrLevel}
${cefrGuide}

${modeGuide}
${correctionGuide}

${lessonBlock}

Response format:
1. Put your natural conversational reply first.
2. If mode is "correct" or "teach", add a second short block after a blank line:
   - correct: corrections only
   - teach: "Teaching:" with 1-2 new words/phrases and one grammar tip

Stay concise. Be warm and motivating.`;
}

export function buildProgressGradingPrompt({
  lessonUnit,
  progress,
  userMessage,
  assistantReply,
}) {
  return `You grade language lesson progress. Return ONLY valid JSON matching this shape:
{"unitId":"string","completedObjectives":["string"],"phrasesPracticed":["string"],"notes":"string"}

Unit objectives: ${JSON.stringify(lessonUnit.objectives)}
Target phrases: ${JSON.stringify(lessonUnit.targetPhrases)}
Already completed: ${JSON.stringify(progress?.completedObjectives || [])}
Already practiced phrases: ${JSON.stringify(progress?.phrasesPracticed || [])}

User message: ${userMessage}
Assistant reply: ${assistantReply}

Mark an objective complete only if the user demonstrated it clearly. Add phrases to phrasesPracticed if used or attempted. Keep notes under 120 characters.`;
}
