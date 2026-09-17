"use client";

import {
  parseChatbotFlowJson,
  type FlowNode,
} from "@/components/site/chatbot/flow";
import dynamic from "next/dynamic";
import { useIdleReady } from "@/hooks/use-idle-ready";
import { useEffect, useState } from "react";

const ChatbotWidget = dynamic(
  () =>
    import("@/components/site/chatbot/chatbot-widget").then(
      (module) => module.ChatbotWidget,
    ),
  { ssr: false },
);

/** Chat widget loads after idle so it never competes with LCP/TBT. */
export function ChatbotLoader({
  turnstileSiteKey,
}: {
  turnstileSiteKey?: string;
} = {}) {
  const ready = useIdleReady({ timeoutMs: 4500 });
  const [flowNodes, setFlowNodes] = useState<
    Record<string, FlowNode> | undefined
  >(undefined);
  const [flowReady, setFlowReady] = useState(false);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function loadFlow() {
      try {
        const res = await fetch("/api/chatbot/flow", {
          credentials: "same-origin",
        });
        if (!res.ok) {
          if (!cancelled) setFlowReady(true);
          return;
        }
        const data = (await res.json()) as { flowJson?: string };
        if (cancelled) return;
        setFlowNodes(parseChatbotFlowJson(data.flowJson) ?? undefined);
      } catch {
        // Widget still mounts with built-in defaults.
      } finally {
        if (!cancelled) setFlowReady(true);
      }
    }

    void loadFlow();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready || !flowReady) return null;
  return (
    <ChatbotWidget
      flowNodes={flowNodes}
      turnstileSiteKey={turnstileSiteKey}
    />
  );
}
