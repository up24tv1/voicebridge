/**
 * Tshiluba Interpreter — Language Configuration
 * Ported from Matt-Interpreter/config.json + extended for Tshiluba focus
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  tier: "high" | "medium" | "low" | "very-low";
  elevenlabs: {
    ttsCode: string | null; // ElevenLabs language_code for TTS
    scribeSupported: boolean;
  };
  sttStrategy: "web-speech" | "elevenlabs-scribe" | "both";
  webSpeechCode: string; // BCP-47 for Web Speech API
  isPrimary: boolean; // Show prominently in interpreter UI
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  lua: {
    code: "lua",
    name: "Tshiluba",
    nativeName: "Tshiluba",
    flag: "cd",
    tier: "low",
    elevenlabs: {
      ttsCode: null, // No native code — test auto-detect, "fra", or "lin"
      scribeSupported: true,
    },
    sttStrategy: "elevenlabs-scribe",
    webSpeechCode: "fr-CD",
    isPrimary: true,
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "gb",
    tier: "high",
    elevenlabs: {
      ttsCode: "eng",
      scribeSupported: true,
    },
    sttStrategy: "web-speech",
    webSpeechCode: "en-US",
    isPrimary: true,
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Francais",
    flag: "fr",
    tier: "high",
    elevenlabs: {
      ttsCode: "fra",
      scribeSupported: true,
    },
    sttStrategy: "web-speech",
    webSpeechCode: "fr-FR",
    isPrimary: true,
  },
  ln: {
    code: "ln",
    name: "Lingala",
    nativeName: "Lingala",
    flag: "cd",
    tier: "low",
    elevenlabs: {
      ttsCode: "lin",
      scribeSupported: true,
    },
    sttStrategy: "elevenlabs-scribe",
    webSpeechCode: "fr-CD",
    isPrimary: false,
  },
  sw: {
    code: "sw",
    name: "Swahili",
    nativeName: "Kiswahili",
    flag: "ke",
    tier: "medium",
    elevenlabs: {
      ttsCode: "swa",
      scribeSupported: true,
    },
    sttStrategy: "elevenlabs-scribe",
    webSpeechCode: "sw-KE",
    isPrimary: false,
  },
};

/** Voice settings for ElevenLabs TTS — tuned for natural African language prosody */
export const ELEVENLABS_VOICE_SETTINGS = {
  default: {
    stability: 0.6,
    similarity_boost: 0.75,
    style: 0.3,
    use_speaker_boost: true,
  },
  // More expressive for Tshiluba — lower stability for tonal variation
  tshiluba: {
    stability: 0.45,
    similarity_boost: 0.75,
    style: 0.55,
    use_speaker_boost: true,
  },
  // Warm and clear for interpreter greetings
  greeting: {
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.6,
    use_speaker_boost: true,
  },
};

export const PRIMARY_LANGUAGES = Object.values(LANGUAGE_CONFIGS).filter(
  (l) => l.isPrimary,
);
export const ALL_LANGUAGES = Object.values(LANGUAGE_CONFIGS);
