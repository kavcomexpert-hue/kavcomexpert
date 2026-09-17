type ServiceTagsStripProps = {
  tags: readonly string[];
};

function TagsHalf({
  tags,
  hidden,
}: {
  tags: readonly string[];
  hidden?: boolean;
}) {
  return (
    <div
      className={`flex w-max items-center ${hidden ? "marquee-dup-half" : ""}`.trim()}
      aria-hidden={hidden || undefined}
    >
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="flex shrink-0 items-center gap-8 pr-8 text-base font-medium tracking-[-0.01em] text-muted md:text-lg"
        >
          {tag}
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-accent-lime"
          />
        </span>
      ))}
    </div>
  );
}

export function ServiceTagsStrip({ tags }: ServiceTagsStripProps) {
  return (
    <div
      className="border-y border-border bg-background"
      aria-label="Service capabilities"
    >
      <div className="logo-marquee-mask marquee-pause-hover overflow-hidden py-6">
        <div className="animate-marquee flex w-max items-center">
          <TagsHalf tags={tags} />
          <TagsHalf tags={tags} hidden />
        </div>
      </div>
    </div>
  );
}
