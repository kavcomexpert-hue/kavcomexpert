export type CaseStudyInfoDetail = {
  label: string;
  value: string;
};

export const MAX_INFO_DETAILS = 4;

export function parseInfoDetails(value: unknown): CaseStudyInfoDetail[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        !("label" in item) ||
        !("value" in item)
      ) {
        return [];
      }

      const label = typeof item.label === "string" ? item.label.trim() : "";
      const detailValue =
        typeof item.value === "string" ? item.value.trim() : "";

      if (!label || !detailValue) return [];
      return [{ label, value: detailValue }];
    })
    .slice(0, MAX_INFO_DETAILS);
}

export function compactInfoDetails(
  rows: CaseStudyInfoDetail[],
): CaseStudyInfoDetail[] {
  return rows
    .map((row) => ({
      label: row.label.trim(),
      value: row.value.trim(),
    }))
    .filter((row) => row.label && row.value)
    .slice(0, MAX_INFO_DETAILS);
}
