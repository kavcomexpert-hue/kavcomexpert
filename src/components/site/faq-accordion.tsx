import type { FaqItem } from "@/lib/site/content-parsers";
import { ChevronDown } from "lucide-react";

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="divide-y divide-border rounded-default border border-border bg-surface">
      {items.map((item) => (
        <details key={item.question} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </summary>
          <div className="faq-content">
            <div>
              <p className="pb-5 text-sm leading-relaxed text-muted">
                {item.answer}
              </p>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
