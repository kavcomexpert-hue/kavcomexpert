"use client";

import { LinkButtonField } from "@/components/admin/link-button-field";
import { MediaPicker } from "@/components/admin/media-picker";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import {
  SERVICE_SECTION_KEYS,
  serviceSectionLabels,
  type ServicePageSections,
  type ServiceSectionKey,
} from "@/lib/services/page-sections";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const fieldClassName =
  "w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent";

type Props = {
  value: ServicePageSections;
  onChange: (next: ServicePageSections) => void;
};

function SectionShell({
  title,
  open,
  onToggle,
  enabled,
  onEnabledChange,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <label className="inline-flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="size-3.5"
          />
          On page
        </label>
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center justify-between text-left text-sm font-semibold text-foreground"
        >
          {title}
          <ChevronDown
            className={`size-4 text-muted transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </button>
      </div>
      {open && enabled ? <div className="space-y-3 p-4">{children}</div> : null}
      {open && !enabled ? (
        <p className="px-4 py-3 text-xs text-muted">
          Section is hidden on the public page. Enable “On page” to edit and show it.
        </p>
      ) : null}
    </div>
  );
}

export function ServiceSectionsEditor({ value, onChange }: Props) {
  const [openKey, setOpenKey] = useState<ServiceSectionKey | null>("hero");
  const [workPickerIndex, setWorkPickerIndex] = useState<number | null>(null);
  const [textImageIndex, setTextImageIndex] = useState<number | null>(null);

  function patch(partial: Partial<ServicePageSections>) {
    onChange({ ...value, ...partial });
  }

  function isEnabled(key: ServiceSectionKey) {
    return value.enabledSections.includes(key);
  }

  function setEnabled(key: ServiceSectionKey, enabled: boolean) {
    const next = enabled
      ? Array.from(new Set([...value.enabledSections, key]))
      : value.enabledSections.filter((item) => item !== key);
    patch({
      enabledSections: SERVICE_SECTION_KEYS.filter((k) => next.includes(k)),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Page sections</h2>
          <p className="mt-0.5 text-xs text-muted">
            Add, edit, or remove each block on the service landing page.
          </p>
        </div>
      </div>

      <SectionShell
        title={serviceSectionLabels.hero}
        open={openKey === "hero"}
        onToggle={() => setOpenKey(openKey === "hero" ? null : "hero")}
        enabled={isEnabled("hero")}
        onEnabledChange={(enabled) => setEnabled("hero", enabled)}
      >
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted">AEO summary</label>
          <textarea
            rows={3}
            value={value.aeoSummary}
            onChange={(e) => patch({ aeoSummary: e.target.value })}
            className={fieldClassName}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted">Intro</label>
          <textarea
            rows={4}
            value={value.intro}
            onChange={(e) => patch({ intro: e.target.value })}
            className={fieldClassName}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted">Intro continued</label>
          <textarea
            rows={3}
            value={value.introContinued}
            onChange={(e) => patch({ introContinued: e.target.value })}
            className={fieldClassName}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted">Platform label</label>
          <input
            value={value.platformLabel}
            onChange={(e) => patch({ platformLabel: e.target.value })}
            className={fieldClassName}
          />
          <p className="text-[11px] text-muted">
            Used in the hero illustration and as the default eyebrow suffix
            (&quot;… development&quot;) when Hero eyebrow is empty.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted">Hero eyebrow</label>
          <input
            value={value.heroEyebrow}
            onChange={(e) => patch({ heroEyebrow: e.target.value })}
            placeholder={`${value.platformLabel || "Platform"} development`}
            className={fieldClassName}
          />
          <p className="text-[11px] text-muted">
            Small label above the H1. Leave blank to use “
            {value.platformLabel || "Platform"} development”.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted">Hero heading</label>
          <input
            value={value.heroHeading}
            onChange={(e) => patch({ heroHeading: e.target.value })}
            placeholder="Leave blank to use the page/service title"
            className={fieldClassName}
          />
          <p className="text-[11px] text-muted">
            Public H1. Leave blank to fall back to the page title (or service
            name).
          </p>
        </div>
        <div className="rounded-default border border-border p-3">
          <LinkButtonField
            label="Hero primary CTA"
            value={value.heroCtaPrimary}
            onChange={(heroCtaPrimary) => patch({ heroCtaPrimary })}
          />
        </div>
        <div className="rounded-default border border-border p-3">
          <LinkButtonField
            label="Hero secondary CTA"
            value={value.heroCtaSecondary}
            onChange={(heroCtaSecondary) => patch({ heroCtaSecondary })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted">
            Spline scene URL
          </label>
          <input
            value={value.heroSplineScene}
            onChange={(e) => patch({ heroSplineScene: e.target.value })}
            placeholder="/spline/cloud-storage-isometric.spline"
            className={fieldClassName}
          />
          <p className="text-[11px] text-muted">
            Optional. When set (and hero visual is Animation), the hero uses this
            Spline scene instead of the coded illustration. Leave blank for the
            default animation.
          </p>
        </div>
      </SectionShell>

      <SectionShell
        title={serviceSectionLabels.tags}
        open={openKey === "tags"}
        onToggle={() => setOpenKey(openKey === "tags" ? null : "tags")}
        enabled={isEnabled("tags")}
        onEnabledChange={(enabled) => setEnabled("tags", enabled)}
      >
        {value.tags.map((tag, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={tag}
              onChange={(e) =>
                patch({
                  tags: value.tags.map((item, i) =>
                    i === index ? e.target.value : item,
                  ),
                })
              }
              className={fieldClassName}
            />
            <button
              type="button"
              onClick={() =>
                patch({ tags: value.tags.filter((_, i) => i !== index) })
              }
              className="inline-flex size-9 shrink-0 items-center justify-center border border-border text-danger"
              aria-label="Remove tag"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => patch({ tags: [...value.tags, ""] })}
          className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
        >
          <Plus className="size-3.5" /> Add tag
        </button>
      </SectionShell>

      <SectionShell
        title={serviceSectionLabels.features}
        open={openKey === "features"}
        onToggle={() => setOpenKey(openKey === "features" ? null : "features")}
        enabled={isEnabled("features")}
        onEnabledChange={(enabled) => setEnabled("features", enabled)}
      >
        <input
          placeholder="Eyebrow"
          value={value.featuresEyebrow}
          onChange={(e) => patch({ featuresEyebrow: e.target.value })}
          className={fieldClassName}
        />
        <input
          placeholder="Headline"
          value={value.featuresHeadline}
          onChange={(e) => patch({ featuresHeadline: e.target.value })}
          className={fieldClassName}
        />
        <textarea
          placeholder="Intro"
          rows={2}
          value={value.featuresIntro}
          onChange={(e) => patch({ featuresIntro: e.target.value })}
          className={fieldClassName}
        />
        {value.features.map((feature, index) => (
          <div key={index} className="flex gap-2">
            <textarea
              rows={2}
              value={feature}
              onChange={(e) =>
                patch({
                  features: value.features.map((item, i) =>
                    i === index ? e.target.value : item,
                  ),
                })
              }
              className={fieldClassName}
            />
            <button
              type="button"
              onClick={() =>
                patch({
                  features: value.features.filter((_, i) => i !== index),
                })
              }
              className="inline-flex size-9 shrink-0 items-center justify-center border border-border text-danger"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => patch({ features: [...value.features, ""] })}
          className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
        >
          <Plus className="size-3.5" /> Add feature
        </button>
      </SectionShell>

      <SectionShell
        title={serviceSectionLabels.offerings}
        open={openKey === "offerings"}
        onToggle={() => setOpenKey(openKey === "offerings" ? null : "offerings")}
        enabled={isEnabled("offerings")}
        onEnabledChange={(enabled) => setEnabled("offerings", enabled)}
      >
        <input
          placeholder="Eyebrow"
          value={value.offeringsEyebrow}
          onChange={(e) => patch({ offeringsEyebrow: e.target.value })}
          className={fieldClassName}
        />
        <input
          placeholder="Headline"
          value={value.offeringsHeadline}
          onChange={(e) => patch({ offeringsHeadline: e.target.value })}
          className={fieldClassName}
        />
        {value.offerings.map((item, index) => (
          <div key={index} className="space-y-2 border border-border p-3">
            <input
              placeholder="Title"
              value={item.title}
              onChange={(e) =>
                patch({
                  offerings: value.offerings.map((row, i) =>
                    i === index ? { ...row, title: e.target.value } : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <textarea
              placeholder="Description"
              rows={3}
              value={item.description}
              onChange={(e) =>
                patch({
                  offerings: value.offerings.map((row, i) =>
                    i === index ? { ...row, description: e.target.value } : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <input
              placeholder="Optional link href"
              value={item.href ?? ""}
              onChange={(e) =>
                patch({
                  offerings: value.offerings.map((row, i) =>
                    i === index
                      ? { ...row, href: e.target.value || undefined }
                      : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <button
              type="button"
              onClick={() =>
                patch({
                  offerings: value.offerings.filter((_, i) => i !== index),
                })
              }
              className="text-xs text-danger"
            >
              Remove offering
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patch({
              offerings: [
                ...value.offerings,
                { title: "", description: "" },
              ],
            })
          }
          className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
        >
          <Plus className="size-3.5" /> Add offering
        </button>
      </SectionShell>

      <SectionShell
        title={serviceSectionLabels.why}
        open={openKey === "why"}
        onToggle={() => setOpenKey(openKey === "why" ? null : "why")}
        enabled={isEnabled("why")}
        onEnabledChange={(enabled) => setEnabled("why", enabled)}
      >
        <input
          placeholder="Eyebrow"
          value={value.whyEyebrow}
          onChange={(e) => patch({ whyEyebrow: e.target.value })}
          className={fieldClassName}
        />
        <input
          placeholder="Headline"
          value={value.whyHeadline}
          onChange={(e) => patch({ whyHeadline: e.target.value })}
          className={fieldClassName}
        />
        <textarea
          placeholder="Intro"
          rows={2}
          value={value.whyIntro}
          onChange={(e) => patch({ whyIntro: e.target.value })}
          className={fieldClassName}
        />
        {value.whyReasons.map((item, index) => (
          <div key={index} className="space-y-2 border border-border p-3">
            <input
              placeholder="Title"
              value={item.title}
              onChange={(e) =>
                patch({
                  whyReasons: value.whyReasons.map((row, i) =>
                    i === index ? { ...row, title: e.target.value } : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <textarea
              placeholder="Body"
              rows={3}
              value={item.body}
              onChange={(e) =>
                patch({
                  whyReasons: value.whyReasons.map((row, i) =>
                    i === index ? { ...row, body: e.target.value } : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <button
              type="button"
              onClick={() =>
                patch({
                  whyReasons: value.whyReasons.filter((_, i) => i !== index),
                })
              }
              className="text-xs text-danger"
            >
              Remove reason
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patch({
              whyReasons: [...value.whyReasons, { title: "", body: "" }],
            })
          }
          className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
        >
          <Plus className="size-3.5" /> Add reason
        </button>
        <div className="rounded-default border border-border p-3">
          <LinkButtonField
            label="Why section CTA"
            value={value.whyCta}
            onChange={(whyCta) => patch({ whyCta })}
          />
        </div>
      </SectionShell>

      <SectionShell
        title={serviceSectionLabels.process}
        open={openKey === "process"}
        onToggle={() => setOpenKey(openKey === "process" ? null : "process")}
        enabled={isEnabled("process")}
        onEnabledChange={(enabled) => setEnabled("process", enabled)}
      >
        <input
          placeholder="Eyebrow"
          value={value.processEyebrow}
          onChange={(e) => patch({ processEyebrow: e.target.value })}
          className={fieldClassName}
        />
        <input
          placeholder="Headline"
          value={value.processHeadline}
          onChange={(e) => patch({ processHeadline: e.target.value })}
          className={fieldClassName}
        />
        {value.processSteps.map((step, index) => (
          <div key={index} className="space-y-2 border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-[6rem_1fr]">
              <input
                placeholder="01"
                value={step.number}
                onChange={(e) =>
                  patch({
                    processSteps: value.processSteps.map((row, i) =>
                      i === index ? { ...row, number: e.target.value } : row,
                    ),
                  })
                }
                className={fieldClassName}
              />
              <input
                placeholder="Step name"
                value={step.name}
                onChange={(e) =>
                  patch({
                    processSteps: value.processSteps.map((row, i) =>
                      i === index ? { ...row, name: e.target.value } : row,
                    ),
                  })
                }
                className={fieldClassName}
              />
            </div>
            <textarea
              placeholder="Description"
              rows={3}
              value={step.description}
              onChange={(e) =>
                patch({
                  processSteps: value.processSteps.map((row, i) =>
                    i === index
                      ? { ...row, description: e.target.value }
                      : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <button
              type="button"
              onClick={() =>
                patch({
                  processSteps: value.processSteps.filter((_, i) => i !== index),
                })
              }
              className="text-xs text-danger"
            >
              Remove step
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const nextNum = String(value.processSteps.length + 1).padStart(
              2,
              "0",
            );
            patch({
              processSteps: [
                ...value.processSteps,
                { number: nextNum, name: "", description: "" },
              ],
            });
          }}
          className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
        >
          <Plus className="size-3.5" /> Add step
        </button>
      </SectionShell>

      <SectionShell
        title={serviceSectionLabels.work}
        open={openKey === "work"}
        onToggle={() => setOpenKey(openKey === "work" ? null : "work")}
        enabled={isEnabled("work")}
        onEnabledChange={(enabled) => setEnabled("work", enabled)}
      >
        <input
          placeholder="Eyebrow"
          value={value.workEyebrow}
          onChange={(e) => patch({ workEyebrow: e.target.value })}
          className={fieldClassName}
        />
        <input
          placeholder="Headline"
          value={value.workHeadline}
          onChange={(e) => patch({ workHeadline: e.target.value })}
          className={fieldClassName}
        />
        {value.workItems.map((item, index) => (
          <div key={index} className="space-y-2 border border-border p-3">
            {(
              [
                ["clientName", "Client name"],
                ["industry", "Industry"],
                ["website", "Website label"],
                ["websiteUrl", "Website URL"],
                ["videoUrl", "Video URL (optional — takes priority in preview)"],
              ] as const
            ).map(([key, label]) => (
              <input
                key={key}
                placeholder={label}
                value={item[key] ?? ""}
                onChange={(e) =>
                  patch({
                    workItems: value.workItems.map((row, i) =>
                      i === index ? { ...row, [key]: e.target.value } : row,
                    ),
                  })
                }
                className={fieldClassName}
              />
            ))}

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                Images (multiple — drag to reorder)
              </p>
              {item.images.length === 0 ? (
                <p className="text-xs text-muted">No images yet.</p>
              ) : (
                <ul className="space-y-2">
                  {item.images.map((url, imageIndex) => (
                    <li
                      key={`${url}-${imageIndex}`}
                      className="flex items-center gap-2 border border-border bg-background p-2"
                    >
                      <button
                        type="button"
                        aria-label="Move image up"
                        disabled={imageIndex === 0}
                        onClick={() => {
                          if (imageIndex === 0) return;
                          const next = [...item.images];
                          const [moved] = next.splice(imageIndex, 1);
                          next.splice(imageIndex - 1, 0, moved);
                          patch({
                            workItems: value.workItems.map((row, i) =>
                              i === index ? { ...row, images: next } : row,
                            ),
                          });
                        }}
                        className="inline-flex size-8 items-center justify-center border border-border text-muted disabled:opacity-40"
                      >
                        <GripVertical className="size-3.5" />
                      </button>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="size-12 object-cover"
                      />
                      <p className="min-w-0 flex-1 truncate font-mono text-[0.65rem] text-muted">
                        {url}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          patch({
                            workItems: value.workItems.map((row, i) =>
                              i === index
                                ? {
                                    ...row,
                                    images: row.images.filter(
                                      (_, j) => j !== imageIndex,
                                    ),
                                  }
                                : row,
                            ),
                          })
                        }
                        className="text-xs text-danger"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setWorkPickerIndex(index)}
                className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
              >
                <Plus className="size-3.5" /> Add images from library
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                patch({
                  workItems: value.workItems.filter((_, i) => i !== index),
                })
              }
              className="text-xs text-danger"
            >
              Remove work item
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patch({
              workItems: [
                ...value.workItems,
                {
                  clientName: "",
                  industry: "",
                  website: "",
                  websiteUrl: "",
                  images: [],
                  videoUrl: undefined,
                },
              ],
            })
          }
          className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
        >
          <Plus className="size-3.5" /> Add work item
        </button>
      </SectionShell>

      <SectionShell
        title={serviceSectionLabels.text}
        open={openKey === "text"}
        onToggle={() => setOpenKey(openKey === "text" ? null : "text")}
        enabled={isEnabled("text")}
        onEnabledChange={(enabled) => setEnabled("text", enabled)}
      >
        <p className="text-xs text-muted">
          Add one or more text blocks. Empty blocks are hidden on the public
          page. Only filled fields (heading, subheading, body) render.
        </p>
        {value.textBlocks.map((block, index) => (
          <div key={index} className="space-y-2 border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-foreground">
                Text block {index + 1}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...value.textBlocks];
                    const [moved] = next.splice(index, 1);
                    next.splice(index - 1, 0, moved);
                    patch({ textBlocks: next });
                  }}
                  className="text-xs text-muted disabled:opacity-40"
                >
                  Move up
                </button>
                <button
                  type="button"
                  disabled={index === value.textBlocks.length - 1}
                  onClick={() => {
                    if (index >= value.textBlocks.length - 1) return;
                    const next = [...value.textBlocks];
                    const [moved] = next.splice(index, 1);
                    next.splice(index + 1, 0, moved);
                    patch({ textBlocks: next });
                  }}
                  className="text-xs text-muted disabled:opacity-40"
                >
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      textBlocks: value.textBlocks.filter((_, i) => i !== index),
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs text-danger"
                >
                  <Trash2 className="size-3" /> Remove
                </button>
              </div>
            </div>
            <input
              placeholder="Heading (optional)"
              value={block.heading}
              onChange={(e) =>
                patch({
                  textBlocks: value.textBlocks.map((row, i) =>
                    i === index ? { ...row, heading: e.target.value } : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <input
              placeholder="Subheading (optional)"
              value={block.subheading}
              onChange={(e) =>
                patch({
                  textBlocks: value.textBlocks.map((row, i) =>
                    i === index ? { ...row, subheading: e.target.value } : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <TiptapEditor
              content={block.body ?? { type: "doc", content: [] }}
              onChange={(content: unknown) =>
                patch({
                  textBlocks: value.textBlocks.map((row, i) =>
                    i === index ? { ...row, body: content } : row,
                  ),
                })
              }
              onPickImage={() => setTextImageIndex(index)}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patch({
              textBlocks: [
                ...value.textBlocks,
                { heading: "", subheading: "", body: { type: "doc", content: [] } },
              ],
            })
          }
          className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
        >
          <Plus className="size-3.5" /> Add text block
        </button>
      </SectionShell>

      <SectionShell
        title={serviceSectionLabels.faqs}
        open={openKey === "faqs"}
        onToggle={() => setOpenKey(openKey === "faqs" ? null : "faqs")}
        enabled={isEnabled("faqs")}
        onEnabledChange={(enabled) => setEnabled("faqs", enabled)}
      >
        <input
          placeholder="Eyebrow"
          value={value.faqsEyebrow}
          onChange={(e) => patch({ faqsEyebrow: e.target.value })}
          className={fieldClassName}
        />
        <input
          placeholder="Headline"
          value={value.faqsHeadline}
          onChange={(e) => patch({ faqsHeadline: e.target.value })}
          className={fieldClassName}
        />
        <div className="rounded-default border border-border p-3">
          <LinkButtonField
            label="FAQ contact CTA"
            value={value.faqsCta}
            onChange={(faqsCta) => patch({ faqsCta })}
          />
        </div>
        {value.faqs.map((faq, index) => (
          <div key={index} className="space-y-2 border border-border p-3">
            <input
              placeholder="Question"
              value={faq.question}
              onChange={(e) =>
                patch({
                  faqs: value.faqs.map((row, i) =>
                    i === index ? { ...row, question: e.target.value } : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <textarea
              placeholder="Answer"
              rows={3}
              value={faq.answer}
              onChange={(e) =>
                patch({
                  faqs: value.faqs.map((row, i) =>
                    i === index ? { ...row, answer: e.target.value } : row,
                  ),
                })
              }
              className={fieldClassName}
            />
            <button
              type="button"
              onClick={() =>
                patch({ faqs: value.faqs.filter((_, i) => i !== index) })
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
            patch({
              faqs: [...value.faqs, { question: "", answer: "" }],
            })
          }
          className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent"
        >
          <Plus className="size-3.5" /> Add FAQ
        </button>
      </SectionShell>

      <div className="border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-3 py-2">
          <label className="inline-flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={value.showBottomCta}
              onChange={(e) => patch({ showBottomCta: e.target.checked })}
              className="size-3.5"
            />
            On page
          </label>
          <span className="text-sm font-semibold text-foreground">
            Bottom CTA
          </span>
        </div>
        {value.showBottomCta ? (
          <div className="space-y-3 p-4">
            <p className="text-[11px] text-muted">
              Leave fields empty to use the site-wide Home CTA defaults.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted">Eyebrow</label>
              <input
                value={value.bottomCtaEyebrow}
                onChange={(e) => patch({ bottomCtaEyebrow: e.target.value })}
                placeholder="Currently accepting new projects"
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted">Headline</label>
              <textarea
                rows={2}
                value={value.bottomCtaHeadline}
                onChange={(e) => patch({ bottomCtaHeadline: e.target.value })}
                placeholder={"Have an idea?\nLet's build it together."}
                className={fieldClassName}
              />
              <p className="text-[11px] text-muted">
                Use a line break for a two-line headline.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted">Email</label>
              <input
                value={value.bottomCtaEmail}
                onChange={(e) => patch({ bottomCtaEmail: e.target.value })}
                placeholder="info@kavcomexpert.com"
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted">Watermark</label>
              <input
                value={value.bottomCtaWatermark}
                onChange={(e) => patch({ bottomCtaWatermark: e.target.value })}
                placeholder="Let's talk"
                className={fieldClassName}
              />
            </div>
            <div className="rounded-default border border-border p-3">
              <LinkButtonField
                label="CTA button (empty label = site default)"
                value={value.bottomCtaButton}
                onChange={(bottomCtaButton) => patch({ bottomCtaButton })}
              />
            </div>
          </div>
        ) : (
          <p className="px-4 py-3 text-xs text-muted">
            Bottom CTA is hidden on the public page.
          </p>
        )}
      </div>

      <MediaPicker
        open={workPickerIndex !== null}
        onClose={() => setWorkPickerIndex(null)}
        mode="multi"
        selectedUrls={
          workPickerIndex !== null
            ? (value.workItems[workPickerIndex]?.images ?? [])
            : []
        }
        onSelectMany={(items) => {
          if (workPickerIndex === null) return;
          const images = items.map((item) => item.url);
          patch({
            workItems: value.workItems.map((row, i) =>
              i === workPickerIndex ? { ...row, images } : row,
            ),
          });
          setWorkPickerIndex(null);
        }}
      />

      <MediaPicker
        open={textImageIndex !== null}
        onClose={() => setTextImageIndex(null)}
        mode="single"
        onSelect={(url) => {
          // TipTap image insert is handled via editor ref in other editors;
          // for text blocks, append an image paragraph into body content.
          if (textImageIndex === null) return;
          const block = value.textBlocks[textImageIndex];
          const existing =
            block?.body && typeof block.body === "object"
              ? (block.body as { type?: string; content?: unknown[] })
              : { type: "doc", content: [] };
          const content = Array.isArray(existing.content)
            ? [...existing.content]
            : [];
          content.push({
            type: "paragraph",
            content: [
              {
                type: "image",
                attrs: { src: url, alt: "" },
              },
            ],
          });
          patch({
            textBlocks: value.textBlocks.map((row, i) =>
              i === textImageIndex
                ? { ...row, body: { type: "doc", content } }
                : row,
            ),
          });
          setTextImageIndex(null);
        }}
      />
    </div>
  );
}
