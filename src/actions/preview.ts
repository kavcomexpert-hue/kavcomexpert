"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { actionErrorMessage } from "@/lib/admin/action-error";
import { canEditEntity, canAccessOwnedContent } from "@/lib/authz";
import {
  getCaseStudyByIdForPreview,
  getJobByIdForPreview,
  getPageByIdForPreview,
  getPostByIdForPreview,
  getServiceByIdForPreview,
  getServiceParentSlug,
} from "@/lib/preview/content";
import {
  createPreviewToken,
  type PreviewEntityType,
} from "@/lib/preview/token";
import { absoluteUrl } from "@/lib/seo/constants";
import { draftMode } from "next/headers";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["post", "page", "case_study", "service", "job"]),
  id: z.string().uuid(),
});

type PreviewLinkResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function createPreviewLink(
  input: z.input<typeof createSchema>,
): Promise<PreviewLinkResult> {
  try {
    const { session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const parsed = createSchema.parse(input);

    let slug: string | null = null;
    let authorId: string | null = null;
    let parentSlug: string | null = null;

    if (parsed.type === "post") {
      const row = await getPostByIdForPreview(parsed.id);
      if (!row) return { success: false, error: "Post not found" };
      slug = row.slug;
      authorId = row.authorId;
    } else if (parsed.type === "page") {
      const row = await getPageByIdForPreview(parsed.id);
      if (!row) return { success: false, error: "Page not found" };
      slug = row.slug;
      authorId = row.authorId;
    } else if (parsed.type === "service") {
      const row = await getServiceByIdForPreview(parsed.id);
      if (!row) return { success: false, error: "Service not found" };
      slug = row.slug;
      authorId = null;
      parentSlug = await getServiceParentSlug(row.parentId);
    } else if (parsed.type === "job") {
      const row = await getJobByIdForPreview(parsed.id);
      if (!row) return { success: false, error: "Job not found" };
      slug = row.slug;
      authorId = null;
    } else {
      const row = await getCaseStudyByIdForPreview(parsed.id);
      if (!row) return { success: false, error: "Case study not found" };
      slug = row.slug;
      authorId = row.authorId;
    }

    if (!canEditEntity(session, { authorId })) {
      return { success: false, error: "Forbidden" };
    }

    if (!slug?.trim()) {
      return { success: false, error: "Save a slug before previewing" };
    }

    const token = createPreviewToken({
      type: parsed.type as PreviewEntityType,
      id: parsed.id,
      slug,
      userId: session.user.id,
      parentSlug,
    });

    // Absolute URL from NEXT_PUBLIC_SITE_URL — never request/bind host (0.0.0.0).
    return {
      success: true,
      url: absoluteUrl(`/api/preview?token=${encodeURIComponent(token)}`),
    };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: actionErrorMessage(error, "Could not create preview link"),
    };
  }
}

export async function disableDraftPreview(): Promise<void> {
  const draft = await draftMode();
  draft.disable();

  const { cookies } = await import("next/headers");
  const {
    DRAFT_MARKER_COOKIE,
    draftMarkerCookieOptions,
  } = await import("@/lib/auth/marker-cookies");
  const jar = await cookies();
  jar.set(DRAFT_MARKER_COOKIE, "", {
    ...draftMarkerCookieOptions(0),
    maxAge: 0,
  });
}
