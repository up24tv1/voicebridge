import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  Volume2,
  ArrowRightLeft,
  Loader2,
  Languages,
  Copy,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_LANGUAGES, getFlagUrl } from "@shared/schema";

function FlagImg({ countryCode, size = 20, className = "" }: { countryCode: string; size?: number; className?: string }) {
  // flagcdn supports w20, w40, w80, w160, w320 — pick nearest larger size for crisp rendering
  const cdnSize = size <= 20 ? 40 : size <= 40 ? 80 : 160;
  return (
    <img
      src={getFlagUrl(countryCode, cdnSize)}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className={`inline-block rounded-sm object-cover ${className}`}
      style={{ width: size, height: Math.round(size * 0.75) }}
      loading="lazy"
    />
  );
}

type Language = (typeof SUPPORTED_LANGUAGES)[number];

export default function Translator() {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("fr");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [isPlayingSource, setIsPlayingSource] = useState(false);
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: async (data: {
      text: string;
      sourceLanguage: string;
      targetLanguage: string;
    }) => {
      const res = await apiRequest("POST", "/api/translate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setTranslatedText(data.translatedText);
    },
    onError: () => {
      toast({
        title: "Translation failed",
        description: "Could not translate. Please try again.",
        variant: "destructive",
      });
    },
  });



  // Handle translate
  const handleTranslate = useCallback(() => {
    if (!sourceText.trim()) return;
    translateMutation.mutate({
      text: sourceText,
      sourceLanguage,
      targetLanguage,
    });
  }, [sourceText, sourceLanguage, targetLanguage]);

  // Auto-translate on Enter or after recording stops
  useEffect(() => {
    if (sourceText.trim() && !isRecording) {
      const timer = setTimeout(() => {
        handleTranslate();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [sourceText, isRecording]);

  // Speech recognition
  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description:
          "Speech recognition is not available in your browser. Try Chrome.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Map language codes for Web Speech API
    const langMap: Record<string, string> = {
      en: "en-US",
      fr: "fr-FR",
      sw: "sw-KE",
      ar: "ar-SA",
      zh: "zh-CN",
      ln: "fr-CD", // Lingala fallback to French (Congo)
      lua: "fr-CD", // Tshiluba fallback to French (Congo)
    };
    recognition.lang = langMap[sourceLanguage] || "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSourceText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone blocked",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [sourceLanguage]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const playTTS = useCallback(
    async (text: string, language: string, isSource: boolean) => {
      if (!text.trim()) return;

      if (isSource) setIsPlayingSource(true);
      else setIsPlayingTarget(true);

      const stopPlaying = () => {
        if (isSource) setIsPlayingSource(false);
        else setIsPlayingTarget(false);
      };

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap: Record<string, string> = {
          en: "en-US",
          fr: "fr-FR",
          sw: "sw",
          ar: "ar-SA",
          zh: "zh-CN",
          ln: "fr-CD",
          lua: "fr-CD",
        };
        utterance.lang = langMap[language] || "en-US";
        utterance.onend = stopPlaying;
        utterance.onerror = stopPlaying;
        window.speechSynthesis.speak(utterance);
      } else {
        stopPlaying();
        toast({
          title: "Voice unavailable",
          description: "Speech synthesis is not supported in your browser.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Swap languages
  const swapLanguages = useCallback(() => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  }, [sourceLanguage, targetLanguage, sourceText, translatedText]);

  // Copy
  const copyTranslation = useCallback(() => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [translatedText]);

  const getLanguage = (code: string): Language =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      medium:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      low: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
      "very-low":
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    };
    const labels: Record<string, string> = {
      high: "Strong",
      medium: "Good",
      low: "Experimental",
      "very-low": "Experimental",
    };
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[tier] || colors.low}`}
      >
        {labels[tier] || tier}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Languages className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none">
                VoiceBridge
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                AI Voice Translator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] font-medium hidden sm:inline-flex"
            >
              7 Languages
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsDark(!isDark)}
              data-testid="button-theme-toggle"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Language Selector Bar */}
        <div className="flex items-center gap-2 mb-4">
          <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
            <SelectTrigger
              className="flex-1 h-10"
              data-testid="select-source-language"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem
                  key={lang.code}
                  value={lang.code}
                  data-testid={`option-source-${lang.code}`}
                >
                  <span className="flex items-center gap-2">
                    <FlagImg countryCode={lang.flag} size={18} />
                    <span>{lang.name}</span>
                    {getTierBadge(lang.tier)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="shrink-0 h-10 w-10 rounded-full"
            onClick={swapLanguages}
            data-testid="button-swap-languages"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger
              className="flex-1 h-10"
              data-testid="select-target-language"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem
                  key={lang.code}
                  value={lang.code}
                  data-testid={`option-target-${lang.code}`}
                >
                  <span className="flex items-center gap-2">
                    <FlagImg countryCode={lang.flag} size={18} />
                    <span>{lang.name}</span>
                    {getTierBadge(lang.tier)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Translation Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Source Panel */}
          <Card className="relative overflow-hidden border-border/60">
            <div className="p-3 pb-2 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlagImg countryCode={getLanguage(sourceLanguage).flag} size={22} />
                <span className="text-xs font-medium text-muted-foreground">
                  {getLanguage(sourceLanguage).name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    playTTS(sourceText, sourceLanguage, true)
                  }
                  disabled={!sourceText || isPlayingSource}
                  data-testid="button-play-source"
                >
                  {isPlayingSource ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Type or speak to translate..."
                className="border-0 rounded-none resize-none min-h-[160px] text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                data-testid="input-source-text"
              />
              {sourceText && (
                <button
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                  onClick={() => {
                    setSourceText("");
                    setTranslatedText("");
                  }}
                  data-testid="button-clear-source"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Voice Input Button */}
            <div className="p-3 pt-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {sourceText.length > 0
                  ? `${sourceText.length} chars`
                  : "Voice or text input"}
              </span>
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                className={`h-8 gap-1.5 text-xs ${isRecording ? "animate-pulse" : ""}`}
                onClick={toggleRecording}
                data-testid="button-record"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    Speak
                  </>
                )}
              </Button>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-destructive animate-pulse-ring" />
            )}
          </Card>

          {/* Target Panel */}
          <Card className="relative overflow-hidden border-border/60 bg-card">
            <div className="p-3 pb-2 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlagImg countryCode={getLanguage(targetLanguage).flag} size={22} />
                <span className="text-xs font-medium text-muted-foreground">
                  {getLanguage(targetLanguage).name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    playTTS(translatedText, targetLanguage, false)
                  }
                  disabled={!translatedText || isPlayingTarget}
                  data-testid="button-play-target"
                >
                  {isPlayingTarget ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={copyTranslation}
                  disabled={!translatedText}
                  data-testid="button-copy"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="min-h-[160px] p-3 text-sm relative">
              {translateMutation.isPending ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Translating...</span>
                </div>
              ) : translatedText ? (
                <p
                  className="whitespace-pre-wrap leading-relaxed"
                  data-testid="text-translated"
                >
                  {translatedText}
                </p>
              ) : (
                <p className="text-muted-foreground/50 text-xs">
                  Translation will appear here...
                </p>
              )}
            </div>

            <div className="p-3 pt-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {translatedText
                  ? `${translatedText.length} chars`
                  : "Powered by Claude AI + ElevenLabs"}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleTranslate}
                disabled={
                  !sourceText.trim() || translateMutation.isPending
                }
                data-testid="button-translate"
              >
                {translateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Languages className="h-3.5 w-3.5" />
                )}
                Translate
              </Button>
            </div>
          </Card>
        </div>

        {/* Language Info Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className="p-2.5 rounded-lg border border-border/40 bg-card/50 hover:bg-card transition-colors text-center group cursor-pointer"
              onClick={() => {
                if (sourceLanguage !== lang.code) {
                  setTargetLanguage(lang.code);
                }
              }}
              data-testid={`card-language-${lang.code}`}
            >
              <FlagImg countryCode={lang.flag} size={28} className="block mx-auto mb-1" />
              <span className="text-[10px] font-medium block leading-tight">
                {lang.name}
              </span>
              <div className="mt-1">{getTierBadge(lang.tier)}</div>
            </button>
          ))}
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 rounded-lg bg-accent/30 border border-accent/50">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground/80">About rare languages:</strong>{" "}
            Lingala and Tshiluba translations use Claude AI with specialized
            few-shot examples. Quality is experimental — best results come from
            simple, direct sentences. For production use, connect your own
            ElevenLabs or OpenAI API keys in the settings for enhanced voice and
            translation quality.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-3 text-center">
        <a
          href="https://www.perplexity.ai/computer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Created with Perplexity Computer
        </a>
      </footer>
    </div>
  );
}
