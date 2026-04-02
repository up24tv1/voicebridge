/**
 * Tshiluba Corpus — Server-side few-shot examples & interpreter prompts.
 * Used by Vercel API routes. Client-side code has its own copy in lib/.
 */

export const TSHILUBA_FEW_SHOT: Array<{ en: string; lua: string; fr: string }> = [
  { en: "Hello, how are you?", lua: "Moyo, udi bimpe?", fr: "Bonjour, comment allez-vous?" },
  { en: "Good morning", lua: "Moyo wa malaba", fr: "Bonjour (matin)" },
  { en: "Good evening", lua: "Moyo wa dilolo", fr: "Bonsoir" },
  { en: "I am fine, thank you", lua: "Ndi bimpe, tuashakidila", fr: "Je vais bien, merci" },
  { en: "How is your family?", lua: "Bena kuenu badi bimpe?", fr: "Comment va votre famille?" },
  { en: "Goodbye, go well", lua: "Tuaye bimpe", fr: "Au revoir, allez bien" },
  { en: "Welcome to our home", lua: "Tuakuakidila ku nzubu kuetu", fr: "Bienvenue chez nous" },
  { en: "See you tomorrow", lua: "Tuamonangana malaba", fr: "A demain" },
  { en: "What is your name?", lua: "Dina diebe nnganyi?", fr: "Comment vous appelez-vous?" },
  { en: "My name is...", lua: "Dina dianyi ndi...", fr: "Je m'appelle..." },
  { en: "My father", lua: "Tatu wanyi", fr: "Mon pere" },
  { en: "My mother", lua: "Mamuanyi", fr: "Ma mere" },
  { en: "My child", lua: "Muana wanyi", fr: "Mon enfant" },
  { en: "My brother/sister", lua: "Muanetu", fr: "Mon frere/ma soeur" },
  { en: "Elder/respected person", lua: "Mukulu", fr: "Aine/personne respectee" },
  { en: "Thank you very much", lua: "Tuashakidila bikole", fr: "Merci beaucoup" },
  { en: "Please", lua: "Ntuadijile", fr: "S'il vous plait" },
  { en: "Yes", lua: "Eyowa", fr: "Oui" },
  { en: "No", lua: "To", fr: "Non" },
  { en: "I don't understand", lua: "Tshiena kumvua to", fr: "Je ne comprends pas" },
  { en: "Please speak slowly", lua: "Ambila panyipanyi", fr: "Parlez lentement s'il vous plait" },
  { en: "I need help", lua: "Ndi dijinga dia diambuluisha", fr: "J'ai besoin d'aide" },
  { en: "Where is...?", lua: "...udi kuevi?", fr: "Ou est...?" },
  { en: "I am hungry", lua: "Nzala udi ungumina", fr: "J'ai faim" },
  { en: "Water", lua: "Mayi", fr: "Eau" },
  { en: "Food", lua: "Biakudia", fr: "Nourriture" },
  { en: "How much does this cost?", lua: "Etshi edi mushinga kayi?", fr: "Combien coute ceci?" },
  { en: "That is too expensive", lua: "Edi ne mushinga munene bikole", fr: "C'est trop cher" },
  { en: "I want to buy", lua: "Ndi musue kusumba", fr: "Je veux acheter" },
  { en: "Money", lua: "Makuta", fr: "Argent" },
  { en: "Where is the hospital?", lua: "Lupitalo ludi kuevi?", fr: "Ou est l'hopital?" },
  { en: "I am sick", lua: "Ndi mulele", fr: "Je suis malade" },
  { en: "I have a headache", lua: "Mutu udi ungumina", fr: "J'ai mal a la tete" },
  { en: "Medicine", lua: "Mushitu", fr: "Medicament" },
  { en: "Doctor", lua: "Monganga", fr: "Medecin" },
  { en: "It hurts here", lua: "Kudi kungumina apa", fr: "Ca fait mal ici" },
  { en: "I need a document", lua: "Ndi dijinga dia mukanda", fr: "J'ai besoin d'un document" },
  { en: "Identity card", lua: "Mukanda wa bumuntu", fr: "Carte d'identite" },
  { en: "I am from Congo", lua: "Ndi mufuki wa ku Congo", fr: "Je viens du Congo" },
  { en: "I need an interpreter", lua: "Ndi dijinga dia mufubu wa miaku", fr: "J'ai besoin d'un interprete" },
  { en: "One, two, three, four, five", lua: "Umwe, ibidi, isatu, inayi, itanu", fr: "Un, deux, trois, quatre, cinq" },
  { en: "Unity is strength", lua: "Bumwe budi bukole", fr: "L'union fait la force" },
  { en: "Knowledge is wealth", lua: "Dimanya didi bubanji", fr: "Le savoir est une richesse" },
];

export function buildFewShot(src: string, tgt: string): string {
  return TSHILUBA_FEW_SHOT
    .map((ex) => {
      const s = (ex as any)[src === "lua" ? "lua" : src === "fr" ? "fr" : "en"];
      const t = (ex as any)[tgt === "lua" ? "lua" : tgt === "fr" ? "fr" : "en"];
      return s && t && s !== t ? `${s} -> ${t}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

export function buildInterpreterSystemPrompt(src: string, tgt: string): string {
  const names: Record<string, string> = { en: "English", fr: "French", lua: "Tshiluba", ln: "Lingala", sw: "Swahili" };
  const srcName = names[src] || src;
  const tgtName = names[tgt] || tgt;
  const examples = buildFewShot(src, tgt);

  return `You are Matt, a professional AI interpreter specializing in Tshiluba (Ciluba), the Bantu language of the Kasai region in DR Congo.

## CORE IDENTITY
- Name: Matt
- Role: Professional Tshiluba interpreter and cultural bridge
- Tone: Calm, clear, warm, and respectful
- You are a LIVE CONVERSATIONAL INTERPRETER, not a document translator

## INTERPRETATION RULES
1. Convey the speaker's meaning faithfully. Never add, omit, or editorialize.
2. Match the speaker's formality level. Preserve emotional weight.
3. When an idiom or cultural reference doesn't translate directly, provide the closest natural equivalent AND a brief cultural note.
4. Output should sound like a native speaker said it.
5. Keep interpretations concise — match the original length.
6. If the speaker mixes Tshiluba and French (very common), interpret the full meaning seamlessly.
7. Use conversation context to resolve pronouns correctly across turns.

## TSHILUBA CULTURAL INTELLIGENCE
- GREETINGS ARE MANDATORY: Always greet and ask about family before business. Skipping is disrespectful.
- AGE HIERARCHY: Use respectful forms for elders. "Mukulu" carries authority.
- INDIRECT COMMUNICATION: Direct refusal is avoided. "We will see" often means "no."
- PROVERBS: Luba people use proverbs (bisumbu) frequently. They carry the weight of authority.
- COMMUNITY: "We" (tuetu) is preferred over "I" (meme) in formal contexts.
- CODE-SWITCHING: Numbers above 10, technical terms, and some religious language mix French and Tshiluba.

## ACTIVE SESSION
- Source: ${srcName} (${src}) -> Target: ${tgtName} (${tgt})

## RESPONSE FORMAT
Respond ONLY with a JSON object (no markdown, no code fences):
{"interpretedText": "...", "culturalNote": "optional 1-sentence cultural context", "pronunciation": "optional phonetic hint for Tshiluba output"}

## REFERENCE EXAMPLES
${examples}

CRITICAL: Output ONLY the raw JSON object. No preamble, no explanation.`;
}

export function buildTranslationSystemPrompt(src: string, tgt: string): string {
  const names: Record<string, string> = { en: "English", fr: "French", lua: "Tshiluba", ln: "Lingala", sw: "Swahili" };
  const srcName = names[src] || src;
  const tgtName = names[tgt] || tgt;
  const examples = buildFewShot(src, tgt);

  return `You are an expert translator specializing in Tshiluba (Ciluba), the Bantu language of the Kasai region, DR Congo.

Translate from ${srcName} to ${tgtName}.

Rules:
- Output ONLY the translated text, nothing else
- Preserve tone, meaning, and intent
- Use standard Central Tshiluba (Kasai dialect)
- If a word has no direct translation, use the closest natural equivalent
- Never add explanations, notes, or alternatives
${examples ? `\nReference examples:\n${examples}` : ""}`;
}
