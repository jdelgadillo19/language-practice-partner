import { config } from "../config.js";

/**
 * @param {{
 *   system: string;
 *   messages?: Array<{ role: string; content: string }>;
 *   user?: string;
 *   jsonMode?: boolean;
 *   temperature?: number;
 * }} params
 */
export async function chatWithOpenAI({
  system,
  messages,
  user,
  jsonMode = false,
  temperature = 0.8,
}) {
  const { apiKey, model, baseUrl } = config.openai;
  const url = `${baseUrl}/chat/completions`;

  const openaiMessages = messages?.length
    ? [
        { role: "system", content: system },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ]
    : [
        { role: "system", content: system },
        { role: "user", content: user || "" },
      ];

  const body = {
    model,
    messages: openaiMessages,
    temperature: jsonMode ? 0.2 : temperature,
    max_tokens: 1024,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  return text;
}
