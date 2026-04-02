import { useState, useCallback, useRef, useEffect } from "react";
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
  Trash2,
  Send,
  Sun,
  Moon,
  Info,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInterpreter, type ConversationMessage } from "@/hooks/use-interpreter";
import { useElevenLabsTTS } from "@/hooks/use-elevenlabs-tts";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { SUPPORTED_LANGUAGES, getFlagUrl } from "@shared/schema";
import { INTERPRETER_INTROS } from "@/lib/interpreter-persona";

function FlagImg({
  countryCode,
  size = 20,
}: {
  countryCode: string;
  size?: number;
}) {
  const cdnSize = size <= 20 ? 40 : size <= 40 ? 80 : 160;
  return (
    <img
      src={getFlagUrl(countryCode, cdnSize)}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block rounded-sm object-cover"
      style={{ width: size, height: Math.round(size * 0.75) }}
      loading="lazy"
    />
  );
}

const PRIMARY_LANGS = SUPPORTED_LANGUAGES.filter((l) =>
  ["lua", "en", "fr"].includes(l.code),
);

export default function Interpreter() {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("lua");
  const [inputText, setInputText] = useState("");
  const [direction, setDirection] = useState<
    "source_to_target" | "target_to_source"
  >("source_to_target");
  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Interpreter hook
  const interpreter = useInterpreter({
    sourceLanguage,
    targetLanguage,
    onStateChange: (state) => {
      if (state === "error") {
        toast({
          title: "Interpretation failed",
          description: "Could not interpret. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // TTS hook
  const tts = useElevenLabsTTS({
    onError: (error) =>
      toast({
        title: "Voice unavailable",
        description: error,
        variant: "destructive",
      }),
  });

  // Speech input hook
  const speech = useSpeechInput({
    onTranscript: (text, isFinal) => {
      setInputText(text);
      // Auto-submit on final transcript for natural flow
      if (isFinal && text.trim()) {
        handleSubmit(text);
      }
    },
    onError: (error) =>
      toast({
        title: "Microphone error",
        description: error,
        variant: "destructive",
      }),
  });

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interpreter.messages]);

  const handleSubmit = useCallback(
    (text?: string) => {
      const t = (text || inputText).trim();
      if (!t) return;
      interpreter.interpret(t, direction);
      setInputText("");
    },
    [inputText, interpreter, direction],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const swapLanguages = useCallback(() => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setDirection((d) =>
      d === "source_to_target" ? "target_to_source" : "source_to_target",
    );
  }, [sourceLanguage, targetLanguage]);

  const speakingLang =
    direction === "source_to_target" ? sourceLanguage : targetLanguage;

  const getSourceLang = (code: string) =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Languages className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">
                Tshiluba Interpreter
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Matt - AI Voice Interpreter
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#/"
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Translator
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsDark(!isDark)}
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

      {/* Language Selector */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-4">
        <div className="flex items-center gap-2">
          <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
            <SelectTrigger className="flex-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIMARY_LANGS.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <FlagImg countryCode={lang.flag} size={18} />
                    <span>{lang.name}</span>
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
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="flex-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIMARY_LANGS.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <FlagImg countryCode={lang.flag} size={18} />
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversation Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 overflow-y-auto">
        {/* Matt's greeting */}
        {interpreter.messages.length === 0 && (
          <div className="space-y-4">
            <Card className="p-4 border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-1">
                    Matt, Your Interpreter
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {INTERPRETER_INTROS[sourceLanguage] || INTERPRETER_INTROS.en}
                  </p>
                  <p className="text-sm text-foreground/70 leading-relaxed mt-2">
                    {INTERPRETER_INTROS[targetLanguage] || INTERPRETER_INTROS.lua}
                  </p>
                </div>
              </div>
            </Card>

            <div className="p-3 rounded-lg bg-accent/30 border border-accent/50">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  How it works
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Speak or type in {getSourceLang(sourceLanguage).name} and Matt
                will interpret to {getSourceLang(targetLanguage).name} with
                natural voice and cultural context. Use the microphone button for
                voice input, or type below.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-3 mt-3">
          {interpreter.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onPlayAudio={(text, lang) => tts.speak(text, lang)}
              isPlayingTTS={tts.isPlaying || tts.isLoading}
            />
          ))}

          {interpreter.isInterpreting && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">M</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span className="text-xs text-muted-foreground">
                  Interpreting...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="border-t border-border/60 bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Recording indicator */}
          {(speech.isRecording || speech.isProcessing) && (
            <div className="flex items-center gap-2 mb-2 px-2">
              {speech.isRecording && (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                    Listening in{" "}
                    {getSourceLang(speakingLang).name}...
                  </span>
                </>
              )}
              {speech.isProcessing && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Transcribing...
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type in ${getSourceLang(speakingLang).name}...`}
              className="min-h-[44px] max-h-[120px] text-sm resize-none flex-1"
              rows={1}
            />

            <div className="flex gap-1.5 shrink-0">
              {/* Mic button */}
              <Button
                variant={speech.isRecording ? "destructive" : "outline"}
                size="icon"
                className={`h-[44px] w-[44px] rounded-xl ${speech.isRecording ? "animate-pulse" : ""}`}
                onClick={() => speech.toggle(speakingLang)}
                disabled={speech.isProcessing}
              >
                {speech.isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : speech.isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>

              {/* Send button */}
              <Button
                size="icon"
                className="h-[44px] w-[44px] rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                onClick={() => handleSubmit()}
                disabled={
                  !inputText.trim() || interpreter.isInterpreting
                }
              >
                {interpreter.isInterpreting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[10px] text-muted-foreground">
              {interpreter.messages.length > 0
                ? `${interpreter.messages.length} exchanges`
                : "Voice or text input"}
            </span>
            <div className="flex items-center gap-2">
              {interpreter.messages.length > 0 && (
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  onClick={interpreter.clearConversation}
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              )}
              <span className="text-[10px] text-muted-foreground">
                Powered by Claude AI + ElevenLabs
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble Component ────────────────────────────────────
function MessageBubble({
  message,
  sourceLanguage,
  targetLanguage,
  onPlayAudio,
  isPlayingTTS,
}: {
  message: ConversationMessage;
  sourceLanguage: string;
  targetLanguage: string;
  onPlayAudio: (text: string, lang: string) => void;
  isPlayingTTS: boolean;
}) {
  const isUser = message.role === "user";
  const srcLang =
    message.direction === "source_to_target" ? sourceLanguage : targetLanguage;
  const tgtLang =
    message.direction === "source_to_target" ? targetLanguage : sourceLanguage;

  const getFlag = (code: string) =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code)?.flag || "cd";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] flex items-start gap-2">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <FlagImg countryCode={getFlag(srcLang)} size={14} />
              <span className="text-[10px] opacity-75">
                {SUPPORTED_LANGUAGES.find((l) => l.code === srcLang)?.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{message.sourceText}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 mt-1">
          <span className="text-white text-[10px] font-bold">M</span>
        </div>
        <div className="space-y-1.5">
          {/* Interpretation */}
          <Card className="px-4 py-2.5 border-border/40">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <FlagImg countryCode={getFlag(tgtLang)} size={14} />
                <span className="text-[10px] text-muted-foreground">
                  {SUPPORTED_LANGUAGES.find((l) => l.code === tgtLang)?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  onPlayAudio(message.interpretedText, tgtLang)
                }
                disabled={isPlayingTTS}
              >
                {isPlayingTTS ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-sm leading-relaxed">
              {message.interpretedText}
            </p>
            {message.pronunciation && (
              <p className="text-[11px] text-muted-foreground mt-1 italic">
                {message.pronunciation}
              </p>
            )}
          </Card>

          {/* Cultural note */}
          {message.culturalNote && (
            <div className="flex items-start gap-1.5 px-2">
              <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                {message.culturalNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
