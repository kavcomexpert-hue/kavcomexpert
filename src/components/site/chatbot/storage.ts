export type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

export type ChatbotView = "chat" | "form" | "success";

export type ChatbotPersistedState = {
  currentNodeId: string;
  messages: ChatMessage[];
  path: string[];
  view: ChatbotView;
};

export const CHATBOT_STATE_KEY = "kavcom-chatbot-state";
export const CHATBOT_PULSE_KEY = "kavcom-chatbot-pulse-seen";

export function loadChatbotState(): ChatbotPersistedState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(CHATBOT_STATE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as ChatbotPersistedState;
  } catch {
    return null;
  }
}

export function saveChatbotState(state: ChatbotPersistedState) {
  sessionStorage.setItem(CHATBOT_STATE_KEY, JSON.stringify(state));
}

export function clearChatbotState() {
  sessionStorage.removeItem(CHATBOT_STATE_KEY);
}

export function hasSeenChatbotPulse(): boolean {
  return sessionStorage.getItem(CHATBOT_PULSE_KEY) === "1";
}

export function markChatbotPulseSeen() {
  sessionStorage.setItem(CHATBOT_PULSE_KEY, "1");
}
