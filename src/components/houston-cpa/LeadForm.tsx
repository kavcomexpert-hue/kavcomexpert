"use client";

import {
  FIRM_SIZE_OPTIONS,
  SERVICE_OPTIONS,
  SPEND_OPTIONS,
} from "@/components/houston-cpa/constants";
import {
  HoneypotFields,
  useFormStartedAt,
} from "@/components/site/form-spam-fields";
import { motionEase } from "@/components/site/motion/reveal";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const fieldClassName =
  "h-11 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type UtmBag = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
};

function readUtm(): UtmBag {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
  };
}

function trackLeadSuccess() {
  try {
    const gtag = (
      window as Window & { gtag?: (...args: unknown[]) => void }
    ).gtag;
    gtag?.("event", "generate_lead", {
      event_category: "houston_cpa",
      event_label: "landing_form",
    });
  } catch {
    // Analytics optional.
  }
}

export function LeadForm() {
  const { markStarted, getStartedAt } = useFormStartedAt();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [firmName, setFirmName] = useState("");
  const [phone, setPhone] = useState("");
  const [firmSize, setFirmSize] = useState("");
  const [primaryNeed, setPrimaryNeed] = useState("");
  const [monthlySpend, setMonthlySpend] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [utm, setUtm] = useState<UtmBag>({});

  useEffect(() => {
    setUtm(readUtm());
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const honeypot = new FormData(form).get("website");

    try {
      const response = await fetch("/api/leads/houston-cpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          firmName,
          phone,
          firmSize,
          primaryNeed,
          monthlySpend,
          message,
          website: typeof honeypot === "string" ? honeypot : "",
          formStartedAt: getStartedAt(),
          ...utm,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !data.success) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setFieldErrors(data.fieldErrors ?? {});
        setLoading(false);
        return;
      }

      trackLeadSuccess();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        role="status"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: motionEase }}
        className="rounded-default border border-border bg-surface p-8 shadow-soft dark:shadow-glow"
      >
        <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Message received
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Thanks. A strategist typically replies within one business day. Check
          your email for a confirmation and the fit call link. No payment is
          taken before that conversation.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocusCapture={markStarted}
      className="relative rounded-default border border-border bg-surface p-6 shadow-soft md:p-7 dark:shadow-glow"
      noValidate
    >
      <HoneypotFields />
      <div className="space-y-1">
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Tell us about your firm
        </h3>
        <p className="text-sm text-muted">
          We reply within one business day. Prefer to talk now? Use the fit call
          button.
        </p>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="hc-name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="hc-name"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={fieldClassName}
            autoComplete="name"
            required
          />
          {fieldErrors.fullName ? (
            <p className="text-sm text-danger">{fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hc-email" className="text-sm font-medium text-foreground">
            Work email
          </label>
          <input
            id="hc-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClassName}
            autoComplete="email"
            required
          />
          {fieldErrors.email ? (
            <p className="text-sm text-danger">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hc-firm" className="text-sm font-medium text-foreground">
            Firm name
          </label>
          <input
            id="hc-firm"
            name="firmName"
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            className={fieldClassName}
            autoComplete="organization"
            required
          />
          {fieldErrors.firmName ? (
            <p className="text-sm text-danger">{fieldErrors.firmName}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hc-phone" className="text-sm font-medium text-foreground">
            Phone
          </label>
          <input
            id="hc-phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClassName}
            autoComplete="tel"
            required
          />
          {fieldErrors.phone ? (
            <p className="text-sm text-danger">{fieldErrors.phone}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hc-size" className="text-sm font-medium text-foreground">
            Firm size
          </label>
          <select
            id="hc-size"
            name="firmSize"
            value={firmSize}
            onChange={(e) => setFirmSize(e.target.value)}
            className={`${fieldClassName} appearance-none`}
            required
          >
            <option value="">Select…</option>
            {FIRM_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.firmSize ? (
            <p className="text-sm text-danger">{fieldErrors.firmSize}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hc-need" className="text-sm font-medium text-foreground">
            Primary need
          </label>
          <select
            id="hc-need"
            name="primaryNeed"
            value={primaryNeed}
            onChange={(e) => setPrimaryNeed(e.target.value)}
            className={`${fieldClassName} appearance-none`}
            required
          >
            <option value="">Select…</option>
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldErrors.primaryNeed ? (
            <p className="text-sm text-danger">{fieldErrors.primaryNeed}</p>
          ) : null}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="hc-spend" className="text-sm font-medium text-foreground">
            Current monthly marketing spend
          </label>
          <select
            id="hc-spend"
            name="monthlySpend"
            value={monthlySpend}
            onChange={(e) => setMonthlySpend(e.target.value)}
            className={`${fieldClassName} appearance-none`}
            required
          >
            <option value="">Select…</option>
            {SPEND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.monthlySpend ? (
            <p className="text-sm text-danger">{fieldErrors.monthlySpend}</p>
          ) : null}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="hc-message" className="text-sm font-medium text-foreground">
            Message{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="hc-message"
            name="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-default border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            placeholder="What is broken, and when you need help."
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
