import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_v3";

const ttsRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  languageCode: z.string(),
  style: z.enum(["default", "tshiluba", "greeting"]).optional().default("default"),
});

const TTS_CODES: Record<string, string | null> = {
  lua: null, en: "eng", fr: "fra", ln: "lin", sw: "swa",
};

const VOICE_SETTINGS: Record<string, any> = {
  default: { stability: 0.6, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
  tshiluba: { stability: 0.45, similarity_boost: 0.75, style: 0.55, use_speaker_boost: true },
  greeting: { stability: 0.5, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true },
};

const HINTS: Record<string, string> = {
  moyo: "mo-yo", tuashakidila: "tou-a-sha-ki-di-la", tuaye: "tou-a-yeh",
  muanetu: "mou-a-neh-tou", mukulu: "mou-kou-lou", biakudia: "bi-a-kou-di-a",
  lupitalo: "lou-pi-ta-lo", monganga: "mon-ga-nga", diambuluisha: "di-am-bou-lou-i-sha",
};

function preprocess(text: string, lang: string): string {
  if (lang !== "lua") return text;
  let r = text;
  for (const [w, h] of Object.entries(HINTS)) r = r.replace(new RegExp(`\\b${w}\\b`, "gi"), h);
  return r;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ELEVENLABS_API_KEY) return res.status(500).json({ error: "ElevenLabs API key not configured" });

  const parsed = ttsRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const { text, languageCode, style } = parsed.data;
  const elCode = TTS_CODES[languageCode];
  const voiceSettings = VOICE_SETTINGS[style] || VOICE_SETTINGS.default;
  const processedText = preprocess(text, languageCode);

  const payload: Record<string, unknown> = { text: processedText, model_id: ELEVENLABS_MODEL, voice_settings: voiceSettings };
  if (elCode) payload.language_code = elCode;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("ElevenLabs TTS error:", response.status, await response.text());
      return res.status(502).json({ error: "TTS generation failed" });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error: any) {
    console.error("TTS error:", error?.message || error);
    return res.status(500).json({ error: "TTS failed" });
  }
}
