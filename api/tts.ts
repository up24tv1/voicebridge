import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ttsRequestSchema, ELEVENLABS_VOICE_SETTINGS, LANGUAGE_CONFIGS } from "./_shared";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_v3";

const PRONUNCIATION_HINTS: Record<string, string> = {
  moyo: "mo-yo", tuashakidila: "tou-a-sha-ki-di-la", tuaye: "tou-a-yeh",
  muanetu: "mou-a-neh-tou", mukulu: "mou-kou-lou", biakudia: "bi-a-kou-di-a",
  lupitalo: "lou-pi-ta-lo", monganga: "mon-ga-nga", diambuluisha: "di-am-bou-lou-i-sha",
  kumvua: "koum-vou-a", kusumba: "kou-soum-ba",
};

function preprocessText(text: string, languageCode: string): string {
  if (languageCode !== "lua") return text;
  let processed = text;
  for (const [word, hint] of Object.entries(PRONUNCIATION_HINTS)) {
    processed = processed.replace(new RegExp(`\\b${word}\\b`, "gi"), hint);
  }
  return processed;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ELEVENLABS_API_KEY) return res.status(500).json({ error: "ElevenLabs API key not configured" });

  const parsed = ttsRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });

  const { text, languageCode, style } = parsed.data;
  const langConfig = LANGUAGE_CONFIGS[languageCode];
  const elCode = langConfig?.elevenlabs.ttsCode;
  const voiceSettings = style === "tshiluba" ? ELEVENLABS_VOICE_SETTINGS.tshiluba
    : style === "greeting" ? ELEVENLABS_VOICE_SETTINGS.greeting
    : ELEVENLABS_VOICE_SETTINGS.default;

  const processedText = preprocessText(text, languageCode);
  const payload: Record<string, unknown> = { text: processedText, model_id: ELEVENLABS_MODEL, voice_settings: voiceSettings };
  if (elCode) payload.language_code = elCode;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      return res.status(502).json({ error: "TTS generation failed" });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error("TTS error:", error?.message || error);
    return res.status(500).json({ error: "TTS failed" });
  }
}
