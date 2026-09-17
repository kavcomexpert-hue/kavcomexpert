type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

function stripContext(node: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...node };
  delete rest["@context"];
  return rest;
}

/**
 * Emits a single Google-friendly JSON-LD graph.
 * Escapes `<` so embedded script contents cannot break out of the tag.
 */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data)
    ? {
        "@context": "https://schema.org",
        "@graph": data.map(stripContext),
      }
    : data["@context"]
      ? data
      : { "@context": "https://schema.org", ...data };

  const json = JSON.stringify(payload).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
