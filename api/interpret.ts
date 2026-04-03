import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic();

const interpretRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  conversationHistory: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional()
    .default([]),
});

const FEW_SHOT = [
  { en: "Hello, how are you?", lua: "Moyo, udi bimpe?", fr: "Bonjour, comment allez-vous?" },
  { en: "Good morning", lua: "Moyo wa malaba", fr: "Bonjour (matin)" },
  { en: "I am fine, thank you", lua: "Ndi bimpe, tuashakidila", fr: "Je vais bien, merci" },
  { en: "How is your family?", lua: "Bena kuenu badi bimpe?", fr: "Comment va votre famille?" },
  { en: "Goodbye, go well", lua: "Tuaye bimpe", fr: "Au revoir, allez bien" },
  { en: "What is your name?", lua: "Dina diebe nnganyi?", fr: "Comment vous appelez-vous?" },
  { en: "Thank you very much", lua: "Tuashakidila bikole", fr: "Merci beaucoup" },
  { en: "Yes", lua: "Eyowa", fr: "Oui" },
  { en: "No", lua: "To", fr: "Non" },
  { en: "I don't understand", lua: "Tshiena kumvua to", fr: "Je ne comprends pas" },
  { en: "I need help", lua: "Ndi dijinga dia diambuluisha", fr: "J'ai besoin d'aide" },
  { en: "Where is the hospital?", lua: "Lupitalo ludi kuevi?", fr: "Ou est l'hopital?" },
  { en: "I am sick", lua: "Ndi mulele", fr: "Je suis malade" },
  { en: "How much does this cost?", lua: "Etshi edi mushinga kayi?", fr: "Combien coute ceci?" },
  { en: "Money", lua: "Makuta", fr: "Argent" },
  { en: "Water", lua: "Mayi", fr: "Eau" },
  { en: "Food", lua: "Biakudia", fr: "Nourriture" },
  { en: "Unity is strength", lua: "Bumwe budi bukole", fr: "L'union fait la force" },
  { en: "Knowledge is wealth", lua: "Dimanya didi bubanji", fr: "Le savoir est une richesse" },
];

function buildExamples(src: string, tgt: string): string {
  return FEW_SHOT.map((ex: any) => {
    const s = src === "lua" ? ex.lua : src === "fr" ? ex.fr : ex.en;
    const t = tgt === "lua" ? ex.lua : tgt === "fr" ? ex.fr : ex.en;
    return s && t && s !== t ? `${s} -> ${t}` : null;
  }).filter(Boolean).join("\n");
}

function buildPrompt(src: string, tgt: string): string {
  const names: Record<string, string> = { en: "English", fr: "French", lua: "Tshiluba" };
  const srcN = names[src] || src, tgtN = names[tgt] || tgt;
  return `You are Matt, a professional AI interpreter specializing in Tshiluba (Ciluba), the Bantu language of the Kasai region in DR Congo.

## CORE IDENTITY
- Name: Matt | Role: Professional Tshiluba interpreter and cultural bridge
- Tone: Calm, clear, warm, and respectful

## RULES
1. Convey meaning faithfully. Never add or omit.
2. Match formality level. Preserve emotional weight.
3. For idioms/cultural references, provide closest equivalent + brief cultural note.
4. Output should sound like a native speaker.
5. Keep interpretations concise.
6. Handle Tshiluba-French code-switching seamlessly.

## TSHILUBA CULTURAL INTELLIGENCE
- GREETINGS MANDATORY: Ask about family before business.
- AGE HIERARCHY: Respectful forms for elders ("Mukulu").
- INDIRECT COMMUNICATION: "We will see" often means "no."
- PROVERBS carry authority weight.
- "We" (tuetu) preferred over "I" (meme) in formal contexts.

## SESSION: ${srcN} -> ${tgtN}

## RESPONSE FORMAT (JSON only, no markdown):
{"interpretedText": "...", "culturalNote": "optional 1-sentence context", "pronunciation": "optional phonetic hint"}

## EXAMPLES
${buildExamples(src, tgt)}

Output ONLY raw JSON.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = interpretRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });

  const { text, sourceLanguage, targetLanguage, conversationHistory } = parsed.data;
  if (sourceLanguage === targetLanguage) return res.json({ interpretedText: text });

  try {
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const msg of conversationHistory.slice(-20)) messages.push({ role: msg.role, content: msg.content });
    messages.push({ role: "user", content: text });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514", max_tokens: 1024,
      system: buildPrompt(sourceLanguage, targetLanguage), messages,
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    try {
      const cleaned = rawText.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const result = JSON.parse(cleaned);
      return res.json({ interpretedText: result.interpretedText || rawText, culturalNote: result.culturalNote, pronunciation: result.pronunciation });
    } catch { return res.json({ interpretedText: rawText }); }
  } catch (error: any) {
    console.error("Interpret error:", error?.message || error);
    return res.status(500).json({ error: "Interpretation failed." });
  }
}
