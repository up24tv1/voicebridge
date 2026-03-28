import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { translateRequestSchema, SUPPORTED_LANGUAGES } from '../shared/schema';

const anthropic = new Anthropic();

const LINGALA_EXAMPLES = `
English: Hello, how are you? → Lingala: Mbote, ozali malamu?
English: Thank you very much → Lingala: Melesi mingi
English: What is your name? → Lingala: Kombo na yo nani?
English: I need help → Lingala: Nazali na mposa ya lisalisi
English: Good morning → Lingala: Mbote na tongo
English: Where is the hospital? → Lingala: Lopitalo ezali wapi?
English: I don't understand → Lingala: Nayoki te
English: How much does this cost? → Lingala: Oyo ezali ntalo boni?
French: Bonjour, comment allez-vous? → Lingala: Mbote, ozali malamu?
French: Merci beaucoup → Lingala: Melesi mingi
French: Je ne comprends pas → Lingala: Nayoki te
French: Où est l'hôpital? → Lingala: Lopitalo ezali wapi?
`;

const TSHILUBA_EXAMPLES = `
English: Hello, how are you? → Tshiluba: Moyo, udi bimpe?
English: Thank you very much → Tshiluba: Tuashakidila bikole
English: What is your name? → Tshiluba: Dîna diebe nnganyi?
English: I need help → Tshiluba: Ndi dijinga dia diambuluisha
English: Good morning → Tshiluba: Moyo wa malaba
English: Where is the hospital? → Tshiluba: Lupitalo ludi kuevi?
English: I don't understand → Tshiluba: Tshiena kumvua to
English: How much does this cost? → Tshiluba: Etshi edi mushinga kayi?
French: Bonjour, comment allez-vous? → Tshiluba: Moyo, udi bimpe?
French: Merci beaucoup → Tshiluba: Tuashakidila bikole
French: Je ne comprends pas → Tshiluba: Tshiena kumvua to
French: Où est l'hôpital? → Tshiluba: Lupitalo ludi kuevi?
`;

function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code;
}

function getFewShotExamples(targetLang: string): string {
  if (targetLang === 'ln') return LINGALA_EXAMPLES;
  if (targetLang === 'lua') return TSHILUBA_EXAMPLES;
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = translateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { text, sourceLanguage, targetLanguage } = parsed.data;
    const sourceName = getLanguageName(sourceLanguage);
    const targetName = getLanguageName(targetLanguage);

    if (sourceLanguage === targetLanguage) {
      return res.json({ translatedText: text, sourceLanguage, targetLanguage });
    }

    const fewShot = getFewShotExamples(targetLanguage) || getFewShotExamples(sourceLanguage);

    const systemPrompt = `You are an expert multilingual translator specializing in African languages, particularly Congolese languages (Lingala, Tshiluba), as well as French, Swahili, English, Arabic, and Chinese (Mandarin).

Your task: Translate the given text from ${sourceName} to ${targetName}.

Rules:
- Output ONLY the translated text, nothing else
- Preserve the tone, meaning, and intent of the original
- For Lingala and Tshiluba: use the most common/standard dialect
- If a word has no direct translation, use the closest natural equivalent
- Never add explanations, notes, or alternatives${fewShot ? `

Reference translation examples for guidance:
${fewShot}` : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Translate from ${sourceName} to ${targetName}:\n\n${text}`,
        },
      ],
      system: systemPrompt,
    });

    const translatedText =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    return res.json({ translatedText, sourceLanguage, targetLanguage });
  } catch (error: any) {
    console.error('Translation error:', error?.message || error);
    return res.status(500).json({ error: 'Translation failed. Please try again.' });
  }
}
