import { useState, useCallback, useRef } from "react";

interface UseTTSOptions {
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
}

export function useElevenLabsTTS(options: UseTTSOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string, languageCode: string, style?: "default" | "tshiluba" | "greeting") => {
      if (!text.trim()) return;

      // Stop any currently playing audio
      stop();

      setIsLoading(true);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            languageCode,
            style: style || (languageCode === "lua" ? "tshiluba" : "default"),
          }),
        });

        if (!response.ok) {
          throw new Error(`TTS failed: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          setIsLoading(false);
          options.onPlayStart?.();
        };

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          objectUrlRef.current = null;
          audioRef.current = null;
          options.onPlayEnd?.();
        };

        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          URL.revokeObjectURL(url);
          objectUrlRef.current = null;
          audioRef.current = null;
          options.onError?.("Audio playback failed");
        };

        await audio.play();
      } catch (error: any) {
        setIsLoading(false);
        setIsPlaying(false);

        // Fallback to browser speechSynthesis
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const langMap: Record<string, string> = {
            en: "en-US",
            fr: "fr-FR",
            lua: "fr-CD",
            ln: "fr-CD",
            sw: "sw",
          };
          utterance.lang = langMap[languageCode] || "en-US";
          utterance.onend = () => {
            setIsPlaying(false);
            options.onPlayEnd?.();
          };
          setIsPlaying(true);
          options.onPlayStart?.();
          window.speechSynthesis.speak(utterance);
        } else {
          options.onError?.(error?.message || "TTS unavailable");
        }
      }
    },
    [stop, options],
  );

  return { speak, stop, isLoading, isPlaying };
}
