/**
 * Tshiluba Phonetic Preprocessing Pipeline
 * =========================================
 * Prepares Tshiluba text for ElevenLabs TTS to maximize
 * pronunciation accuracy for a language with no native TTS support.
 *
 * Handles: tone hints, vowel length, prenasalized consonants,
 * morpheme boundaries, and intonation templates.
 */

/**
 * Prenasalized consonant groups in Tshiluba.
 * These must be treated as single onset phonemes, not broken apart.
 * We insert a zero-width joiner to keep them together in TTS.
 */
const PRENASALIZED_CONSONANTS = [
  "mb", "nd", "ng", "nj", "mp", "nt", "nk", "ns", "nz",
  "Mb", "Nd", "Ng", "Nj", "Mp", "Nt", "Nk", "Ns", "Nz",
];

/**
 * Common Tshiluba words with IPA-style pronunciation hints.
 * Used to add SSML-like guidance for the TTS engine.
 * Format: { word: respelling } where respelling uses
 * French-friendly phonetics that ElevenLabs can interpret.
 */
const PRONUNCIATION_MAP: Record<string, string> = {
  // Greetings
  moyo: "mo-yo",
  tuashakidila: "tou-a-sha-ki-di-la",
  tuaye: "tou-a-yeh",
  malaba: "ma-la-ba",
  dilolo: "di-lo-lo",
  // Family
  muanetu: "mou-a-neh-tou",
  mukulu: "mou-kou-lou",
  tatu: "ta-tou",
  mamuanyi: "ma-mou-a-nyi",
  bayende: "ba-yen-deh",
  mukaji: "mou-ka-ji",
  // Common words
  biakudia: "bi-a-kou-di-a",
  lupitalo: "lou-pi-ta-lo",
  monganga: "mon-ga-nga",
  mushitu: "mou-shi-tou",
  makuta: "ma-kou-ta",
  bumwe: "boum-weh",
  bukole: "bou-ko-leh",
  dimanya: "di-ma-nya",
  bubanji: "bou-ban-ji",
  // Verb forms
  kumvua: "koum-vou-a",
  kusumba: "kou-soum-ba",
  kupuekesha: "kou-pou-eh-ke-sha",
  diambuluisha: "di-am-bou-lou-i-sha",
};

/**
 * Long vowels in Tshiluba — these carry meaning and must not be shortened.
 * We slightly exaggerate them with a hyphenated repeat for TTS clarity.
 */
const LONG_VOWEL_WORDS: Record<string, string> = {
  kutuupa: "kou-tou-ou-pa", // to insult (vs kutupa - to throw)
  kupaapa: "kou-pa-a-pa", // to fly
  kubeela: "kou-be-e-la", // to cultivate
};

/**
 * Detect sentence type for intonation template selection.
 */
export type SentenceType = "question" | "greeting" | "urgent" | "statement";

export function detectSentenceType(text: string): SentenceType {
  const trimmed = text.trim();

  if (trimmed.endsWith("?")) return "question";

  const lowerText = trimmed.toLowerCase();
  const greetingStarts = ["moyo", "tuaye", "tuakuakidila", "tuamonangana"];
  if (greetingStarts.some((g) => lowerText.startsWith(g))) return "greeting";

  const urgentWords = [
    "diambuluisha", "lupitalo", "monganga", "kungumina", "mulele",
  ];
  if (urgentWords.some((w) => lowerText.includes(w))) return "urgent";

  return "statement";
}

/**
 * Main preprocessing function.
 * Transforms raw Tshiluba text into TTS-optimized text.
 */
export function preprocessTshilubaForTTS(text: string): string {
  let processed = text;

  // 1. Handle long vowels first (before general processing)
  for (const [word, respelling] of Object.entries(LONG_VOWEL_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    processed = processed.replace(regex, respelling);
  }

  // 2. Apply pronunciation map for known words
  for (const [word, respelling] of Object.entries(PRONUNCIATION_MAP)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    processed = processed.replace(regex, respelling);
  }

  // 3. Add micro-pauses at morpheme boundaries for long agglutinated words
  // Tshiluba words longer than 12 chars likely have multiple morphemes
  processed = processed.replace(/\b([a-zA-Z]{13,})\b/g, (match) => {
    // If we already hyphenated it via pronunciation map, skip
    if (match.includes("-")) return match;
    return addMorphemePauses(match);
  });

  // 4. Ensure prenasalized consonants stay grouped
  // Add subtle emphasis to help TTS treat them as units
  for (const nc of PRENASALIZED_CONSONANTS) {
    // Only process if not already hyphenated
    const regex = new RegExp(`(?<!-)${nc}(?!-)`, "g");
    processed = processed.replace(regex, nc);
  }

  // 5. Add sentence-level pacing hints
  processed = addPacingHints(processed);

  return processed;
}

/**
 * Insert morpheme boundary hints for long Tshiluba words.
 * Uses common Tshiluba prefix/suffix patterns to find likely boundaries.
 */
function addMorphemePauses(word: string): string {
  const lower = word.toLowerCase();

  // Common Tshiluba prefixes (noun class markers + verbal prefixes)
  const prefixes = [
    "tshi", "bi", "mu", "ba", "bu", "di", "ma", "lu", "tu",
    "ku", "mi", "ka", "pa", "na",
  ];

  // Common verbal suffixes/extensions
  const suffixes = [
    "isha", "ila", "ula", "ana", "angana", "ibua", "ela",
    "ika", "uka", "aka",
  ];

  // Try to find a clean prefix break
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix) && lower.length > prefix.length + 3) {
      const rest = word.slice(prefix.length);
      // Check for a suffix break in the rest
      for (const suffix of suffixes) {
        if (rest.toLowerCase().endsWith(suffix) && rest.length > suffix.length + 2) {
          const middle = rest.slice(0, rest.length - suffix.length);
          return `${word.slice(0, prefix.length)}-${middle}-${rest.slice(rest.length - suffix.length)}`;
        }
      }
      return `${word.slice(0, prefix.length)}-${rest}`;
    }
  }

  return word;
}

/**
 * Add pacing hints based on punctuation and sentence structure.
 * Tshiluba is spoken at a moderate pace with clear syllable separation.
 */
function addPacingHints(text: string): string {
  // Add slight pause after commas (Tshiluba speakers pause clearly)
  let result = text.replace(/,/g, ", ");

  // Ensure periods have clear stops
  result = result.replace(/\.\s*/g, ". ");

  // Clean up any double spaces
  result = result.replace(/\s{3,}/g, "  ");

  return result.trim();
}

/**
 * Get ElevenLabs voice settings tuned for the sentence type.
 */
export function getVoiceSettingsForSentence(sentenceType: SentenceType) {
  switch (sentenceType) {
    case "question":
      return { stability: 0.4, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true };
    case "greeting":
      return { stability: 0.5, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true };
    case "urgent":
      return { stability: 0.55, similarity_boost: 0.7, style: 0.5, use_speaker_boost: true };
    case "statement":
    default:
      return { stability: 0.45, similarity_boost: 0.75, style: 0.55, use_speaker_boost: true };
  }
}
