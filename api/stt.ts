import type { VercelRequest, VercelResponse } from "@vercel/node";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

/**
 * ElevenLabs Scribe STT proxy.
 * Accepts audio as base64 in JSON body and returns transcribed text.
 *
 * Body: { audio: string (base64), languageCode?: string }
 * Returns: { text: string, confidence?: number }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: "ElevenLabs API key not configured" });
  }

  const { audio, languageCode } = req.body || {};

  if (!audio || typeof audio !== "string") {
    return res.status(400).json({ error: "Missing audio field (base64 encoded)" });
  }

  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // Build multipart form data manually for ElevenLabs Scribe
    const boundary = "----FormBoundary" + Date.now().toString(36);
    const parts: Buffer[] = [];

    // Audio file part
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.webm"\r\nContent-Type: audio/webm\r\n\r\n`,
      ),
    );
    parts.push(audioBuffer);
    parts.push(Buffer.from("\r\n"));

    // Model part
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n`,
      ),
    );

    // Language hint (optional — helps with Tshiluba via French proximity)
    if (languageCode) {
      // Map our codes to ElevenLabs language codes
      const langMap: Record<string, string> = {
        lua: "fra", // Tshiluba -> French fallback for Scribe
        en: "eng",
        fr: "fra",
        ln: "fra", // Lingala -> French fallback
        sw: "swa",
      };
      const scribeLang = langMap[languageCode] || "eng";
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="language_code"\r\n\r\n${scribeLang}\r\n`,
        ),
      );
    }

    // Close boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs STT error:", response.status, errorText);
      return res.status(502).json({ error: "STT transcription failed" });
    }

    const result = await response.json();

    return res.json({
      text: result.text || "",
      confidence: result.confidence,
      language: languageCode,
    });
  } catch (error: any) {
    console.error("STT error:", error?.message || error);
    return res.status(500).json({ error: "STT failed" });
  }
}
