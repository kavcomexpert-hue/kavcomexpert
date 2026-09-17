"use client";

import type { ChatMessage } from "@/components/site/chatbot/storage";

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isBot = message.role === "bot";

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-default px-4 py-3 text-sm leading-relaxed ${
          isBot
            ? "border border-border bg-surface text-foreground"
            : "bg-accent text-surface"
        }`}
      >
        <p>{message.text}</p>
      </div>
    </div>
  );
}
