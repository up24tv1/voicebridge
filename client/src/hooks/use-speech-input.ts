import { useState, useCallback, useRef } from "react";

interface UseSpeechInputOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * Unified speech input hook.
 * - English/French: Web Speech API (free, fast, accurate)
 * - Tshiluba/Lingala: MediaRecorder -> ElevenLabs Scribe STT
 */
export function useSpeechInput(options: UseSpeechInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const WEB_SPEECH_LANGUAGES = ["en", "fr"];

  const stopWebSpeech = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startWebSpeech = useCallback(
    (languageCode: string) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        options.onError?.("Speech recognition not supported in this browser. Try Chrome.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const langMap: Record<string, string> = {
        en: "en-US",
        fr: "fr-FR",
        sw: "sw-KE",
      };
      recognition.lang = langMap[languageCode] || "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        let isFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }
        options.onTranscript?.(transcript, isFinal);
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error === "not-allowed") {
          options.onError?.("Microphone access blocked. Please allow microphone access.");
        }
      };

      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    },
    [options],
  );

  const stopMediaRecorder = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          chunksRef.current = [];

          // Convert to base64
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
          );

          // Send to ElevenLabs Scribe via our proxy
          const response = await fetch("/api/stt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio: base64,
              languageCode: (recorder as any)._languageCode || "lua",
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.text) {
              options.onTranscript?.(result.text, true);
            }
          } else {
            options.onError?.("Transcription failed. Please try again.");
          }
        } catch (error: any) {
          options.onError?.(error?.message || "STT processing failed");
        } finally {
          setIsProcessing(false);
          resolve();
        }
      };

      recorder.stop();
    });
  }, [options]);

  const startMediaRecorder = useCallback(
    async (languageCode: string) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm",
        });

        // Store language code for the stop handler
        (recorder as any)._languageCode = languageCode;

        chunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250); // Collect in 250ms chunks
        setIsRecording(true);
      } catch (error: any) {
        options.onError?.("Microphone access denied");
      }
    },
    [options],
  );

  const start = useCallback(
    (languageCode: string) => {
      if (isRecording) return;

      if (WEB_SPEECH_LANGUAGES.includes(languageCode)) {
        startWebSpeech(languageCode);
      } else {
        startMediaRecorder(languageCode);
      }
    },
    [isRecording, startWebSpeech, startMediaRecorder],
  );

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      stopWebSpeech();
    } else if (mediaRecorderRef.current) {
      stopMediaRecorder();
    }
  }, [stopWebSpeech, stopMediaRecorder]);

  const toggle = useCallback(
    (languageCode: string) => {
      if (isRecording) {
        stop();
      } else {
        start(languageCode);
      }
    },
    [isRecording, start, stop],
  );

  return { isRecording, isProcessing, start, stop, toggle };
}
