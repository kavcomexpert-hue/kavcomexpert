import { FAQ_ITEMS } from "@/components/houston-cpa/constants";
import { ChevronDown } from "lucide-react";

/**
 * FAQ answers live in the initial HTML via native <details>.
 * No conditional render of answer text.
 */
export function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-y border-border bg-surface"
    >
      <div className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
          FAQ
        </p>
        <h2
          id="faq-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Direct answers Houston CPA firms ask before hiring a marketing partner.
        </h2>
        <div className="mt-10 divide-y divide-border rounded-default border border-border bg-background">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group px-5 md:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-sm font-medium text-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </summary>
              <div className="pb-5">
                <p className="text-sm leading-relaxed text-muted">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
