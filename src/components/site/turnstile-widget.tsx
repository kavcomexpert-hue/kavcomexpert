"use client";

import Script from "next/script";
import { useTheme } from "next-themes";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type TurnstileHandle = {
  /** Resolves with a token; null when disabled or the challenge could not run. */
  getTokenForSubmit: () => Promise<string | null>;
  reset: () => void;
};

type TurnstileWidgetProps = {
  /**
   * Site key from the server (runtime env). Prefer this over relying on
   * client-bundled NEXT_PUBLIC_* so Hostinger env works after PM2 restart.
   */
  siteKey?: string | null;
};

export const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey: siteKeyProp }, ref) {
    const siteKey =
      siteKeyProp?.trim() ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
      "";
    const enabled = Boolean(siteKey);
    const { resolvedTheme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const pendingRef = useRef<((token: string | null) => void) | null>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const theme = resolvedTheme === "dark" ? "dark" : "light";

    const reset = useCallback(() => {
      tokenRef.current = null;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    }, []);

    const removeWidget = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      tokenRef.current = null;
    }, []);

    const renderWidget = useCallback(() => {
      if (!siteKey || !containerRef.current || !window.turnstile) return;

      removeWidget();

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        // Visible managed widget so visitors can complete the challenge.
        size: "normal",
        theme,
        action: "turnstile-spin-v2",
        callback: (token: string) => {
          tokenRef.current = token;
          const pending = pendingRef.current;
          pendingRef.current = null;
          pending?.(token);
        },
        "error-callback": () => {
          tokenRef.current = null;
          const pending = pendingRef.current;
          pendingRef.current = null;
          pending?.(null);
        },
        "expired-callback": () => {
          tokenRef.current = null;
        },
      });
    }, [removeWidget, siteKey, theme]);

    useEffect(() => {
      if (scriptReady) {
        renderWidget();
      }
      return removeWidget;
    }, [scriptReady, renderWidget, removeWidget]);

    useImperativeHandle(
      ref,
      () => ({
        async getTokenForSubmit() {
          if (!enabled || !siteKey) return null;
          if (tokenRef.current) return tokenRef.current;
          if (!window.turnstile || !widgetIdRef.current) return null;

          try {
            const existing = window.turnstile.getResponse(widgetIdRef.current);
            if (existing) {
              tokenRef.current = existing;
              return existing;
            }
          } catch {
            // Widget not ready yet.
          }

          // Wait briefly for an in-flight solve (user just completed the challenge).
          return new Promise((resolve) => {
            const settle = (token: string | null) => {
              window.clearTimeout(timeoutId);
              pendingRef.current = null;
              resolve(token);
            };

            const timeoutId = window.setTimeout(() => settle(null), 8_000);
            pendingRef.current = settle;
          });
        },
        reset,
      }),
      [enabled, reset, siteKey],
    );

    if (!enabled || !siteKey) {
      return null;
    }

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
          onReady={() => setScriptReady(true)}
          onError={() => setLoadError(true)}
        />
        <div
          ref={containerRef}
          className="cf-turnstile my-3"
          data-action="turnstile-spin-v2"
        />
        {loadError ? (
          <p className="text-xs text-muted" role="status">
            Security verification could not load. Try refreshing the page if
            submission fails.
          </p>
        ) : null}
      </>
    );
  },
);
