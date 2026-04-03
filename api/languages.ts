import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPPORTED_LANGUAGES = [
  { code: "lua", name: "Tshiluba", flag: "cd", tier: "low" },
  { code: "en", name: "English", flag: "gb", tier: "high" },
  { code: "fr", name: "French", flag: "fr", tier: "high" },
  { code: "ln", name: "Lingala", flag: "cd", tier: "low" },
  { code: "sw", name: "Swahili", flag: "ke", tier: "medium" },
];

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json(SUPPORTED_LANGUAGES);
}
