"use client";

import { submitChatbotLead } from "@/actions/chatbot-lead";
import { ChatMessageBubble } from "@/components/site/chatbot/chat-message";
import {
  FLOW_FALLBACK,
  FLOW_START,
  FLOW_SUCCESS,
  flowNodes as defaultFlowNodes,
  formatPath,
  getFlowNode,
  getNodeMessages,
  isLinkChoice,
  type FlowChoice,
  type FlowNode,
} from "@/components/site/chatbot/flow";
import type { ChatMessage, ChatbotView } from "@/components/site/chatbot/storage";
import {
  clearChatbotState,
  hasSeenChatbotPulse,
  loadChatbotState,
  markChatbotPulseSeen,
  saveChatbotState,
} from "@/components/site/chatbot/storage";
import { TypingIndicator } from "@/components/site/chatbot/typing-indicator";
import { useFocusTrap } from "@/components/site/chatbot/use-focus-trap";
import {
  lockPageScroll,
  unlockPageScroll,
} from "@/components/site/lenis-provider";
import {
  TurnstileWidget,
  type TurnstileHandle,
} from "@/components/site/turnstile-widget";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  isTurnstileClientEnabled,
  TURNSTILE_FAILURE_MESSAGE,
} from "@/lib/security/turnstile-config";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const TYPING_DELAY_MS = 600;

const fieldClassName =
  "h-10 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function createMessageId() {
  return crypto.randomUUID();
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function ChatbotWidget({
  flowNodes: flowNodesProp,
  turnstileSiteKey,
}: {
  flowNodes?: Record<string, FlowNode>;
  turnstileSiteKey?: string;
} = {}) {
  const nodes = flowNodesProp ?? defaultFlowNodes;
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveRegionId = useId();
  const bootstrappedRef = useRef(false);
  const advancingRef = useRef(false);
  const openedAtRef = useRef<number | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState(FLOW_START);
  const [path, setPath] = useState<string[]>([]);
  const [view, setView] = useState<ChatbotView>("chat");
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useFocusTrap({
    enabled: isOpen,
    containerRef: panelRef,
    onEscape: () => setIsOpen(false),
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const mobile = window.matchMedia("(max-width: 767px)");
    if (!mobile.matches) {
      return;
    }

    lockPageScroll();
    return () => {
      unlockPageScroll();
    };
  }, [isOpen]);

  const announce = useCallback((text: string) => {
    setLiveAnnouncement("");
    window.requestAnimationFrame(() => setLiveAnnouncement(text));
  }, []);

  const appendBotText = useCallback(
    async (text: string) => {
      if (!reducedMotion) {
        setIsTyping(true);
        await delay(TYPING_DELAY_MS);
        setIsTyping(false);
      }

      const botMessage: ChatMessage = {
        id: createMessageId(),
        role: "bot",
        text,
      };
      setMessages((current) => [...current, botMessage]);
      announce(text);
    },
    [announce, reducedMotion],
  );

  const appendNodeMessages = useCallback(
    async (node: FlowNode) => {
      const texts = getNodeMessages(node);
      for (const text of texts) {
        await appendBotText(text);
      }
    },
    [appendBotText],
  );

  const enterNode = useCallback(
    async (nodeId: string) => {
      const node = getFlowNode(nodeId, nodes) ?? getFlowNode(FLOW_FALLBACK, nodes);
      if (!node) {
        return;
      }

      if (node.kind === "fallback") {
        setCurrentNodeId(node.id);
        setView("chat");
        await appendNodeMessages(node);
        const greeting = getFlowNode(node.next, nodes);
        if (greeting) {
          setCurrentNodeId(greeting.id);
          setView("chat");
          await appendNodeMessages(greeting);
        }
        return;
      }

      setCurrentNodeId(node.id);

      if (node.kind === "form") {
        setView("form");
        return;
      }

      if (node.kind === "success") {
        setView("success");
        await appendNodeMessages(node);
        return;
      }

      setView("chat");
      await appendNodeMessages(node);
    },
    [appendNodeMessages, nodes],
  );

  useEffect(() => {
    // Client-only localStorage read for first-visit pulse.
    const seen = hasSeenChatbotPulse();
    if (!seen) {
      queueMicrotask(() => setShowPulse(true));
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (bootstrappedRef.current) {
      return;
    }

    bootstrappedRef.current = true;
    const saved = loadChatbotState();

    if (saved && saved.messages.length > 0) {
      const restored = getFlowNode(saved.currentNodeId, nodes);
      if (!restored) {
        void (async () => {
          await enterNode(FLOW_FALLBACK);
        })();
        return;
      }

      queueMicrotask(() => {
        setMessages(saved.messages);
        setCurrentNodeId(saved.currentNodeId);
        setPath(saved.path);
        setView(
          restored.kind === "form"
            ? "form"
            : restored.kind === "success"
              ? "success"
              : saved.view === "form" || saved.view === "success"
                ? saved.view
                : "chat",
        );
      });
      return;
    }

    queueMicrotask(() => {
      void enterNode(FLOW_START);
    });
  }, [enterNode, isOpen, nodes]);

  useEffect(() => {
    if (!bootstrappedRef.current) {
      return;
    }

    saveChatbotState({
      currentNodeId,
      messages,
      path,
      view,
    });
  }, [currentNodeId, messages, path, view]);

  useEffect(() => {
    if (view === "form") {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isTyping, view, reducedMotion]);

  useEffect(() => {
    if (view !== "form" || !isOpen) {
      return;
    }

    document.getElementById("chatbot-name")?.focus();
  }, [view, isOpen]);

  function handleOpen() {
    markChatbotPulseSeen();
    setShowPulse(false);
    openedAtRef.current = Date.now();
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  async function handleChoice(choice: FlowChoice) {
    if (advancingRef.current || isLinkChoice(choice)) {
      return;
    }

    if (choice.next === FLOW_START && choice.label === "Start over") {
      handleStartOver();
      return;
    }

    advancingRef.current = true;
    const nextPath = [...path, choice.label];
    setPath(nextPath);
    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: "user", text: choice.label },
    ]);

    try {
      await enterNode(choice.next);
    } finally {
      advancingRef.current = false;
    }
  }

  function handleLinkChoice(choice: Extract<FlowChoice, { href: string }>) {
    const nextPath = [...path, choice.label];
    setPath(nextPath);
    saveChatbotState({
      currentNodeId,
      messages,
      path: nextPath,
      view,
    });
  }

  function handleStartOver() {
    clearChatbotState();
    setMessages([]);
    setPath([]);
    setView("chat");
    setName("");
    setEmail("");
    setMessage("");
    setError(null);
    setFieldErrors({});
    setCurrentNodeId(FLOW_START);
    bootstrappedRef.current = true;
    void enterNode(FLOW_START);
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    let turnstileToken: string | undefined;
    if (isTurnstileClientEnabled(turnstileSiteKey)) {
      const token = await turnstileRef.current?.getTokenForSubmit();
      if (!token) {
        turnstileRef.current?.reset();
        setLoading(false);
        setError(TURNSTILE_FAILURE_MESSAGE);
        return;
      }
      turnstileToken = token;
    }

    const result = await submitChatbotLead({
      name,
      email,
      path: formatPath(path.length > 0 ? path : ["Contact form"]),
      message: message.trim() || undefined,
      website: "",
      formStartedAt: openedAtRef.current ?? Date.now(),
      turnstileToken,
    });

    setLoading(false);
    turnstileRef.current?.reset();

    if (!result.success) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    setName("");
    setEmail("");
    setMessage("");
    await enterNode(FLOW_SUCCESS);
  }

  const currentNode = getFlowNode(currentNodeId, nodes);
  const questionChoices =
    currentNode?.kind === "question" || currentNode?.kind === "success"
      ? currentNode.choices
      : [];
  const formNode = currentNode?.kind === "form" ? currentNode : null;
  const showStartOver = currentNodeId !== FLOW_START && messages.length > 0;
  const showChoices =
    questionChoices.length > 0 &&
    (view === "chat" || view === "success") &&
    !isTyping;

  return (
    <>
      <div id={liveRegionId} className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatbot-title"
            data-lenis-prevent
            className="fixed inset-0 z-50 flex flex-col bg-background md:inset-auto md:bottom-24 md:right-6 md:h-[min(640px,calc(100vh-7rem))] md:w-[380px] md:overflow-hidden md:rounded-default md:border md:border-border md:bg-surface md:shadow-soft dark:md:shadow-glow"
            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 28 }
            }
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h2
                  id="chatbot-title"
                  className="font-display text-base font-semibold tracking-tight text-foreground"
                >
                  Kavcom Assistant
                </h2>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                  <span
                    className="h-2 w-2 rounded-full bg-success"
                    aria-hidden="true"
                  />
                  Online
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
              <div
                data-lenis-prevent
                className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {messages.map((item) => (
                  <ChatMessageBubble key={item.id} message={item} />
                ))}
                {isTyping ? (
                  <div className="flex justify-start">
                    <TypingIndicator />
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3">
                {view === "form" && formNode ? (
                  <form onSubmit={handleEmailSubmit} className="relative space-y-3">
                    <p className="text-sm leading-relaxed text-muted">
                      {formNode.intro}
                    </p>

                    <div className="space-y-2">
                      <label
                        htmlFor="chatbot-name"
                        className="text-sm font-medium text-foreground"
                      >
                        Name
                      </label>
                      <input
                        id="chatbot-name"
                        name="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className={fieldClassName}
                        autoComplete="name"
                        required
                      />
                      {fieldErrors.name ? (
                        <p className="text-sm text-danger">{fieldErrors.name}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="chatbot-email"
                        className="text-sm font-medium text-foreground"
                      >
                        Email
                      </label>
                      <input
                        id="chatbot-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={fieldClassName}
                        autoComplete="email"
                        required
                      />
                      {fieldErrors.email ? (
                        <p className="text-sm text-danger">{fieldErrors.email}</p>
                      ) : null}
                    </div>

                    {formNode.includeMessage ? (
                      <div className="space-y-2">
                        <label
                          htmlFor="chatbot-message"
                          className="text-sm font-medium text-foreground"
                        >
                          Message{" "}
                          <span className="font-normal text-muted">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          id="chatbot-message"
                          name="message"
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          rows={3}
                          placeholder={
                            formNode.messagePlaceholder ??
                            "What's on your mind?"
                          }
                          className="w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        />
                      </div>
                    ) : null}

                    {error ? <p className="text-sm text-danger">{error}</p> : null}

                    <TurnstileWidget
                      ref={turnstileRef}
                      siteKey={turnstileSiteKey}
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-10 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Sending…" : "Send my details"}
                    </button>
                  </form>
                ) : null}

                {showChoices ? (
                  <div className="space-y-2">
                    {questionChoices.map((choice) =>
                      isLinkChoice(choice) ? (
                        <Link
                          key={choice.id}
                          href={choice.href}
                          onClick={() => handleLinkChoice(choice)}
                          className="inline-flex min-h-10 w-full items-center justify-start rounded-default border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-accent/40"
                        >
                          {choice.label}
                        </Link>
                      ) : (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => void handleChoice(choice)}
                          className="inline-flex min-h-10 w-full items-center justify-start rounded-default border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-accent/40"
                        >
                          {choice.label}
                        </button>
                      ),
                    )}
                  </div>
                ) : null}

                {showStartOver ? (
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="mt-3 w-full text-center text-xs text-muted transition-colors hover:text-foreground"
                  >
                    Start over
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          className={`fixed right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-surface shadow-soft dark:shadow-glow bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 ${reducedMotion ? "" : "transition-transform hover:scale-[1.02]"}`}
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-6 w-6" />
          {showPulse ? (
            <span
              className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-accent-lime ring-2 ring-surface ${reducedMotion ? "" : "animate-pulse"}`}
              aria-hidden="true"
            />
          ) : null}
        </button>
      ) : null}
    </>
  );
}
