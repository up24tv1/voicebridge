import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { interpretRequestSchema } from "../shared/schema";
import { buildInterpreterSystemPrompt } from "../shared/tshiluba-corpus";

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

    // Build messages with conversation history for context
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Include up to last 10 exchanges for context
    const recentHistory = conversationHistory.slice(-20);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add current interpretation request
    messages.push({ role: "user", content: text });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Parse the JSON response from Claude
    try {
      // Handle potential markdown fences
      const cleaned = rawText
        .replace(/^```json?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const result = JSON.parse(cleaned);

      return res.json({
        interpretedText: result.interpretedText || rawText,
        culturalNote: result.culturalNote || undefined,
        pronunciation: result.pronunciation || undefined,
      });
    } catch {
      // If JSON parsing fails, return the raw text as interpretation
      return res.json({
        interpretedText: rawText,
      });
    }
  } catch (error: any) {
    console.error("Interpret error:", error?.message || error);
    return res.status(500).json({ error: "Interpretation failed. Please try again." });
  }
}
