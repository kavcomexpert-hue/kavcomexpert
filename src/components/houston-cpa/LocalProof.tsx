import { INTERNAL_LINKS } from "@/components/houston-cpa/constants";
import Link from "next/link";

export function LocalProof() {
  return (
    <section
      aria-labelledby="local-proof-heading"
      className="mx-auto max-w-[1120px] px-6 py-20 md:py-28"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
        Houston context
      </p>
      <h2
        id="local-proof-heading"
        className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
      >
        Local search for Houston CPAs is won with metro relevance, not a zip code
        dump.
      </h2>
      <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted">
        <p>
          We work with accounting firms that serve clients across Downtown,
          Midtown, the Galleria, The Woodlands, Sugar Land, Katy, and the broader
          Houston metro. The work stays specific to how Texas firms sell: entity
          choice, franchise tax questions, and the practical upside of no state
          income tax for many owner operators.
        </p>
        <p>
          Coverage runs on Central Time. That matters when a partner needs a
          Google Business Profile update before lunch, or when intake follow ups
          cannot wait for an overseas handoff. Our team overlaps the Houston
          business day so status checks and approvals land while you are still at
          the desk.
        </p>
        <p>
          Related services on kavcomexpert.com include{" "}
          {INTERNAL_LINKS.map((link, index) => (
            <span key={link.href}>
              <Link
                href={link.href}
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                {link.label}
              </Link>
              {index < INTERNAL_LINKS.length - 2
                ? ", "
                : index === INTERNAL_LINKS.length - 2
                  ? ", and "
                  : ""}
            </span>
          ))}
          .
        </p>
      </div>
    </section>
  );
}
