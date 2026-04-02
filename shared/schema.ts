import { z } from "zod";

// Language configuration
export const SUPPORTED_LANGUAGES = [
  { code: "lua", name: "Tshiluba", flag: "cd", tier: "low" as const },
  { code: "en", name: "English", flag: "gb", tier: "high" as const },
  { code: "fr", name: "French", flag: "fr", tier: "high" as const },
  { code: "ln", name: "Lingala", flag: "cd", tier: "low" as const },
  { code: "sw", name: "Swahili", flag: "ke", tier: "medium" as const },
] as const;

export function getFlagUrl(countryCode: string, size: number = 40): string {
  return `https://flagcdn.com/w${size}/${countryCode}.png`;
}

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// Translation (single-shot)
export const translateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
});

export type TranslateRequest = z.infer<typeof translateRequestSchema>;

// Interpreter (conversation mode)
export const interpretRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export type InterpretRequest = z.infer<typeof interpretRequestSchema>;

export interface InterpretResponse {
  interpretedText: string;
  culturalNote?: string;
  pronunciation?: string;
}

// TTS
export const ttsRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  languageCode: z.string(),
  style: z.enum(["default", "tshiluba", "greeting"]).optional().default("default"),
});

export type TTSRequest = z.infer<typeof ttsRequestSchema>;

// STT
export const sttResponseSchema = z.object({
  text: z.string(),
  confidence: z.number().optional(),
  language: z.string().optional(),
});

export type STTResponse = z.infer<typeof sttResponseSchema>;
