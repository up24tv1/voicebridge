import { z } from "zod";

// Language configuration
// Using country codes for flag CDN images (flagcdn.com)
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "gb", tier: "high" },
  { code: "fr", name: "French", flag: "fr", tier: "high" },
  { code: "sw", name: "Swahili", flag: "ke", tier: "medium" },
  { code: "ar", name: "Arabic", flag: "sa", tier: "high" },
  { code: "zh", name: "Chinese", flag: "cn", tier: "high" },
  { code: "ln", name: "Lingala", flag: "cd", tier: "low" },
  { code: "lua", name: "Tshiluba", flag: "cd", tier: "very-low" },
] as const;

export function getFlagUrl(countryCode: string, size: number = 40): string {
  return `https://flagcdn.com/w${size}/${countryCode}.png`;
}

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const translateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
});

export type TranslateRequest = z.infer<typeof translateRequestSchema>;
