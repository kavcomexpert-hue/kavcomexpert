"use client";

import { submitContactForm } from "@/actions/contact";
import {
  HoneypotFields,
  useFormStartedAt,
} from "@/components/site/form-spam-fields";
import {
  TurnstileWidget,
  type TurnstileHandle,
} from "@/components/site/turnstile-widget";
import {
  isTurnstileClientEnabled,
  TURNSTILE_FAILURE_MESSAGE,
} from "@/lib/security/turnstile-config";
import { useRef, useState } from "react";

const fieldClassName =
  "h-11 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const selectClassName = `${fieldClassName} appearance-none`;

const SERVICE_OPTIONS = [
  "Website design / development",
  "E-commerce (Shopify, WooCommerce, Magento)",
  "SEO / AI SEO",
  "Google Ads",
  "Social media / paid social",
  "App development",
  "Virtual assistant",
  "Not sure yet",
  "Something else",
] as const;

const BUDGET_OPTIONS = [
  "Under $2,000",
  "$2,000 to $5,000",
  "$5,000 to $10,000",
  "$10,000 to $25,000",
  "$25,000+",
  "Not sure yet",
] as const;

export type ContactFormProps = {
  formTitle?: string;
  formSubtitle?: string;
  formNameLabel?: string;
  formEmailLabel?: string;
  formCompanyLabel?: string;
  formPhoneLabel?: string;
  formWebsiteLabel?: string;
  formServiceLabel?: string;
  formBudgetLabel?: string;
  formMessageLabel?: string;
  formMessagePlaceholder?: string;
  formSubmitLabel?: string;
  formSuccessTitle?: string;
  formSuccessBody?: string;
  formServiceOptions?: string[];
  formBudgetOptions?: string[];
  /** Runtime site key from the server (Hostinger env). */
  turnstileSiteKey?: string;
};

export function ContactForm({
  formTitle = "Send a message",
  formSubtitle = "Tell us what you are working on. We reply within one business day.",
  formNameLabel = "Name",
  formEmailLabel = "Work email",
  formCompanyLabel = "Company",
  formPhoneLabel = "Phone",
  formWebsiteLabel = "Website",
  formServiceLabel = "What do you need help with?",
  formBudgetLabel = "Approximate budget",
  formMessageLabel = "How can we help?",
  formMessagePlaceholder = "A short note on your goals, timeline, or what is not working today.",
  formSubmitLabel = "Send message",
  formSuccessTitle = "Message sent",
  formSuccessBody = "Thanks for reaching out. Sid will get back to you within one business day, usually sooner.",
  formServiceOptions = [...SERVICE_OPTIONS],
  formBudgetOptions = [...BUDGET_OPTIONS],
  turnstileSiteKey,
}: ContactFormProps = {}) {
  const { markStarted, getStartedAt } = useFormStartedAt();
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [service, setService] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const serviceOptions =
    formServiceOptions.length > 0 ? formServiceOptions : [...SERVICE_OPTIONS];
  const budgetOptions =
    formBudgetOptions.length > 0 ? formBudgetOptions : [...BUDGET_OPTIONS];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const honeypot = new FormData(form).get("website");

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

    const result = await submitContactForm({
      name,
      email,
      company,
      phone,
      companyWebsite,
      website: typeof honeypot === "string" ? honeypot : "",
      formStartedAt: getStartedAt(),
      service,
      budget,
      message,
      turnstileToken,
    });

    setLoading(false);
    turnstileRef.current?.reset();

    if (!result.success) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    setSubmitted(true);
    setName("");
    setEmail("");
    setCompany("");
    setPhone("");
    setCompanyWebsite("");
    setService("");
    setBudget("");
    setMessage("");
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-default border border-border bg-surface p-8 shadow-soft dark:shadow-glow"
      >
        <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {formSuccessTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {formSuccessBody}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocusCapture={markStarted}
      className="relative rounded-default border border-border bg-surface p-6 shadow-soft md:p-8 dark:shadow-glow"
    >
      <HoneypotFields />
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {formTitle}
        </h2>
        <p className="text-sm text-muted">{formSubtitle}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            {formNameLabel}
          </label>
          <input
            id="name"
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
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {formEmailLabel}
          </label>
          <input
            id="email"
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

        <div className="space-y-2">
          <label
            htmlFor="company"
            className="text-sm font-medium text-foreground"
          >
            {formCompanyLabel}
          </label>
          <input
            id="company"
            name="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className={fieldClassName}
            autoComplete="organization"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            {formPhoneLabel}{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={fieldClassName}
            autoComplete="tel"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="companyWebsite"
            className="text-sm font-medium text-foreground"
          >
            {formWebsiteLabel}{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="companyWebsite"
            name="companyWebsite"
            type="url"
            placeholder="https://"
            value={companyWebsite}
            onChange={(event) => setCompanyWebsite(event.target.value)}
            className={fieldClassName}
            autoComplete="url"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="service"
            className="text-sm font-medium text-foreground"
          >
            {formServiceLabel}
          </label>
          <select
            id="service"
            name="service"
            value={service}
            onChange={(event) => setService(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select a service</option>
            {serviceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="budget"
            className="text-sm font-medium text-foreground"
          >
            {formBudgetLabel}
          </label>
          <select
            id="budget"
            name="budget"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select a range</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="message"
            className="text-sm font-medium text-foreground"
          >
            {formMessageLabel}
          </label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            placeholder={formMessagePlaceholder}
            className="w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            required
          />
          {fieldErrors.message ? (
            <p className="text-sm text-danger">{fieldErrors.message}</p>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <TurnstileWidget ref={turnstileRef} siteKey={turnstileSiteKey} />

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Sending…" : formSubmitLabel}
      </button>
    </form>
  );
}
