import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic();

const translateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
});

const LANGS = [
  { code: "lua", name: "Tshiluba" }, { code: "en", name: "English" },
  { code: "fr", name: "French" }, { code: "ln", name: "Lingala" }, { code: "sw", name: "Swahili" },
];

const FEW_SHOT = [
  { en: "Hello, how are you?", lua: "Moyo, udi bimpe?", fr: "Bonjour, comment allez-vous?" },
  { en: "Good morning", lua: "Moyo wa malaba", fr: "Bonjour (matin)" },
  { en: "I am fine, thank you", lua: "Ndi bimpe, tuashakidila", fr: "Je vais bien, merci" },
  { en: "Goodbye, go well", lua: "Tuaye bimpe", fr: "Au revoir, allez bien" },
  { en: "What is your name?", lua: "Dina diebe nnganyi?", fr: "Comment vous appelez-vous?" },
  { en: "Thank you very much", lua: "Tuashakidila bikole", fr: "Merci beaucoup" },
  { en: "I don't understand", lua: "Tshiena kumvua to", fr: "Je ne comprends pas" },
  { en: "I need help", lua: "Ndi dijinga dia diambuluisha", fr: "J'ai besoin d'aide" },
  { en: "Where is the hospital?", lua: "Lupitalo ludi kuevi?", fr: "Ou est l'hopital?" },
  { en: "How much does this cost?", lua: "Etshi edi mushinga kayi?", fr: "Combien coute ceci?" },
  { en: "Water", lua: "Mayi", fr: "Eau" },
  { en: "Food", lua: "Biakudia", fr: "Nourriture" },
  { en: "Unity is strength", lua: "Bumwe budi bukole", fr: "L'union fait la force" },
];

function buildExamples(src: string, tgt: string): string {
  return FEW_SHOT.map((ex: any) => {
    const s = src === "lua" ? ex.lua : src === "fr" ? ex.fr : ex.en;
    const t = tgt === "lua" ? ex.lua : tgt === "fr" ? ex.fr : ex.en;
    return s && t && s !== t ? `${s} -> ${t}` : null;
  }).filter(Boolean).join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const parsed = translateRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });

    const { text, sourceLanguage, targetLanguage } = parsed.data;
    if (sourceLanguage === targetLanguage) return res.json({ translatedText: text, sourceLanguage, targetLanguage });

    const srcName = LANGS.find(l => l.code === sourceLanguage)?.name || sourceLanguage;
    const tgtName = LANGS.find(l => l.code === targetLanguage)?.name || targetLanguage;
    const examples = buildExamples(sourceLanguage, targetLanguage);

    const systemPrompt = `You are an expert translator specializing in Tshiluba (Ciluba), the Bantu language of the Kasai region, DR Congo.

Translate from ${srcName} to ${tgtName}.

Rules:
- Output ONLY the translated text, nothing else
- Preserve tone, meaning, and intent
- Use standard Central Tshiluba (Kasai dialect)
- If a word has no direct translation, use the closest natural equivalent
- Never add explanations, notes, or alternatives
${examples ? `\nReference examples:\n${examples}` : ""}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20241022", max_tokens: 2048,
      messages: [{ role: "user", content: `Translate from ${srcName} to ${tgtName}:\n\n${text}` }],
      system: systemPrompt,
    });

    const translatedText = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return res.json({ translatedText, sourceLanguage, targetLanguage });
  } catch (error: any) {
    console.error("Translation error:", error?.message || error);
    return res.status(500).json({ error: "Translation failed." });
  }
}
