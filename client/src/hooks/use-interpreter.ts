import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ConversationMessage {
  id: string;
  role: "user" | "interpreter";
  sourceText: string;
  interpretedText: string;
  culturalNote?: string;
  pronunciation?: string;
  direction: "source_to_target" | "target_to_source";
  timestamp: number;
}

export type InterpreterState =
  | "idle"
  | "recording"
  | "processing_stt"
  | "interpreting"
  | "playing_tts"
  | "error";

interface UseInterpreterOptions {
  sourceLanguage: string;
  targetLanguage: string;
  onStateChange?: (state: InterpreterState) => void;
}

export function useInterpreter({
  sourceLanguage,
  targetLanguage,
  onStateChange,
}: UseInterpreterOptions) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [state, setState] = useState<InterpreterState>("idle");

  const updateState = useCallback(
    (newState: InterpreterState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange],
  );

  // Build conversation history for context
  const getConversationHistory = useCallback(() => {
    return messages.slice(-20).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
      content:
        msg.role === "user"
          ? msg.sourceText
          : JSON.stringify({ interpretedText: msg.interpretedText }),
    }));
  }, [messages]);

  // Interpret mutation
  const interpretMutation = useMutation({
    mutationFn: async (data: {
      text: string;
      direction: "source_to_target" | "target_to_source";
    }) => {
      const src =
        data.direction === "source_to_target" ? sourceLanguage : targetLanguage;
      const tgt =
        data.direction === "source_to_target" ? targetLanguage : sourceLanguage;

      const res = await apiRequest("POST", "/api/interpret", {
        text: data.text,
        sourceLanguage: src,
        targetLanguage: tgt,
        conversationHistory: getConversationHistory(),
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      const newMessage: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: "interpreter",
        sourceText: variables.text,
        interpretedText: data.interpretedText,
        culturalNote: data.culturalNote,
        pronunciation: data.pronunciation,
        direction: variables.direction,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
      updateState("idle");
    },
    onError: () => {
      updateState("error");
      // Reset to idle after a moment
      setTimeout(() => updateState("idle"), 2000);
    },
  });

  const interpret = useCallback(
    async (
      text: string,
      direction: "source_to_target" | "target_to_source" = "source_to_target",
    ) => {
      if (!text.trim()) return;

      // Add user message
      const userMsg: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: "user",
        sourceText: text,
        interpretedText: "",
        direction,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      updateState("interpreting");
      interpretMutation.mutate({ text, direction });
    },
    [interpretMutation, updateState],
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    updateState("idle");
  }, [updateState]);

  return {
    messages,
    state,
    interpret,
    clearConversation,
    isInterpreting: interpretMutation.isPending,
    updateState,
  };
}
