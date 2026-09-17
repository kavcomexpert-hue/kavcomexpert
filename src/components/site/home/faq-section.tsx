import { JsonLd } from "@/components/seo/json-ld";
import { homeFaqItems, type FaqEntry } from "@/components/site/home/faq-data";
import {
  FaqSectionClient,
  type FaqSectionClientProps,
} from "@/components/site/home/faq-section-client";
import { getContentMap } from "@/lib/queries/content-blocks";
import { hasItems } from "@/lib/site/optional-section";

export type { FaqEntry };

export async function FaqSection(props: FaqSectionClientProps) {
  const items = props.items ?? homeFaqItems;

  if (!hasItems([...items])) {
    return null;
  }

  const cardCopy = await getContentMap([
    "global.faq.card_title",
    "global.faq.card_subtitle",
  ]);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <FaqSectionClient
        {...props}
        items={items}
        cardTitle={props.cardTitle ?? cardCopy["global.faq.card_title"]}
        cardSubtitle={
          props.cardSubtitle ?? cardCopy["global.faq.card_subtitle"]
        }
      />
    </>
  );
}
