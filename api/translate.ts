import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { translateRequestSchema, SUPPORTED_LANGUAGES, buildTranslationSystemPrompt } from "./_shared";

const anthropic = new Anthropic();

function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = translateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    }

    const { text, sourceLanguage, targetLanguage } = parsed.data;

    if (sourceLanguage === targetLanguage) {
      return res.json({ translatedText: text, sourceLanguage, targetLanguage });
    }

    const systemPrompt = buildTranslationSystemPrompt(sourceLanguage, targetLanguage);
    const sourceName = getLanguageName(sourceLanguage);
    const targetName = getLanguageName(targetLanguage);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: `Translate from ${sourceName} to ${targetName}:\n\n${text}` }],
      system: systemPrompt,
    });

    const translatedText = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return res.json({ translatedText, sourceLanguage, targetLanguage });
  } catch (error: any) {
    console.error("Translation error:", error?.message || error);
    return res.status(500).json({ error: "Translation failed. Please try again." });
  }
}
