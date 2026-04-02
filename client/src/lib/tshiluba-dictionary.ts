/**
 * Tshiluba Interpreter — Core Dictionary & Few-Shot Corpus
 * ========================================================
 * 50+ translation examples for Claude few-shot prompting.
 * Covers: greetings, family, market, medical, legal, proverbs, and daily life.
 * Dialect: Central Tshiluba (Kasai region, DR Congo)
 */

export interface TranslationExample {
  english: string;
  tshiluba: string;
  french: string;
  category: string;
  culturalNote?: string;
}

export const TSHILUBA_EXAMPLES: TranslationExample[] = [
  // ── Greetings & Leave-Taking ──────────────────────────────────
  {
    english: "Hello, how are you?",
    tshiluba: "Moyo, udi bimpe?",
    french: "Bonjour, comment allez-vous?",
    category: "greeting",
  },
  {
    english: "Good morning",
    tshiluba: "Moyo wa malaba",
    french: "Bonjour (matin)",
    category: "greeting",
  },
  {
    english: "Good evening",
    tshiluba: "Moyo wa dilolo",
    french: "Bonsoir",
    category: "greeting",
  },
  {
    english: "I am fine, thank you",
    tshiluba: "Ndi bimpe, tuashakidila",
    french: "Je vais bien, merci",
    category: "greeting",
  },
  {
    english: "How is your family?",
    tshiluba: "Bena kuenu badi bimpe?",
    french: "Comment va votre famille?",
    category: "greeting",
    culturalNote:
      "In Luba culture, asking about family before business is a sign of respect and proper social conduct.",
  },
  {
    english: "Goodbye, go well",
    tshiluba: "Tuaye bimpe",
    french: "Au revoir, allez bien",
    category: "greeting",
  },
  {
    english: "Welcome to our home",
    tshiluba: "Tuakuakidila ku nzubu kuetu",
    french: "Bienvenue chez nous",
    category: "greeting",
    culturalNote:
      "Hospitality is sacred in Luba culture. A guest is treated with the highest honor.",
  },
  {
    english: "See you tomorrow",
    tshiluba: "Tuamonangana malaba",
    french: "A demain",
    category: "greeting",
  },

  // ── Family & Kinship ──────────────────────────────────────────
  {
    english: "What is your name?",
    tshiluba: "Dina diebe nnganyi?",
    french: "Comment vous appelez-vous?",
    category: "family",
  },
  {
    english: "My name is...",
    tshiluba: "Dina dianyi ndi...",
    french: "Je m'appelle...",
    category: "family",
  },
  {
    english: "My father",
    tshiluba: "Tatu wanyi",
    french: "Mon pere",
    category: "family",
  },
  {
    english: "My mother",
    tshiluba: "Mamuanyi",
    french: "Ma mere",
    category: "family",
  },
  {
    english: "My child",
    tshiluba: "Muana wanyi",
    french: "Mon enfant",
    category: "family",
  },
  {
    english: "My brother/sister",
    tshiluba: "Muanetu",
    french: "Mon frere/ma soeur",
    category: "family",
    culturalNote:
      "Tshiluba uses 'muanetu' for both brother and sister — gender is implied by context. Extended family members are addressed with the same kinship terms as immediate family.",
  },
  {
    english: "My husband",
    tshiluba: "Bayende",
    french: "Mon mari",
    category: "family",
  },
  {
    english: "My wife",
    tshiluba: "Mukaji wanyi",
    french: "Ma femme",
    category: "family",
  },
  {
    english: "Elder/respected person",
    tshiluba: "Mukulu",
    french: "Aine/personne respectee",
    category: "family",
    culturalNote:
      "Age-based respect is fundamental in Luba society. Elders are addressed with special honorifics and consulted on all major decisions.",
  },

  // ── Daily Life & Conversation ─────────────────────────────────
  {
    english: "Thank you very much",
    tshiluba: "Tuashakidila bikole",
    french: "Merci beaucoup",
    category: "daily",
  },
  {
    english: "Please",
    tshiluba: "Ntuadijile",
    french: "S'il vous plait",
    category: "daily",
  },
  {
    english: "Yes",
    tshiluba: "Eyowa",
    french: "Oui",
    category: "daily",
  },
  {
    english: "No",
    tshiluba: "To",
    french: "Non",
    category: "daily",
  },
  {
    english: "I don't understand",
    tshiluba: "Tshiena kumvua to",
    french: "Je ne comprends pas",
    category: "daily",
  },
  {
    english: "Please speak slowly",
    tshiluba: "Ambila panyipanyi",
    french: "Parlez lentement s'il vous plait",
    category: "daily",
  },
  {
    english: "I need help",
    tshiluba: "Ndi dijinga dia diambuluisha",
    french: "J'ai besoin d'aide",
    category: "daily",
  },
  {
    english: "Where is...?",
    tshiluba: "...udi kuevi?",
    french: "Ou est...?",
    category: "daily",
  },
  {
    english: "I am hungry",
    tshiluba: "Nzala udi ungumina",
    french: "J'ai faim",
    category: "daily",
  },
  {
    english: "I am thirsty",
    tshiluba: "Nyota udi ungumina",
    french: "J'ai soif",
    category: "daily",
  },
  {
    english: "Water",
    tshiluba: "Mayi",
    french: "Eau",
    category: "daily",
  },
  {
    english: "Food",
    tshiluba: "Biakudia",
    french: "Nourriture",
    category: "daily",
  },

  // ── Market & Commerce ─────────────────────────────────────────
  {
    english: "How much does this cost?",
    tshiluba: "Etshi edi mushinga kayi?",
    french: "Combien coute ceci?",
    category: "market",
  },
  {
    english: "That is too expensive",
    tshiluba: "Edi ne mushinga munene bikole",
    french: "C'est trop cher",
    category: "market",
  },
  {
    english: "Can you reduce the price?",
    tshiluba: "Udi mua kupuekesha mushinga?",
    french: "Pouvez-vous reduire le prix?",
    category: "market",
    culturalNote:
      "Bargaining is a normal and expected part of market transactions in Kasai. It is a social interaction, not confrontational.",
  },
  {
    english: "I want to buy",
    tshiluba: "Ndi musue kusumba",
    french: "Je veux acheter",
    category: "market",
  },
  {
    english: "Money",
    tshiluba: "Makuta",
    french: "Argent",
    category: "market",
  },

  // ── Medical & Health ──────────────────────────────────────────
  {
    english: "Where is the hospital?",
    tshiluba: "Lupitalo ludi kuevi?",
    french: "Ou est l'hopital?",
    category: "medical",
  },
  {
    english: "I am sick",
    tshiluba: "Ndi mulele",
    french: "Je suis malade",
    category: "medical",
  },
  {
    english: "I have a headache",
    tshiluba: "Mutu udi ungumina",
    french: "J'ai mal a la tete",
    category: "medical",
  },
  {
    english: "I have a fever",
    tshiluba: "Ndi ne malaria",
    french: "J'ai de la fievre",
    category: "medical",
  },
  {
    english: "Medicine",
    tshiluba: "Mushitu",
    french: "Medicament",
    category: "medical",
  },
  {
    english: "Doctor",
    tshiluba: "Monganga",
    french: "Medecin",
    category: "medical",
  },
  {
    english: "It hurts here",
    tshiluba: "Kudi kungumina apa",
    french: "Ca fait mal ici",
    category: "medical",
  },

  // ── Legal & Administrative ────────────────────────────────────
  {
    english: "I need a document",
    tshiluba: "Ndi dijinga dia mukanda",
    french: "J'ai besoin d'un document",
    category: "legal",
  },
  {
    english: "Identity card",
    tshiluba: "Mukanda wa bumuntu",
    french: "Carte d'identite",
    category: "legal",
  },
  {
    english: "I am from Congo",
    tshiluba: "Ndi mufuki wa ku Congo",
    french: "Je viens du Congo",
    category: "legal",
  },
  {
    english: "I need an interpreter",
    tshiluba: "Ndi dijinga dia mufubu wa miaku",
    french: "J'ai besoin d'un interprete",
    category: "legal",
  },

  // ── Numbers ───────────────────────────────────────────────────
  {
    english: "One, two, three, four, five",
    tshiluba: "Umwe, ibidi, isatu, inayi, itanu",
    french: "Un, deux, trois, quatre, cinq",
    category: "numbers",
  },
  {
    english: "Six, seven, eight, nine, ten",
    tshiluba: "Isambombo, muanda-mutekete, muanda-mukulu, tshitema, dikumi",
    french: "Six, sept, huit, neuf, dix",
    category: "numbers",
  },

  // ── Proverbs & Wisdom ─────────────────────────────────────────
  {
    english: "A person who has good hands, good things come to them",
    tshiluba: "Muntu udi ne bianza bimpe, bimpe bimufikila",
    french: "Une personne aux bonnes mains recoit de bonnes choses",
    category: "proverb",
    culturalNote:
      "This Luba proverb speaks to the concept of generosity and reciprocity — kindness given returns to the giver.",
  },
  {
    english: "Unity is strength",
    tshiluba: "Bumwe budi bukole",
    french: "L'union fait la force",
    category: "proverb",
    culturalNote:
      "A foundational principle in Luba philosophy. Community solidarity is valued above individual achievement.",
  },
  {
    english: "A tree does not grow without roots",
    tshiluba: "Mutshi kawena kukola kayi ne mishiya",
    french: "Un arbre ne pousse pas sans racines",
    category: "proverb",
    culturalNote:
      "Emphasizes the importance of knowing your origins. In Luba culture, genealogy and ancestral connections define identity.",
  },
  {
    english: "The child who asks questions does not get lost",
    tshiluba: "Muana utu udisha nzubu kalendi kushimina to",
    french: "L'enfant qui pose des questions ne se perd pas",
    category: "proverb",
    culturalNote:
      "Encourages curiosity and humility. In Luba education, asking elders is the primary way of learning.",
  },
  {
    english: "Knowledge is wealth",
    tshiluba: "Dimanya didi bubanji",
    french: "Le savoir est une richesse",
    category: "proverb",
  },
];

/**
 * Build few-shot prompt string for a given language pair direction.
 */
export function buildFewShotExamples(
  sourceLang: string,
  targetLang: string,
): string {
  const lines: string[] = [];

  for (const ex of TSHILUBA_EXAMPLES) {
    const source =
      sourceLang === "en"
        ? ex.english
        : sourceLang === "fr"
          ? ex.french
          : ex.tshiluba;
    const target =
      targetLang === "en"
        ? ex.english
        : targetLang === "fr"
          ? ex.french
          : ex.tshiluba;

    if (source && target && source !== target) {
      lines.push(`${source} -> ${target}`);
    }
  }

  return lines.join("\n");
}

/**
 * Get cultural notes relevant to the interpreted text (keyword match).
 */
export function findCulturalNotes(text: string): string[] {
  const lower = text.toLowerCase();
  return TSHILUBA_EXAMPLES.filter(
    (ex) =>
      ex.culturalNote &&
      (lower.includes(ex.tshiluba.toLowerCase().split(" ")[0]) ||
        lower.includes(ex.english.toLowerCase().split(" ")[0])),
  ).map((ex) => ex.culturalNote!);
}

/** Common phrases for hybrid pre-recorded/TTS audio */
export const COMMON_PHRASES = TSHILUBA_EXAMPLES.filter((ex) =>
  ["greeting", "daily"].includes(ex.category),
).map((ex) => ({
  key: ex.tshiluba.toLowerCase().replace(/[^a-z]/g, "_"),
  tshiluba: ex.tshiluba,
  english: ex.english,
  french: ex.french,
}));
