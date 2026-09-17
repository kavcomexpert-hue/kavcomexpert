import { z } from "zod";

export const postFaqSchema = z.object({
  q: z.string().trim().min(1),
  a: z.string().trim().min(1),
});

export type PostFaq = z.infer<typeof postFaqSchema>;

export function parsePostFaqs(value: unknown): PostFaq[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const parsed = postFaqSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function parseKeyTakeaways(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function postFaqsToFaqItems(faqs: PostFaq[]) {
  return faqs.map((faq) => ({
    question: faq.q,
    answer: faq.a,
  }));
}
