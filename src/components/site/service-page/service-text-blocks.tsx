import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { RichText } from "@/components/site/rich-text";
import { isRenderableTextBlock } from "@/lib/services/page-sections";
import type { ServiceTextBlock } from "@/lib/site/service-pages/types";

export function ServiceTextBlocks({
  blocks,
}: {
  blocks: readonly ServiceTextBlock[];
}) {
  const visible = blocks.filter(isRenderableTextBlock);
  if (visible.length === 0) return null;

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-[1120px] space-y-16 px-6 md:space-y-24">
        {visible.map((block, index) => {
          const heading = block.heading?.trim();
          const subheading = block.subheading?.trim();
          const hasBody = isRenderableTextBlock({
            heading: "",
            subheading: "",
            body: block.body,
          });

          return (
            <BlurReveal key={`text-block-${index}`}>
              <article>
                {heading ? (
                  <h2 className="max-w-[720px] text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                    {heading}
                  </h2>
                ) : null}
                {subheading ? (
                  <p
                    className={`max-w-[720px] text-base leading-relaxed text-muted md:text-lg ${
                      heading ? "mt-3" : ""
                    }`}
                  >
                    {subheading}
                  </p>
                ) : null}
                {hasBody ? (
                  <div
                    className={`max-w-[720px] ${
                      heading || subheading ? "mt-6" : ""
                    }`}
                  >
                    <RichText content={block.body} />
                  </div>
                ) : null}
              </article>
            </BlurReveal>
          );
        })}
      </div>
    </section>
  );
}
