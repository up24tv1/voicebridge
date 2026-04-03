import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPPORTED_LANGUAGES } from './_shared';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json(SUPPORTED_LANGUAGES);
}
