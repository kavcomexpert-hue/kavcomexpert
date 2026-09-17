export type ParsedMetric =
  | {
      type: "numeric";
      prefix: string;
      value: number;
      suffix: string;
      decimals: number;
      remainder: string;
    }
  | {
      type: "text";
      text: string;
    };

export function parseResultMetric(metric: string): ParsedMetric {
  const trimmed = metric.trim();

  const leadingMatch = trimmed.match(/^([+\-]?)(\d+(?:\.\d+)?)(×|x|%)?/i);
  if (leadingMatch) {
    const numericPart = leadingMatch[2];
    return {
      type: "numeric",
      prefix: leadingMatch[1] ?? "",
      value: Number(numericPart),
      suffix: leadingMatch[3]?.replace(/x/i, "×") ?? "",
      decimals: numericPart.includes(".") ? 1 : 0,
      remainder: trimmed.slice(leadingMatch[0].length).trim(),
    };
  }

  const embeddedMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (embeddedMatch) {
    const numericPart = embeddedMatch[1];
    return {
      type: "numeric",
      prefix: "",
      value: Number(numericPart),
      suffix: "",
      decimals: numericPart.includes(".") ? 1 : 0,
      remainder: trimmed,
    };
  }

  return { type: "text", text: trimmed };
}

export function formatParsedMetric(parsed: ParsedMetric): string {
  if (parsed.type === "text") {
    return parsed.text;
  }

  const value = parsed.decimals
    ? parsed.value.toFixed(parsed.decimals)
    : String(Math.round(parsed.value));

  return `${parsed.prefix}${value}${parsed.suffix}${parsed.remainder ? ` ${parsed.remainder}` : ""}`.trim();
}
