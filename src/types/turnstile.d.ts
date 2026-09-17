export {};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          size?: "normal" | "compact" | "flexible" | "invisible";
          theme?: "light" | "dark" | "auto";
          action?: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      execute: (widgetId: string | HTMLElement) => void;
      reset: (widgetId: string | HTMLElement) => void;
      remove: (widgetId: string | HTMLElement) => void;
      getResponse: (widgetId: string | HTMLElement) => string;
    };
  }
}
