"use client";

import { saveContentBlock } from "@/actions/content-blocks";
import { LinkButtonField } from "@/components/admin/link-button-field";
import { MediaPicker } from "@/components/admin/media-picker";
import { useToast } from "@/components/ui/toast";
import {
  CONTENT_BLOCK_DEFS,
  isLinkButtonValue,
  textFromValue,
  type ContentBlockDef,
} from "@/lib/content/blocks";
import {
  normalizeLinkButton,
  type LinkButton,
} from "@/lib/content/link-button";
import type { ContentBlockValue } from "@/lib/db/schema";
import {
  aboutPageSectionsSchema,
  blogPageSectionsSchema,
  careersPageSectionsSchema,
  contactPageSectionsSchema,
  contentBlockPrefixForPage,
  HOME_TECH_ICON_KEYS,
  homePageSectionsSchema,
  servicesPageSectionsSchema,
  workPageSectionsSchema,
} from "@/lib/pages/page-section-schemas";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type BlockRow = {
  key: string;
  label: string;
  type: string;
  value: ContentBlockValue;
};

type PageContentEditorProps = {
  pageSlug: string;
  pageSections: unknown;
  onPageSectionsChange: (value: unknown) => void;
  contentBlocks: BlockRow[];
};

function defaultLinkFromDef(def: ContentBlockDef): LinkButton {
  if (isLinkButtonValue(def.defaultValue)) return { ...def.defaultValue };
  return { label: textFromValue(def.defaultValue, ""), href: "/", enabled: true };
}

function BlockField({
  block,
  draft,
  alt,
  linkDraft,
  onDraftChange,
  onAltChange,
  onLinkChange,
  onSave,
  saving,
  onPickImage,
}: {
  block: ContentBlockDef;
  draft: string;
  alt: string;
  linkDraft: LinkButton;
  onDraftChange: (v: string) => void;
  onAltChange: (v: string) => void;
  onLinkChange: (v: LinkButton) => void;
  onSave: () => void;
  saving: boolean;
  onPickImage: () => void;
}) {
  return (
    <div className="space-y-2 rounded-default border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{block.label}</p>
          <p className="font-mono text-[10px] text-muted">{block.key}</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-default bg-accent px-3 text-xs font-medium text-surface disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {block.type === "linkbutton" ? (
        <LinkButtonField value={linkDraft} onChange={onLinkChange} />
      ) : block.type === "richtext" ? (
        <textarea
          rows={4}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          className={fieldClassName}
        />
      ) : block.type === "image" ? (
        <div className="space-y-2">
          {draft ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft}
              alt={alt || block.label}
              className="max-h-32 rounded-default border border-border object-contain"
            />
          ) : null}
          <input
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Alt text (required)"
            className={fieldClassName}
          />
          <button
            type="button"
            onClick={onPickImage}
            className="text-sm font-medium text-accent"
          >
            Choose image
          </button>
        </div>
      ) : (
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          className={fieldClassName}
        />
      )}
    </div>
  );
}

function HeroFields({
  hero,
  onChange,
}: {
  hero: { eyebrow: string; headline: string; subtext: string };
  onChange: (hero: { eyebrow: string; headline: string; subtext: string }) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-1">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Eyebrow</label>
        <input
          value={hero.eyebrow}
          onChange={(e) => onChange({ ...hero, eyebrow: e.target.value })}
          className={fieldClassName}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Headline</label>
        <input
          value={hero.headline}
          onChange={(e) => onChange({ ...hero, headline: e.target.value })}
          className={fieldClassName}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Subtext</label>
        <textarea
          rows={3}
          value={hero.subtext}
          onChange={(e) => onChange({ ...hero, subtext: e.target.value })}
          className={fieldClassName}
        />
      </div>
    </div>
  );
}

export function PageContentEditor({
  pageSlug,
  pageSections,
  onPageSectionsChange,
  contentBlocks,
}: PageContentEditorProps) {
  const { toast } = useToast();
  const router = useRouter();
  const prefixes = contentBlockPrefixForPage(pageSlug);

  const blockDefs = useMemo(() => {
    if (!prefixes) return [];
    return CONTENT_BLOCK_DEFS.filter((def) =>
      prefixes.some((p) => def.key.startsWith(p)),
    );
  }, [prefixes]);

  const blockRows = useMemo(() => {
    const byKey = new Map(contentBlocks.map((b) => [b.key, b]));
    return blockDefs.map((def) => {
      const row = byKey.get(def.key);
      return {
        def,
        value: row?.value ?? def.defaultValue,
      };
    });
  }, [blockDefs, contentBlocks]);

  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      blockRows
        .filter(({ def }) => def.type !== "linkbutton")
        .map(({ def, value }) => [
          def.key,
          def.type === "image"
            ? "url" in value && typeof value.url === "string"
              ? value.url
              : ""
            : textFromValue(value, ""),
        ]),
    ),
  );
  const [linkDrafts, setLinkDrafts] = useState<Record<string, LinkButton>>(
    () =>
      Object.fromEntries(
        blockRows
          .filter(({ def }) => def.type === "linkbutton")
          .map(({ def, value }) => [
            def.key,
            normalizeLinkButton(value, defaultLinkFromDef(def)),
          ]),
      ),
  );
  const [alts, setAlts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      blockRows
        .filter(({ def }) => def.type === "image")
        .map(({ def, value }) => [
          def.key,
          "alt" in value && typeof value.alt === "string" ? value.alt : "",
        ]),
    ),
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  async function saveBlock(def: ContentBlockDef) {
    setSavingKey(def.key);
    const link = linkDrafts[def.key] ?? defaultLinkFromDef(def);
    const result = await saveContentBlock({
      key: def.key,
      type: def.type,
      text: drafts[def.key],
      url: drafts[def.key],
      alt: alts[def.key],
      label: link.label,
      href: link.href,
      enabled: link.enabled,
    });
    setSavingKey(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Saved");
    router.refresh();
  }

  const contact = contactPageSectionsSchema.parse(pageSections ?? {});
  const work = workPageSectionsSchema.parse(pageSections ?? {});
  const careers = careersPageSectionsSchema.parse(pageSections ?? {});
  const blog = blogPageSectionsSchema.parse(pageSections ?? {});
  const home = homePageSectionsSchema.parse(pageSections ?? {});
  const about = aboutPageSectionsSchema.parse(pageSections ?? {});
  const servicesSections = servicesPageSectionsSchema.parse(pageSections ?? {});

  const showsContentBlocks =
    pageSlug === "home" ||
    pageSlug === "about-us" ||
    pageSlug === "services" ||
    pageSlug === "blog";

  return (
    <div className="space-y-6">
      {showsContentBlocks ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {pageSlug === "home"
              ? "Homepage sections"
              : pageSlug === "services"
                ? "Services index"
                : pageSlug === "blog"
                  ? "Blog content"
                  : "About page hero & CTAs"}
          </h2>
          <div className="space-y-3">
            {blockRows.map(({ def }) => (
              <BlockField
                key={def.key}
                block={def}
                draft={drafts[def.key] ?? ""}
                alt={alts[def.key] ?? ""}
                linkDraft={
                  linkDrafts[def.key] ?? defaultLinkFromDef(def)
                }
                onDraftChange={(v) =>
                  setDrafts((d) => ({ ...d, [def.key]: v }))
                }
                onAltChange={(v) => setAlts((a) => ({ ...a, [def.key]: v }))}
                onLinkChange={(v) =>
                  setLinkDrafts((d) => ({ ...d, [def.key]: v }))
                }
                onSave={() => void saveBlock(def)}
                saving={savingKey === def.key}
                onPickImage={() => setPickerKey(def.key)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {pageSlug === "home" ? (
        <section className="space-y-4 rounded-default border border-border bg-surface p-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Homepage FAQ answers
            </h2>
            <p className="mt-1 text-sm text-muted">
              FAQ eyebrow, headline, and CTA are in the content blocks above.
              Edit the Q&amp;A list here, then save the page.
            </p>
          </div>
          {home.faqs.map((faq, index) => (
            <div
              key={index}
              className="space-y-2 rounded-default border border-border bg-background p-3"
            >
              <input
                value={faq.question}
                onChange={(e) => {
                  const faqs = [...home.faqs];
                  faqs[index] = { ...faqs[index], question: e.target.value };
                  onPageSectionsChange(
                    homePageSectionsSchema.parse({ ...home, faqs }),
                  );
                }}
                placeholder="Question"
                className={fieldClassName}
              />
              <textarea
                rows={3}
                value={faq.answer}
                onChange={(e) => {
                  const faqs = [...home.faqs];
                  faqs[index] = { ...faqs[index], answer: e.target.value };
                  onPageSectionsChange(
                    homePageSectionsSchema.parse({ ...home, faqs }),
                  );
                }}
                placeholder="Answer"
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={() =>
                  onPageSectionsChange(
                    homePageSectionsSchema.parse({
                      ...home,
                      faqs: home.faqs.filter((_, i) => i !== index),
                    }),
                  )
                }
                className="text-xs text-danger"
              >
                Remove FAQ
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onPageSectionsChange(
                homePageSectionsSchema.parse({
                  ...home,
                  faqs: [...home.faqs, { question: "", answer: "" }],
                }),
              )
            }
            className="text-sm font-medium text-accent"
          >
            Add FAQ
          </button>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Why reason cards
            </h3>
            {home.whyReasons.map((item, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={item.title}
                  onChange={(e) => {
                    const whyReasons = [...home.whyReasons];
                    whyReasons[index] = {
                      ...whyReasons[index],
                      title: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, whyReasons }),
                    );
                  }}
                  placeholder="Title"
                  className={fieldClassName}
                />
                <textarea
                  rows={2}
                  value={item.body}
                  onChange={(e) => {
                    const whyReasons = [...home.whyReasons];
                    whyReasons[index] = {
                      ...whyReasons[index],
                      body: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, whyReasons }),
                    );
                  }}
                  placeholder="Body"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({
                        ...home,
                        whyReasons: home.whyReasons.filter((_, i) => i !== index),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  homePageSectionsSchema.parse({
                    ...home,
                    whyReasons: [
                      ...home.whyReasons,
                      { title: "", body: "" },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add reason
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Process steps
            </h3>
            {home.processSteps.map((step, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={step.number}
                  onChange={(e) => {
                    const processSteps = [...home.processSteps];
                    processSteps[index] = {
                      ...processSteps[index],
                      number: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, processSteps }),
                    );
                  }}
                  placeholder="Number"
                  className={fieldClassName}
                />
                <input
                  value={step.name}
                  onChange={(e) => {
                    const processSteps = [...home.processSteps];
                    processSteps[index] = {
                      ...processSteps[index],
                      name: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, processSteps }),
                    );
                  }}
                  placeholder="Name"
                  className={fieldClassName}
                />
                <textarea
                  rows={2}
                  value={step.description}
                  onChange={(e) => {
                    const processSteps = [...home.processSteps];
                    processSteps[index] = {
                      ...processSteps[index],
                      description: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, processSteps }),
                    );
                  }}
                  placeholder="Description"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({
                        ...home,
                        processSteps: home.processSteps.filter(
                          (_, i) => i !== index,
                        ),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  homePageSectionsSchema.parse({
                    ...home,
                    processSteps: [
                      ...home.processSteps,
                      { number: "", name: "", description: "" },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add step
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Benefits cards
            </h3>
            {home.benefits.map((item, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={item.title}
                  onChange={(e) => {
                    const benefits = [...home.benefits];
                    benefits[index] = {
                      ...benefits[index],
                      title: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, benefits }),
                    );
                  }}
                  placeholder="Title"
                  className={fieldClassName}
                />
                <textarea
                  rows={2}
                  value={item.body}
                  onChange={(e) => {
                    const benefits = [...home.benefits];
                    benefits[index] = {
                      ...benefits[index],
                      body: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, benefits }),
                    );
                  }}
                  placeholder="Body"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({
                        ...home,
                        benefits: home.benefits.filter((_, i) => i !== index),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  homePageSectionsSchema.parse({
                    ...home,
                    benefits: [...home.benefits, { title: "", body: "" }],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add benefit
            </button>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Service ticker (comma-separated)
            </h3>
            <input
              value={home.tickerItems.join(", ")}
              onChange={(e) =>
                onPageSectionsChange(
                  homePageSectionsSchema.parse({
                    ...home,
                    tickerItems: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  }),
                )
              }
              className={fieldClassName}
            />
            <h3 className="pt-2 text-sm font-semibold text-foreground">
              Hero rotating words (comma-separated)
            </h3>
            <input
              value={home.rotatingWords.join(", ")}
              onChange={(e) =>
                onPageSectionsChange(
                  homePageSectionsSchema.parse({
                    ...home,
                    rotatingWords: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  }),
                )
              }
              className={fieldClassName}
            />
            <h3 className="pt-2 text-sm font-semibold text-foreground">
              Hero tech badges
            </h3>
            <p className="text-xs text-muted">
              Label is the visible text. Icon picks from the built-in icon set
              (layout positions stay fixed so the hero look does not change).
            </p>
            {home.techBadges.map((badge, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-default border border-border bg-background p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  value={badge.label}
                  onChange={(e) => {
                    const techBadges = [...home.techBadges];
                    techBadges[index] = {
                      ...techBadges[index],
                      label: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({
                        ...home,
                        techBadges,
                        techBadgeLabels: techBadges.map((b) => b.label),
                      }),
                    );
                  }}
                  placeholder="Label"
                  className={fieldClassName}
                />
                <select
                  value={badge.iconKey || badge.label}
                  onChange={(e) => {
                    const techBadges = [...home.techBadges];
                    techBadges[index] = {
                      ...techBadges[index],
                      iconKey: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({
                        ...home,
                        techBadges,
                        techBadgeLabels: techBadges.map((b) => b.label),
                      }),
                    );
                  }}
                  className={fieldClassName}
                >
                  {HOME_TECH_ICON_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const techBadges = home.techBadges.filter(
                      (_, i) => i !== index,
                    );
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({
                        ...home,
                        techBadges,
                        techBadgeLabels: techBadges.map((b) => b.label),
                      }),
                    );
                  }}
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const techBadges = [
                  ...home.techBadges,
                  { label: "WordPress", iconKey: "WordPress" },
                ];
                onPageSectionsChange(
                  homePageSectionsSchema.parse({
                    ...home,
                    techBadges,
                    techBadgeLabels: techBadges.map((b) => b.label),
                  }),
                );
              }}
              className="text-sm font-medium text-accent"
            >
              Add tech badge
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Client logos
            </h3>
            {home.clientLogos.map((logo, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={logo.name}
                  onChange={(e) => {
                    const clientLogos = [...home.clientLogos];
                    clientLogos[index] = {
                      ...clientLogos[index],
                      name: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, clientLogos }),
                    );
                  }}
                  placeholder="Name"
                  className={fieldClassName}
                />
                <input
                  value={logo.src}
                  onChange={(e) => {
                    const clientLogos = [...home.clientLogos];
                    clientLogos[index] = {
                      ...clientLogos[index],
                      src: e.target.value,
                    };
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({ ...home, clientLogos }),
                    );
                  }}
                  placeholder="/logos/example.png"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({
                        ...home,
                        clientLogos: home.clientLogos.filter(
                          (_, i) => i !== index,
                        ),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  homePageSectionsSchema.parse({
                    ...home,
                    clientLogos: [
                      ...home.clientLogos,
                      { name: "", src: "" },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add logo
            </button>
          </div>

          {(
            [
              ["devServiceCards", "Dev service cards"],
              ["growthServiceCards", "Growth service cards"],
            ] as const
          ).map(([key, title]) => (
            <div key={key} className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              {home[key].map((card, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-default border border-border bg-background p-3"
                >
                  {(
                    [
                      ["slug", "Slug"],
                      ["name", "Name"],
                      ["href", "Href"],
                    ] as const
                  ).map(([field, label]) => (
                    <input
                      key={field}
                      value={card[field]}
                      onChange={(e) => {
                        const cards = [...home[key]];
                        cards[index] = {
                          ...cards[index],
                          [field]: e.target.value,
                        };
                        onPageSectionsChange(
                          homePageSectionsSchema.parse({
                            ...home,
                            [key]: cards,
                          }),
                        );
                      }}
                      placeholder={label}
                      className={fieldClassName}
                    />
                  ))}
                  <textarea
                    rows={2}
                    value={card.description}
                    onChange={(e) => {
                      const cards = [...home[key]];
                      cards[index] = {
                        ...cards[index],
                        description: e.target.value,
                      };
                      onPageSectionsChange(
                        homePageSectionsSchema.parse({
                          ...home,
                          [key]: cards,
                        }),
                      );
                    }}
                    placeholder="Description"
                    className={fieldClassName}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onPageSectionsChange(
                        homePageSectionsSchema.parse({
                          ...home,
                          [key]: home[key].filter((_, i) => i !== index),
                        }),
                      )
                    }
                    className="text-xs text-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  onPageSectionsChange(
                    homePageSectionsSchema.parse({
                      ...home,
                      [key]: [
                        ...home[key],
                        { slug: "", name: "", href: "", description: "" },
                      ],
                    }),
                  )
                }
                className="text-sm font-medium text-accent"
              >
                Add card
              </button>
            </div>
          ))}

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Video testimonials (CMS fallback)
            </h3>
            <p className="text-xs text-muted">
              Used when no published video testimonials exist in the database.
            </p>
            {home.videoTestimonials.map((item, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                {(
                  [
                    ["id", "Id"],
                    ["name", "Name"],
                    ["company", "Company"],
                    ["youtubeId", "YouTube ID"],
                    ["videoSrc", "Video src"],
                    ["posterSrc", "Poster src"],
                  ] as const
                ).map(([field, label]) => (
                  <input
                    key={field}
                    value={item[field]}
                    onChange={(e) => {
                      const videoTestimonials = [...home.videoTestimonials];
                      videoTestimonials[index] = {
                        ...videoTestimonials[index],
                        [field]: e.target.value,
                      };
                      onPageSectionsChange(
                        homePageSectionsSchema.parse({
                          ...home,
                          videoTestimonials,
                        }),
                      );
                    }}
                    placeholder={label}
                    className={fieldClassName}
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      homePageSectionsSchema.parse({
                        ...home,
                        videoTestimonials: home.videoTestimonials.filter(
                          (_, i) => i !== index,
                        ),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  homePageSectionsSchema.parse({
                    ...home,
                    videoTestimonials: [
                      ...home.videoTestimonials,
                      {
                        id: "",
                        name: "",
                        company: "",
                        videoSrc: "",
                        youtubeId: "",
                        posterSrc: "",
                      },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add video testimonial
            </button>
          </div>
        </section>
      ) : null}

      {pageSlug === "services" ? (
        <section className="space-y-4 rounded-default border border-border bg-surface p-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Services index FAQ &amp; tech stack
          </h2>
          <input
            value={servicesSections.faqEyebrow}
            onChange={(e) =>
              onPageSectionsChange(
                servicesPageSectionsSchema.parse({
                  ...servicesSections,
                  faqEyebrow: e.target.value,
                }),
              )
            }
            placeholder="FAQ eyebrow"
            className={fieldClassName}
          />
          <input
            value={servicesSections.faqHeadline}
            onChange={(e) =>
              onPageSectionsChange(
                servicesPageSectionsSchema.parse({
                  ...servicesSections,
                  faqHeadline: e.target.value,
                }),
              )
            }
            placeholder="FAQ headline"
            className={fieldClassName}
          />
          <textarea
            rows={2}
            value={servicesSections.faqDescription}
            onChange={(e) =>
              onPageSectionsChange(
                servicesPageSectionsSchema.parse({
                  ...servicesSections,
                  faqDescription: e.target.value,
                }),
              )
            }
            placeholder="FAQ description"
            className={fieldClassName}
          />
          {servicesSections.faqs.map((faq, index) => (
            <div
              key={index}
              className="space-y-2 rounded-default border border-border bg-background p-3"
            >
              <input
                value={faq.question}
                onChange={(e) => {
                  const faqs = [...servicesSections.faqs];
                  faqs[index] = { ...faqs[index], question: e.target.value };
                  onPageSectionsChange(
                    servicesPageSectionsSchema.parse({
                      ...servicesSections,
                      faqs,
                    }),
                  );
                }}
                placeholder="Question"
                className={fieldClassName}
              />
              <textarea
                rows={2}
                value={faq.answer}
                onChange={(e) => {
                  const faqs = [...servicesSections.faqs];
                  faqs[index] = { ...faqs[index], answer: e.target.value };
                  onPageSectionsChange(
                    servicesPageSectionsSchema.parse({
                      ...servicesSections,
                      faqs,
                    }),
                  );
                }}
                placeholder="Answer"
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={() =>
                  onPageSectionsChange(
                    servicesPageSectionsSchema.parse({
                      ...servicesSections,
                      faqs: servicesSections.faqs.filter((_, i) => i !== index),
                    }),
                  )
                }
                className="text-xs text-danger"
              >
                Remove FAQ
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onPageSectionsChange(
                servicesPageSectionsSchema.parse({
                  ...servicesSections,
                  faqs: [
                    ...servicesSections.faqs,
                    { question: "", answer: "" },
                  ],
                }),
              )
            }
            className="text-sm font-medium text-accent"
          >
            Add FAQ
          </button>
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">FAQ CTA</h3>
            <LinkButtonField
              value={servicesSections.faqCta}
              onChange={(faqCta) =>
                onPageSectionsChange(
                  servicesPageSectionsSchema.parse({
                    ...servicesSections,
                    faqCta,
                  }),
                )
              }
            />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Hero nav pills
            </h3>
            {servicesSections.heroNavPills.map((pill, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={pill.label}
                  onChange={(e) => {
                    const heroNavPills = [...servicesSections.heroNavPills];
                    heroNavPills[index] = {
                      ...heroNavPills[index],
                      label: e.target.value,
                    };
                    onPageSectionsChange(
                      servicesPageSectionsSchema.parse({
                        ...servicesSections,
                        heroNavPills,
                      }),
                    );
                  }}
                  placeholder="Label"
                  className={fieldClassName}
                />
                <input
                  value={pill.href}
                  onChange={(e) => {
                    const heroNavPills = [...servicesSections.heroNavPills];
                    heroNavPills[index] = {
                      ...heroNavPills[index],
                      href: e.target.value,
                    };
                    onPageSectionsChange(
                      servicesPageSectionsSchema.parse({
                        ...servicesSections,
                        heroNavPills,
                      }),
                    );
                  }}
                  placeholder="#anchor"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      servicesPageSectionsSchema.parse({
                        ...servicesSections,
                        heroNavPills: servicesSections.heroNavPills.filter(
                          (_, i) => i !== index,
                        ),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  servicesPageSectionsSchema.parse({
                    ...servicesSections,
                    heroNavPills: [
                      ...servicesSections.heroNavPills,
                      { label: "", href: "" },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add pill
            </button>
          </div>
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Tech stack headers
            </h3>
            {(
              [
                ["techEyebrow", "Eyebrow"],
                ["techHeadline", "Headline"],
              ] as const
            ).map(([key, label]) => (
              <input
                key={key}
                value={servicesSections[key]}
                onChange={(e) =>
                  onPageSectionsChange(
                    servicesPageSectionsSchema.parse({
                      ...servicesSections,
                      [key]: e.target.value,
                    }),
                  )
                }
                placeholder={label}
                className={fieldClassName}
              />
            ))}
            <textarea
              rows={2}
              value={servicesSections.techBody}
              onChange={(e) =>
                onPageSectionsChange(
                  servicesPageSectionsSchema.parse({
                    ...servicesSections,
                    techBody: e.target.value,
                  }),
                )
              }
              placeholder="Body"
              className={fieldClassName}
            />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Tech categories
            </h3>
            {servicesSections.techCategories.map((category, catIndex) => (
              <div
                key={catIndex}
                className="space-y-3 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={category.title}
                  onChange={(e) => {
                    const techCategories = [
                      ...servicesSections.techCategories,
                    ];
                    techCategories[catIndex] = {
                      ...techCategories[catIndex],
                      title: e.target.value,
                    };
                    onPageSectionsChange(
                      servicesPageSectionsSchema.parse({
                        ...servicesSections,
                        techCategories,
                      }),
                    );
                  }}
                  placeholder="Category title"
                  className={fieldClassName}
                />
                <textarea
                  rows={2}
                  value={category.description}
                  onChange={(e) => {
                    const techCategories = [
                      ...servicesSections.techCategories,
                    ];
                    techCategories[catIndex] = {
                      ...techCategories[catIndex],
                      description: e.target.value,
                    };
                    onPageSectionsChange(
                      servicesPageSectionsSchema.parse({
                        ...servicesSections,
                        techCategories,
                      }),
                    );
                  }}
                  placeholder="Category description"
                  className={fieldClassName}
                />
                <p className="text-xs font-medium text-muted">Logos</p>
                {category.logos.map((logo, logoIndex) => (
                  <div
                    key={logoIndex}
                    className="space-y-2 rounded-default border border-border bg-surface p-2"
                  >
                    {(
                      [
                        ["name", "Name"],
                        ["src", "Src"],
                        ["darkSrc", "Dark src (optional)"],
                      ] as const
                    ).map(([field, label]) => (
                      <input
                        key={field}
                        value={logo[field]}
                        onChange={(e) => {
                          const techCategories = [
                            ...servicesSections.techCategories,
                          ];
                          const logos = [...techCategories[catIndex].logos];
                          logos[logoIndex] = {
                            ...logos[logoIndex],
                            [field]: e.target.value,
                          };
                          techCategories[catIndex] = {
                            ...techCategories[catIndex],
                            logos,
                          };
                          onPageSectionsChange(
                            servicesPageSectionsSchema.parse({
                              ...servicesSections,
                              techCategories,
                            }),
                          );
                        }}
                        placeholder={label}
                        className={fieldClassName}
                      />
                    ))}
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={logo.wide}
                        onChange={(e) => {
                          const techCategories = [
                            ...servicesSections.techCategories,
                          ];
                          const logos = [...techCategories[catIndex].logos];
                          logos[logoIndex] = {
                            ...logos[logoIndex],
                            wide: e.target.checked,
                          };
                          techCategories[catIndex] = {
                            ...techCategories[catIndex],
                            logos,
                          };
                          onPageSectionsChange(
                            servicesPageSectionsSchema.parse({
                              ...servicesSections,
                              techCategories,
                            }),
                          );
                        }}
                      />
                      Wide mark
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const techCategories = [
                          ...servicesSections.techCategories,
                        ];
                        techCategories[catIndex] = {
                          ...techCategories[catIndex],
                          logos: techCategories[catIndex].logos.filter(
                            (_, i) => i !== logoIndex,
                          ),
                        };
                        onPageSectionsChange(
                          servicesPageSectionsSchema.parse({
                            ...servicesSections,
                            techCategories,
                          }),
                        );
                      }}
                      className="text-xs text-danger"
                    >
                      Remove logo
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const techCategories = [
                      ...servicesSections.techCategories,
                    ];
                    techCategories[catIndex] = {
                      ...techCategories[catIndex],
                      logos: [
                        ...techCategories[catIndex].logos,
                        { name: "", src: "", darkSrc: "", wide: false },
                      ],
                    };
                    onPageSectionsChange(
                      servicesPageSectionsSchema.parse({
                        ...servicesSections,
                        techCategories,
                      }),
                    );
                  }}
                  className="text-sm font-medium text-accent"
                >
                  Add logo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      servicesPageSectionsSchema.parse({
                        ...servicesSections,
                        techCategories: servicesSections.techCategories.filter(
                          (_, i) => i !== catIndex,
                        ),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove category
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  servicesPageSectionsSchema.parse({
                    ...servicesSections,
                    techCategories: [
                      ...servicesSections.techCategories,
                      { title: "", description: "", logos: [] },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add category
            </button>
          </div>
        </section>
      ) : null}

      {pageSlug === "about-us" ? (
        <section className="space-y-6 rounded-default border border-border bg-surface p-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              About page sections
            </h2>
            <p className="mt-1 text-sm text-muted">
              Edit mission, who we are, why choose us, and FAQ copy. Save the
              page to publish.
            </p>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Mission, vision &amp; values
            </h3>
            <input
              value={about.missionEyebrow}
              onChange={(e) =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    missionEyebrow: e.target.value,
                  }),
                )
              }
              placeholder="Section eyebrow"
              className={fieldClassName}
            />
            <input
              value={about.missionHeadline}
              onChange={(e) =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    missionHeadline: e.target.value,
                  }),
                )
              }
              placeholder="Section headline"
              className={fieldClassName}
            />
            {about.missionItems.map((item, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                {(
                  [
                    ["eyebrow", "Card eyebrow"],
                    ["title", "Card title"],
                    ["body", "Card body"],
                  ] as const
                ).map(([key, label]) =>
                  key === "body" ? (
                    <textarea
                      key={key}
                      rows={3}
                      value={item[key]}
                      onChange={(e) => {
                        const missionItems = [...about.missionItems];
                        missionItems[index] = {
                          ...missionItems[index],
                          [key]: e.target.value,
                        };
                        onPageSectionsChange(
                          aboutPageSectionsSchema.parse({
                            ...about,
                            missionItems,
                          }),
                        );
                      }}
                      placeholder={label}
                      className={fieldClassName}
                    />
                  ) : (
                    <input
                      key={key}
                      value={item[key]}
                      onChange={(e) => {
                        const missionItems = [...about.missionItems];
                        missionItems[index] = {
                          ...missionItems[index],
                          [key]: e.target.value,
                        };
                        onPageSectionsChange(
                          aboutPageSectionsSchema.parse({
                            ...about,
                            missionItems,
                          }),
                        );
                      }}
                      placeholder={label}
                      className={fieldClassName}
                    />
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({
                        ...about,
                        missionItems: about.missionItems.filter(
                          (_, i) => i !== index,
                        ),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    missionItems: [
                      ...about.missionItems,
                      { eyebrow: "", title: "", body: "" },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add mission item
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">Who we are</h3>
            {(
              [
                ["whoEyebrow", "Eyebrow"],
                ["whoHeadlineLead", "Headline (before accent)"],
                ["whoHeadlineAccent", "Headline accent"],
              ] as const
            ).map(([key, label]) => (
              <input
                key={key}
                value={about[key]}
                onChange={(e) =>
                  onPageSectionsChange(
                    aboutPageSectionsSchema.parse({
                      ...about,
                      [key]: e.target.value,
                    }),
                  )
                }
                placeholder={label}
                className={fieldClassName}
              />
            ))}
            <textarea
              rows={3}
              value={about.whoBody}
              onChange={(e) =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    whoBody: e.target.value,
                  }),
                )
              }
              placeholder="Body"
              className={fieldClassName}
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted">
                Tags (comma-separated)
              </label>
              <input
                value={about.whoTags.join(", ")}
                onChange={(e) =>
                  onPageSectionsChange(
                    aboutPageSectionsSchema.parse({
                      ...about,
                      whoTags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    }),
                  )
                }
                className={fieldClassName}
              />
            </div>
            <p className="text-xs font-medium text-muted">Highlights</p>
            {about.whoHighlights.map((item, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={item.title}
                  onChange={(e) => {
                    const whoHighlights = [...about.whoHighlights];
                    whoHighlights[index] = {
                      ...whoHighlights[index],
                      title: e.target.value,
                    };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({
                        ...about,
                        whoHighlights,
                      }),
                    );
                  }}
                  placeholder="Title"
                  className={fieldClassName}
                />
                <textarea
                  rows={2}
                  value={item.body}
                  onChange={(e) => {
                    const whoHighlights = [...about.whoHighlights];
                    whoHighlights[index] = {
                      ...whoHighlights[index],
                      body: e.target.value,
                    };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({
                        ...about,
                        whoHighlights,
                      }),
                    );
                  }}
                  placeholder="Body"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({
                        ...about,
                        whoHighlights: about.whoHighlights.filter(
                          (_, i) => i !== index,
                        ),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    whoHighlights: [
                      ...about.whoHighlights,
                      { title: "", body: "" },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add highlight
            </button>
            <p className="text-xs font-medium text-muted">Stats</p>
            {about.whoStats.map((stat, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-2"
              >
                <input
                  value={stat.metric}
                  onChange={(e) => {
                    const whoStats = [...about.whoStats];
                    whoStats[index] = {
                      ...whoStats[index],
                      metric: e.target.value,
                    };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({ ...about, whoStats }),
                    );
                  }}
                  placeholder="Metric"
                  className={fieldClassName}
                />
                <input
                  value={stat.label}
                  onChange={(e) => {
                    const whoStats = [...about.whoStats];
                    whoStats[index] = {
                      ...whoStats[index],
                      label: e.target.value,
                    };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({ ...about, whoStats }),
                    );
                  }}
                  placeholder="Label"
                  className={fieldClassName}
                />
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Why choose us
            </h3>
            {(
              [
                ["whyEyebrow", "Eyebrow"],
                ["whyHeadlineLead", "Headline (before accent)"],
                ["whyHeadlineAccent", "Headline accent"],
              ] as const
            ).map(([key, label]) => (
              <input
                key={key}
                value={about[key]}
                onChange={(e) =>
                  onPageSectionsChange(
                    aboutPageSectionsSchema.parse({
                      ...about,
                      [key]: e.target.value,
                    }),
                  )
                }
                placeholder={label}
                className={fieldClassName}
              />
            ))}
            <textarea
              rows={3}
              value={about.whyBody}
              onChange={(e) =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    whyBody: e.target.value,
                  }),
                )
              }
              placeholder="Body"
              className={fieldClassName}
            />
            {about.whyReasons.map((reason, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={reason.index}
                  onChange={(e) => {
                    const whyReasons = [...about.whyReasons];
                    whyReasons[index] = {
                      ...whyReasons[index],
                      index: e.target.value,
                    };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({ ...about, whyReasons }),
                    );
                  }}
                  placeholder="Index (01)"
                  className={fieldClassName}
                />
                <input
                  value={reason.title}
                  onChange={(e) => {
                    const whyReasons = [...about.whyReasons];
                    whyReasons[index] = {
                      ...whyReasons[index],
                      title: e.target.value,
                    };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({ ...about, whyReasons }),
                    );
                  }}
                  placeholder="Title"
                  className={fieldClassName}
                />
                <textarea
                  rows={2}
                  value={reason.body}
                  onChange={(e) => {
                    const whyReasons = [...about.whyReasons];
                    whyReasons[index] = {
                      ...whyReasons[index],
                      body: e.target.value,
                    };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({ ...about, whyReasons }),
                    );
                  }}
                  placeholder="Body"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({
                        ...about,
                        whyReasons: about.whyReasons.filter(
                          (_, i) => i !== index,
                        ),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    whyReasons: [
                      ...about.whyReasons,
                      { index: "", title: "", body: "" },
                    ],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add reason
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">FAQ section</h3>
            <input
              value={about.faqEyebrow}
              onChange={(e) =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    faqEyebrow: e.target.value,
                  }),
                )
              }
              placeholder="FAQ eyebrow"
              className={fieldClassName}
            />
            <input
              value={about.faqHeadline}
              onChange={(e) =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    faqHeadline: e.target.value,
                  }),
                )
              }
              placeholder="FAQ headline"
              className={fieldClassName}
            />
            {about.faqs.map((faq, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={faq.question}
                  onChange={(e) => {
                    const faqs = [...about.faqs];
                    faqs[index] = { ...faqs[index], question: e.target.value };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({ ...about, faqs }),
                    );
                  }}
                  placeholder="Question"
                  className={fieldClassName}
                />
                <textarea
                  rows={3}
                  value={faq.answer}
                  onChange={(e) => {
                    const faqs = [...about.faqs];
                    faqs[index] = { ...faqs[index], answer: e.target.value };
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({ ...about, faqs }),
                    );
                  }}
                  placeholder="Answer"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      aboutPageSectionsSchema.parse({
                        ...about,
                        faqs: about.faqs.filter((_, i) => i !== index),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove FAQ
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    faqs: [...about.faqs, { question: "", answer: "" }],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add FAQ
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Social proof headers
            </h3>
            <input
              value={about.socialProofEyebrow}
              onChange={(e) =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    socialProofEyebrow: e.target.value,
                  }),
                )
              }
              placeholder="Eyebrow"
              className={fieldClassName}
            />
            <input
              value={about.socialProofHeadline}
              onChange={(e) =>
                onPageSectionsChange(
                  aboutPageSectionsSchema.parse({
                    ...about,
                    socialProofHeadline: e.target.value,
                  }),
                )
              }
              placeholder="Headline"
              className={fieldClassName}
            />
          </div>
        </section>
      ) : null}

      {pageSlug === "work" ? (
        <>
          <section className="space-y-3 rounded-default border border-border bg-surface p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Work page hero
            </h2>
            <HeroFields
              hero={work.hero}
              onChange={(hero) =>
                onPageSectionsChange(
                  workPageSectionsSchema.parse({ ...work, hero }),
                )
              }
            />
          </section>
          <section className="space-y-3 rounded-default border border-border bg-surface p-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Graphic gallery
            </h2>
            <p className="text-sm text-muted">
              Section copy above the Work page gallery slider. Images are
              managed in Work Gallery.
            </p>
            <HeroFields
              hero={work.gallery}
              onChange={(gallery) =>
                onPageSectionsChange(
                  workPageSectionsSchema.parse({ ...work, gallery }),
                )
              }
            />
          </section>
        </>
      ) : null}

      {pageSlug === "contact-us" ? (
        <section className="space-y-4 rounded-default border border-border bg-surface p-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Contact page
          </h2>
          <HeroFields
            hero={contact.hero}
            onChange={(hero) =>
              onPageSectionsChange(
                contactPageSectionsSchema.parse({ ...contact, hero }),
              )
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Sidebar title
              </label>
              <input
                value={contact.sidebarTitle}
                onChange={(e) =>
                  onPageSectionsChange(
                    contactPageSectionsSchema.parse({
                      ...contact,
                      sidebarTitle: e.target.value,
                    }),
                  )
                }
                className={fieldClassName}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Sidebar email
              </label>
              <input
                value={contact.sidebarEmail}
                onChange={(e) =>
                  onPageSectionsChange(
                    contactPageSectionsSchema.parse({
                      ...contact,
                      sidebarEmail: e.target.value,
                    }),
                  )
                }
                className={fieldClassName}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Sidebar body
            </label>
            <textarea
              rows={2}
              value={contact.sidebarBody}
              onChange={(e) =>
                onPageSectionsChange(
                  contactPageSectionsSchema.parse({
                    ...contact,
                    sidebarBody: e.target.value,
                  }),
                )
              }
              className={fieldClassName}
            />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Contact form copy
            </h3>
            {(
              [
                ["formTitle", "Form title"],
                ["formSubtitle", "Form subtitle"],
                ["formNameLabel", "Name label"],
                ["formEmailLabel", "Email label"],
                ["formCompanyLabel", "Company label"],
                ["formPhoneLabel", "Phone label"],
                ["formWebsiteLabel", "Website label"],
                ["formServiceLabel", "Service label"],
                ["formBudgetLabel", "Budget label"],
                ["formMessageLabel", "Message label"],
                ["formMessagePlaceholder", "Message placeholder"],
                ["formSubmitLabel", "Submit label"],
                ["formSuccessTitle", "Success title"],
                ["formSuccessBody", "Success body"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {label}
                </label>
                {key === "formSubtitle" ||
                key === "formMessagePlaceholder" ||
                key === "formSuccessBody" ? (
                  <textarea
                    rows={2}
                    value={contact[key]}
                    onChange={(e) =>
                      onPageSectionsChange(
                        contactPageSectionsSchema.parse({
                          ...contact,
                          [key]: e.target.value,
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                ) : (
                  <input
                    value={contact[key]}
                    onChange={(e) =>
                      onPageSectionsChange(
                        contactPageSectionsSchema.parse({
                          ...contact,
                          [key]: e.target.value,
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                )}
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Service options (comma-separated)
              </label>
              <textarea
                rows={3}
                value={contact.formServiceOptions.join(", ")}
                onChange={(e) =>
                  onPageSectionsChange(
                    contactPageSectionsSchema.parse({
                      ...contact,
                      formServiceOptions: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    }),
                  )
                }
                className={fieldClassName}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Budget options (comma-separated)
              </label>
              <textarea
                rows={2}
                value={contact.formBudgetOptions.join(", ")}
                onChange={(e) =>
                  onPageSectionsChange(
                    contactPageSectionsSchema.parse({
                      ...contact,
                      formBudgetOptions: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    }),
                  )
                }
                className={fieldClassName}
              />
            </div>
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">FAQ section</h3>
            <input
              value={contact.faqEyebrow}
              onChange={(e) =>
                onPageSectionsChange(
                  contactPageSectionsSchema.parse({
                    ...contact,
                    faqEyebrow: e.target.value,
                  }),
                )
              }
              placeholder="FAQ eyebrow"
              className={fieldClassName}
            />
            <input
              value={contact.faqHeadline}
              onChange={(e) =>
                onPageSectionsChange(
                  contactPageSectionsSchema.parse({
                    ...contact,
                    faqHeadline: e.target.value,
                  }),
                )
              }
              placeholder="FAQ headline"
              className={fieldClassName}
            />
            <textarea
              rows={2}
              value={contact.faqDescription}
              onChange={(e) =>
                onPageSectionsChange(
                  contactPageSectionsSchema.parse({
                    ...contact,
                    faqDescription: e.target.value,
                  }),
                )
              }
              placeholder="FAQ description"
              className={fieldClassName}
            />
            {contact.faqs.map((faq, index) => (
              <div
                key={index}
                className="space-y-2 rounded-default border border-border bg-background p-3"
              >
                <input
                  value={faq.question}
                  onChange={(e) => {
                    const faqs = [...contact.faqs];
                    faqs[index] = { ...faqs[index], question: e.target.value };
                    onPageSectionsChange(
                      contactPageSectionsSchema.parse({ ...contact, faqs }),
                    );
                  }}
                  placeholder="Question"
                  className={fieldClassName}
                />
                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => {
                    const faqs = [...contact.faqs];
                    faqs[index] = { ...faqs[index], answer: e.target.value };
                    onPageSectionsChange(
                      contactPageSectionsSchema.parse({ ...contact, faqs }),
                    );
                  }}
                  placeholder="Answer"
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    onPageSectionsChange(
                      contactPageSectionsSchema.parse({
                        ...contact,
                        faqs: contact.faqs.filter((_, i) => i !== index),
                      }),
                    )
                  }
                  className="text-xs text-danger"
                >
                  Remove FAQ
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onPageSectionsChange(
                  contactPageSectionsSchema.parse({
                    ...contact,
                    faqs: [...contact.faqs, { question: "", answer: "" }],
                  }),
                )
              }
              className="text-sm font-medium text-accent"
            >
              Add FAQ
            </button>
          </div>
        </section>
      ) : null}

      {pageSlug === "careers" ? (
        <section className="space-y-4 rounded-default border border-border bg-surface p-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Careers page
          </h2>
          <HeroFields
            hero={careers.hero}
            onChange={(hero) =>
              onPageSectionsChange(
                careersPageSectionsSchema.parse({ ...careers, hero }),
              )
            }
          />
          <input
            value={careers.openingsTitle}
            onChange={(e) =>
              onPageSectionsChange(
                careersPageSectionsSchema.parse({
                  ...careers,
                  openingsTitle: e.target.value,
                }),
              )
            }
            placeholder="Open positions heading"
            className={fieldClassName}
          />
          <input
            value={careers.fallbackTitle}
            onChange={(e) =>
              onPageSectionsChange(
                careersPageSectionsSchema.parse({
                  ...careers,
                  fallbackTitle: e.target.value,
                }),
              )
            }
            placeholder="Fallback block title"
            className={fieldClassName}
          />
          <textarea
            rows={2}
            value={careers.fallbackBody}
            onChange={(e) =>
              onPageSectionsChange(
                careersPageSectionsSchema.parse({
                  ...careers,
                  fallbackBody: e.target.value,
                }),
              )
            }
            placeholder="Fallback block body"
            className={fieldClassName}
          />
          <input
            value={careers.fallbackEmail}
            onChange={(e) =>
              onPageSectionsChange(
                careersPageSectionsSchema.parse({
                  ...careers,
                  fallbackEmail: e.target.value,
                }),
              )
            }
            placeholder="Fallback email"
            className={fieldClassName}
          />
          <input
            value={careers.fallbackButtonLabel}
            onChange={(e) =>
              onPageSectionsChange(
                careersPageSectionsSchema.parse({
                  ...careers,
                  fallbackButtonLabel: e.target.value,
                }),
              )
            }
            placeholder="Fallback button label"
            className={fieldClassName}
          />
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Job apply form labels
            </h3>
            {(
              [
                ["applyNameLabel", "Name label"],
                ["applyNamePlaceholder", "Name placeholder"],
                ["applyEmailLabel", "Email label"],
                ["applyEmailPlaceholder", "Email placeholder"],
                ["applyPhoneLabel", "Phone label"],
                ["applyPhonePlaceholder", "Phone placeholder"],
                ["applyLinkedinLabel", "LinkedIn label"],
                ["applyLinkedinPlaceholder", "LinkedIn placeholder"],
                ["applyCoverLabel", "Cover letter label"],
                ["applyCoverPlaceholder", "Cover letter placeholder"],
                ["applyResumeLabel", "Resume label"],
                ["applySubmitLabel", "Submit label"],
                ["applySuccessTitle", "Success title"],
                ["applySuccessBody", "Success body"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {label}
                </label>
                {key === "applyCoverPlaceholder" ||
                key === "applySuccessBody" ? (
                  <textarea
                    rows={2}
                    value={careers[key]}
                    onChange={(e) =>
                      onPageSectionsChange(
                        careersPageSectionsSchema.parse({
                          ...careers,
                          [key]: e.target.value,
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                ) : (
                  <input
                    value={careers[key]}
                    onChange={(e) =>
                      onPageSectionsChange(
                        careersPageSectionsSchema.parse({
                          ...careers,
                          [key]: e.target.value,
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {pageSlug === "blog" ? (
        <section className="space-y-4 rounded-default border border-border bg-surface p-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Blog hero
          </h2>
          {(
            [
              ["heroEyebrow", "Eyebrow"],
              ["heroHeadline", "Headline"],
              ["heroSubtext", "Subtext"],
              ["searchLabel", "Search label"],
              ["searchPlaceholder", "Search placeholder"],
              ["searchButton", "Search button"],
              ["allCategoryLabel", "All category label"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {label}
              </label>
              <input
                value={blog[key]}
                onChange={(e) =>
                  onPageSectionsChange(
                    blogPageSectionsSchema.parse({
                      ...blog,
                      [key]: e.target.value,
                    }),
                  )
                }
                className={fieldClassName}
              />
            </div>
          ))}
          <h2 className="pt-2 font-display text-lg font-semibold text-foreground">
            Blog newsletter
          </h2>
          {(
            [
              ["newsletterEyebrow", "Eyebrow"],
              ["newsletterHeadline", "Headline"],
              ["newsletterBody", "Body"],
              ["newsletterPerk1", "Perk 1"],
              ["newsletterPerk2", "Perk 2"],
              ["newsletterPerk3", "Perk 3"],
              ["newsletterButton", "Button"],
              ["newsletterSuccess", "Success message"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {label}
              </label>
              <input
                value={blog[key]}
                onChange={(e) =>
                  onPageSectionsChange(
                    blogPageSectionsSchema.parse({
                      ...blog,
                      [key]: e.target.value,
                    }),
                  )
                }
                className={fieldClassName}
              />
            </div>
          ))}
        </section>
      ) : null}

      <MediaPicker
        open={pickerKey !== null}
        onClose={() => setPickerKey(null)}
        onSelect={(url) => {
          if (pickerKey) {
            setDrafts((d) => ({ ...d, [pickerKey]: url }));
          }
          setPickerKey(null);
        }}
      />
    </div>
  );
}
