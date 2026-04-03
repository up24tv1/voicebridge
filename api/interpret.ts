import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { interpretRequestSchema, buildInterpreterSystemPrompt } from "./_shared";

const anthropic = new Anthropic();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = interpretRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
  }

  const { text, sourceLanguage, targetLanguage, conversationHistory } = parsed.data;

  if (sourceLanguage === targetLanguage) {
    return res.json({ interpretedText: text });
  }

  try {
    const systemPrompt = buildInterpreterSystemPrompt(sourceLanguage, targetLanguage);

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    const recentHistory = conversationHistory.slice(-20);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: text });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    try {
      const cleaned = rawText.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const result = JSON.parse(cleaned);
      return res.json({
        interpretedText: result.interpretedText || rawText,
        culturalNote: result.culturalNote || undefined,
        pronunciation: result.pronunciation || undefined,
      });
    } catch {
      return res.json({ interpretedText: rawText });
    }
  } catch (error: any) {
    console.error("Interpret error:", error?.message || error);
    return res.status(500).json({ error: "Interpretation failed. Please try again." });
  }
}
