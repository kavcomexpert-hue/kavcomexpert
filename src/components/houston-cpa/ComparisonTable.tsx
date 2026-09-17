import { COMPARISON_ROWS } from "@/components/houston-cpa/constants";

export function ComparisonTable() {
  return (
    <section
      aria-labelledby="comparison-heading"
      className="mx-auto max-w-[1120px] px-6 py-20 md:py-28"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
        Compare options
      </p>
      <h2
        id="comparison-heading"
        className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
      >
        Kavcom Expert versus hiring in house versus a typical local Houston
        agency.
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        Figures below are directional ranges meant to help partners decide, not
        digs at any specific firm.
      </p>

      <div className="mt-10 overflow-x-auto rounded-default border border-border">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th scope="col" className="px-4 py-4 font-mono text-xs uppercase tracking-wider text-muted">
                Factor
              </th>
              <th scope="col" className="px-4 py-4 font-display font-semibold text-foreground">
                Kavcom Expert
              </th>
              <th scope="col" className="px-4 py-4 font-display font-semibold text-foreground">
                Hire in house
              </th>
              <th scope="col" className="px-4 py-4 font-display font-semibold text-foreground">
                Typical local agency
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <th
                  scope="row"
                  className="px-4 py-4 font-mono text-xs uppercase tracking-wider text-muted"
                >
                  {row.label}
                </th>
                <td className="px-4 py-4 text-foreground">{row.kavcom}</td>
                <td className="px-4 py-4 text-muted">{row.inHouse}</td>
                <td className="px-4 py-4 text-muted">{row.agency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
