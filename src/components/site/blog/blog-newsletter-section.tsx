"use client";

import { submitLeadCapture } from "@/actions/lead-capture";
import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { useFormStartedAt } from "@/components/site/form-spam-fields";
import {
  TurnstileWidget,
  type TurnstileHandle,
} from "@/components/site/turnstile-widget";
import {
  isTurnstileClientEnabled,
  TURNSTILE_FAILURE_MESSAGE,
} from "@/lib/security/turnstile-config";
import { Check } from "lucide-react";
import { useRef, useState } from "react";

type BlogNewsletterSectionProps = {
  eyebrow?: string;
  headline?: string;
  body?: string;
  perk1?: string;
  perk2?: string;
  perk3?: string;
  button?: string;
  success?: string;
  turnstileSiteKey?: string;
};

export function BlogNewsletterSection({
  eyebrow = "Newsletter",
  headline = "Get the next playbook before it hits the blog",
  body = "Short, practical notes on websites, SEO, and paid growth, written for operators who ship.",
  perk1 = "New articles in your inbox",
  perk2 = "SEO & growth playbooks",
  perk3 = "No spam. Unsubscribe anytime",
  button = "Subscribe",
  success = "You're on the list",
  turnstileSiteKey,
}: BlogNewsletterSectionProps = {}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { markStarted, getStartedAt } = useFormStartedAt();
  const turnstileRef = useRef<TurnstileHandle>(null);
  const perks = [perk1, perk2, perk3];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

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

    const result = await submitLeadCapture({
      email,
      source: "newsletter",
      message: "Blog newsletter signup",
      website: "",
      formStartedAt: getStartedAt(),
      turnstileToken,
    });

    setLoading(false);
    turnstileRef.current?.reset();

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="relative overflow-clip border-t border-border bg-surface py-20 md:py-28">
      <Ambient flip />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <BlurReveal>
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-4 max-w-xl text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
              {headline}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              {body}
            </p>
            <ul className="mt-6 space-y-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </BlurReveal>

          <BlurReveal delay={0.1}>
            <div className="rounded-default border border-border bg-background p-6 shadow-soft dark:shadow-none md:p-8">
              {submitted ? (
                <div className="flex flex-col items-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Check className="size-5" aria-hidden="true" />
                  </span>
                  <p className="text-lg font-semibold text-foreground">
                    {success}
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    Thanks, we&apos;ll send the next useful note to your inbox.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  onFocusCapture={markStarted}
                  className="relative space-y-4"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="newsletter-email"
                      className="text-sm font-medium text-foreground"
                    >
                      Work email
                    </label>
                    <input
                      id="newsletter-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      className="h-12 w-full rounded-default border border-border bg-surface px-4 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    />
                  </div>
                  {error ? <p className="text-sm text-danger">{error}</p> : null}
                  <TurnstileWidget
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? "Subscribing…" : button}
                  </button>
                  <p className="text-xs text-muted">
                    By subscribing you agree to receive occasional emails from
                    Kavcom Expert.
                  </p>
                </form>
              )}
            </div>
          </BlurReveal>
        </div>
      </div>
    </section>
  );
}
