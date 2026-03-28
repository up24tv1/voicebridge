import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPPORTED_LANGUAGES } from '../shared/schema';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json(SUPPORTED_LANGUAGES);
}
