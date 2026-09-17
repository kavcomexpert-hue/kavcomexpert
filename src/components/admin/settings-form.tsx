"use client";

import { GlobalContentBlocksEditor } from "@/components/admin/global-content-blocks-editor";
import { ChatbotFlowEditor } from "@/components/admin/chatbot-flow-editor";
import { saveSiteSettings } from "@/actions/settings";
import { MediaPicker } from "@/components/admin/media-picker";
import { useToast } from "@/components/ui/toast";
import { DEFAULT_CONSENT } from "@/lib/consent/defaults";
import type { ContentBlockValue } from "@/lib/db/schema";
import type { MenuLinkOption } from "@/lib/queries/menus";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SocialLink = { label: string; url: string };

export type SettingsFormData = {
  id?: string;
  organizationName: string;
  tagline: string;
  contactEmail: string;
  defaultOgImage: string;
  logoUrl: string;
  socialLinks: SocialLink[];
  announcementText: string;
  announcementEnabled: boolean;
  ga4Id: string;
  clarityId: string;
  indexNowKey: string;
  sitemapExcludedPaths: string[];
  consentEnabled: boolean;
  consentBannerText: string;
  consentAcceptLabel: string;
  consentDeclineLabel: string;
  consentPolicyLinkLabel: string;
  consentPolicyLinkHref: string;
  consentPosition: "bottom-bar" | "bottom-left";
  consentReshowAfterDays: number;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceBody: string;
  defaultTheme: "light" | "dark" | "system";
};

type TabId =
  | "general"
  | "branding"
  | "announcement"
  | "integrations"
  | "consent"
  | "sitemap"
  | "global"
  | "tools";

type ContentBlockRow = {
  key: string;
  label: string;
  type: string;
  value: ContentBlockValue;
};

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const tabs: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "announcement", label: "Announcement" },
  { id: "integrations", label: "Integrations" },
  { id: "consent", label: "Consent" },
  { id: "sitemap", label: "Sitemap" },
  { id: "global", label: "Global content" },
  { id: "tools", label: "Tools" },
];

export function SettingsForm({
  initialData,
  contentBlocks = [],
  linkOptions = [],
}: {
  initialData: SettingsFormData;
  contentBlocks?: ContentBlockRow[];
  linkOptions?: MenuLinkOption[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("general");
  const [recordId, setRecordId] = useState(initialData.id);
  const [organizationName, setOrganizationName] = useState(
    initialData.organizationName,
  );
  const [tagline, setTagline] = useState(initialData.tagline);
  const [contactEmail, setContactEmail] = useState(initialData.contactEmail);
  const [defaultOgImage, setDefaultOgImage] = useState(
    initialData.defaultOgImage,
  );
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    initialData.socialLinks,
  );
  const [announcementText, setAnnouncementText] = useState(
    initialData.announcementText,
  );
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    initialData.announcementEnabled,
  );
  const [ga4Id, setGa4Id] = useState(initialData.ga4Id);
  const [clarityId, setClarityId] = useState(initialData.clarityId);
  const [indexNowKey, setIndexNowKey] = useState(initialData.indexNowKey);
  const [sitemapExcludedPaths, setSitemapExcludedPaths] = useState<string[]>(
    initialData.sitemapExcludedPaths,
  );
  const [newExcludedPath, setNewExcludedPath] = useState("");
  const [consentEnabled, setConsentEnabled] = useState(
    initialData.consentEnabled,
  );
  const [consentBannerText, setConsentBannerText] = useState(
    initialData.consentBannerText,
  );
  const [consentAcceptLabel, setConsentAcceptLabel] = useState(
    initialData.consentAcceptLabel,
  );
  const [consentDeclineLabel, setConsentDeclineLabel] = useState(
    initialData.consentDeclineLabel,
  );
  const [consentPolicyLinkLabel, setConsentPolicyLinkLabel] = useState(
    initialData.consentPolicyLinkLabel,
  );
  const [consentPolicyLinkHref, setConsentPolicyLinkHref] = useState(
    initialData.consentPolicyLinkHref,
  );
  const [consentPosition, setConsentPosition] = useState(
    initialData.consentPosition,
  );
  const [consentReshowAfterDays, setConsentReshowAfterDays] = useState(
    String(initialData.consentReshowAfterDays),
  );
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialData.maintenanceMode,
  );
  const [maintenanceTitle, setMaintenanceTitle] = useState(
    initialData.maintenanceTitle,
  );
  const [maintenanceBody, setMaintenanceBody] = useState(
    initialData.maintenanceBody,
  );
  const [defaultTheme, setDefaultTheme] = useState(initialData.defaultTheme);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"og" | "logo" | null>(null);

  const chatbotFlowJson = (() => {
    const row = contentBlocks.find((b) => b.key === "global.chatbot.flow_json");
    const value = row?.value;
    if (value && typeof value === "object" && "text" in value) {
      return typeof value.text === "string" ? value.text : "";
    }
    return "";
  })();

  async function handleSave() {
    setSaving(true);
    const days = Number.parseInt(consentReshowAfterDays, 10);
    const result = await saveSiteSettings({
      id: recordId,
      organizationName,
      tagline,
      contactEmail,
      defaultOgImage,
      logoUrl,
      socialLinks: socialLinks.filter(
        (link) => link.label.trim() && link.url.trim(),
      ),
      announcementText,
      announcementEnabled,
      ga4Id,
      clarityId,
      indexNowKey,
      sitemapExcludedPaths,
      consentEnabled,
      consentBannerText,
      consentAcceptLabel,
      consentDeclineLabel,
      consentPolicyLinkLabel,
      consentPolicyLinkHref,
      consentPosition,
      consentReshowAfterDays:
        Number.isFinite(days) && days > 0 ? days : DEFAULT_CONSENT.reshowAfterDays,
      maintenanceMode,
      maintenanceTitle,
      maintenanceBody,
      defaultTheme,
    });
    setSaving(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setRecordId(result.id);
    toast("Settings saved");
    router.refresh();
  }

  function addExcludedPath() {
    const path = newExcludedPath.trim();
    if (!path) return;
    if (sitemapExcludedPaths.includes(path)) {
      toast("Path already excluded", "error");
      return;
    }
    setSitemapExcludedPaths((paths) => [...paths, path]);
    setNewExcludedPath("");
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch("/api/admin/export");
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast(body?.error ?? "Export failed", "error");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ??
        `kavcom-content-export-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast("Export downloaded");
    } catch {
      toast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  const previewShell =
    consentPosition === "bottom-left"
      ? "relative mt-4 w-full max-w-sm rounded-default border border-border bg-surface p-4 shadow-soft"
      : "relative mt-4 w-full rounded-default border border-border bg-surface p-4 shadow-soft";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Site settings
        </h1>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 rounded-default border border-border bg-background p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-accent text-surface"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-5 rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-glow">
        {tab === "general" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Organization name
              </label>
              <input
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tagline
              </label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Contact email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="default-theme"
                className="text-sm font-medium text-foreground"
              >
                Default site theme
              </label>
              <select
                id="default-theme"
                value={defaultTheme}
                onChange={(e) =>
                  setDefaultTheme(
                    e.target.value === "light"
                      ? "light"
                      : e.target.value === "system"
                        ? "system"
                        : "dark",
                  )
                }
                className={`${fieldClassName} h-10`}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">Match visitor&apos;s system</option>
              </select>
              <p className="text-xs text-muted">
                Theme first-time visitors see on the public site. Visitors who
                already used the theme toggle keep their own choice. Your own
                admin theme is controlled by the toggle in the sidebar.
              </p>
            </div>
          </>
        ) : null}

        {tab === "branding" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Brand logo
              </label>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-16 w-40 items-center justify-center rounded-default border border-border bg-logo-surface px-3">
                  <Image
                    src={logoUrl.trim() || "/logo.png"}
                    alt="Brand logo preview"
                    width={140}
                    height={40}
                    className="h-8 w-auto max-w-[140px] object-contain"
                    unoptimized
                  />
                </div>
                <div className="min-w-[240px] flex-1 space-y-2">
                  <input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="/logo.png"
                    className={fieldClassName}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerTarget("logo")}
                      className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
                    >
                      Choose from library
                    </button>
                    {logoUrl.trim() ? (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
                      >
                        Use default
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted">
                Used in the site header and footer. Leave blank to keep the
                default <code className="text-foreground">/logo.png</code>.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Default OG image
              </label>
              <input
                value={defaultOgImage}
                onChange={(e) => setDefaultOgImage(e.target.value)}
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={() => setPickerTarget("og")}
                className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
              >
                Choose from library
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Social links
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSocialLinks((links) => [...links, { label: "", url: "" }])
                  }
                  className="text-sm font-medium text-accent"
                >
                  Add link
                </button>
              </div>
              {socialLinks.map((link, index) => (
                <div
                  key={index}
                  className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) =>
                      setSocialLinks((rows) =>
                        rows.map((item, i) =>
                          i === index
                            ? { ...item, label: e.target.value }
                            : item,
                        ),
                      )
                    }
                    className={fieldClassName}
                  />
                  <input
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) =>
                      setSocialLinks((rows) =>
                        rows.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item,
                        ),
                      )
                    }
                    className={fieldClassName}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSocialLinks((rows) =>
                        rows.filter((_, i) => i !== index),
                      )
                    }
                    className="h-10 rounded-default border border-border px-3 text-sm text-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {tab === "announcement" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Announcement text
              </label>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={3}
                className={fieldClassName}
              />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
              <span className="text-sm font-medium text-foreground">
                Announcement enabled
              </span>
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="size-4 rounded border-border text-accent focus:ring-accent"
              />
            </label>
          </>
        ) : null}

        {tab === "integrations" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                GA4 measurement ID
              </label>
              <input
                value={ga4Id}
                onChange={(e) => setGa4Id(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Microsoft Clarity ID
              </label>
              <input
                value={clarityId}
                onChange={(e) => setClarityId(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                IndexNow key
              </label>
              <input
                value={indexNowKey}
                onChange={(e) => setIndexNowKey(e.target.value)}
                className={fieldClassName}
              />
            </div>
          </>
        ) : null}

        {tab === "consent" ? (
          <>
            <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
              <span className="text-sm font-medium text-foreground">
                Consent banner enabled
              </span>
              <input
                type="checkbox"
                checked={consentEnabled}
                onChange={(e) => setConsentEnabled(e.target.checked)}
                className="size-4 rounded border-border text-accent focus:ring-accent"
              />
            </label>
            <p className="rounded-default border border-border bg-background px-3 py-3 text-sm text-muted">
              When consent is off, the banner is hidden. Analytics (GA4 / Clarity)
              still load for every visitor either way.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Banner text
              </label>
              <textarea
                value={consentBannerText}
                onChange={(e) => setConsentBannerText(e.target.value)}
                rows={2}
                className={fieldClassName}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Accept label
                </label>
                <input
                  value={consentAcceptLabel}
                  onChange={(e) => setConsentAcceptLabel(e.target.value)}
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Decline label
                </label>
                <input
                  value={consentDeclineLabel}
                  onChange={(e) => setConsentDeclineLabel(e.target.value)}
                  className={fieldClassName}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Policy link label
                </label>
                <input
                  value={consentPolicyLinkLabel}
                  onChange={(e) => setConsentPolicyLinkLabel(e.target.value)}
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Policy link href
                </label>
                <input
                  value={consentPolicyLinkHref}
                  onChange={(e) => setConsentPolicyLinkHref(e.target.value)}
                  className={fieldClassName}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Position
                </label>
                <select
                  value={consentPosition}
                  onChange={(e) =>
                    setConsentPosition(
                      e.target.value === "bottom-left"
                        ? "bottom-left"
                        : "bottom-bar",
                    )
                  }
                  className={`${fieldClassName} h-10`}
                >
                  <option value="bottom-bar">Bottom bar</option>
                  <option value="bottom-left">Bottom-left card</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Reshow after (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={consentReshowAfterDays}
                  onChange={(e) => setConsentReshowAfterDays(e.target.value)}
                  className={fieldClassName}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Live preview</p>
              {!consentEnabled ? (
                <p className="mt-2 text-sm text-muted">
                  Banner disabled. Analytics still load for every visitor.
                </p>
              ) : (
                <div className={previewShell} aria-hidden="true">
                  <p className="text-sm text-muted">
                    {consentBannerText || DEFAULT_CONSENT.bannerText}
                  </p>
                  {consentPolicyLinkHref ? (
                    <p className="mt-1 text-xs font-medium text-accent">
                      {consentPolicyLinkLabel || DEFAULT_CONSENT.policyLinkLabel}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-9 items-center rounded-default border border-border bg-background px-4 text-sm">
                      {consentDeclineLabel || DEFAULT_CONSENT.declineLabel}
                    </span>
                    <span className="inline-flex h-9 items-center rounded-default bg-accent px-4 text-sm text-surface">
                      {consentAcceptLabel || DEFAULT_CONSENT.acceptLabel}
                    </span>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-muted">
                Footer Cookie preferences still reopens this banner when enabled.{" "}
                <Link href="/privacy-policy" className="text-accent underline-offset-2 hover:underline">
                  Open privacy page
                </Link>
              </p>
            </div>
          </>
        ) : null}

        {tab === "sitemap" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Paths listed here are omitted from the XML sitemap.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newExcludedPath}
                onChange={(e) => setNewExcludedPath(e.target.value)}
                placeholder="/path-to-exclude"
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={addExcludedPath}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
              >
                Add path
              </button>
            </div>
            <ul className="space-y-2">
              {sitemapExcludedPaths.length === 0 ? (
                <li className="text-sm text-muted">No excluded paths.</li>
              ) : (
                sitemapExcludedPaths.map((path) => (
                  <li
                    key={path}
                    className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-2"
                  >
                    <span className="font-mono text-sm text-foreground">
                      {path}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSitemapExcludedPaths((paths) =>
                          paths.filter((item) => item !== path),
                        )
                      }
                      className="text-sm text-danger"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}

        {tab === "global" ? (
          <GlobalContentBlocksEditor contentBlocks={contentBlocks} />
        ) : null}

        {tab === "tools" ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Maintenance mode
              </h2>
              <p className="text-sm text-muted">
                When on, public visitors see a branded &ldquo;We&apos;ll be right
                back&rdquo; page (HTTP 503). Admin and editor sessions still see
                the live site; /admin stays available.
              </p>
              <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
                <span className="text-sm font-medium text-foreground">
                  Enable maintenance mode
                </span>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="size-4 rounded border-border text-accent focus:ring-accent"
                />
              </label>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Maintenance title
                </label>
                <input
                  value={maintenanceTitle}
                  onChange={(e) => setMaintenanceTitle(e.target.value)}
                  placeholder="We'll be right back"
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Maintenance body
                </label>
                <textarea
                  value={maintenanceBody}
                  onChange={(e) => setMaintenanceBody(e.target.value)}
                  rows={3}
                  placeholder="We're doing a little maintenance. Please check again shortly — thanks for your patience."
                  className={fieldClassName}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Chatbot
              </h2>
              <p className="text-sm text-muted">
                Edit conversation nodes and choices. Clear the CMS override to
                fall back to the built-in flow. Raw JSON is still available for
                advanced edits.
              </p>
              <ChatbotFlowEditor
                initialJson={chatbotFlowJson}
                linkOptions={linkOptions}
              />
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Content export
              </h2>
              <p className="text-sm text-muted">
                Download a timestamped JSON file of all CMS content tables
                (posts, pages, services, case studies, testimonials, media
                metadata, menus, settings, redirects, form leads, and related
                rows). Admin only.
              </p>
              <button
                type="button"
                disabled={exporting}
                onClick={() => void handleExport()}
                className="inline-flex h-11 items-center justify-center rounded-default border border-border bg-background px-5 text-sm font-medium text-foreground disabled:opacity-60"
              >
                {exporting ? "Exporting…" : "Export all content"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <MediaPicker
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(url) => {
          if (pickerTarget === "logo") setLogoUrl(url);
          else if (pickerTarget === "og") setDefaultOgImage(url);
          setPickerTarget(null);
        }}
      />
    </div>
  );
}
