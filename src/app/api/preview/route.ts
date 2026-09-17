import { auth } from "@/lib/auth";
import { canEditEntity, canAccessOwnedContent } from "@/lib/authz";
import {
  getCaseStudyByIdForPreview,
  getJobByIdForPreview,
  getPageByIdForPreview,
  getPostByIdForPreview,
  getServiceByIdForPreview,
  getServiceParentSlug,
} from "@/lib/preview/content";
import { previewErrorResponse } from "@/lib/preview/error-page";
import {
  publicPathForPreview,
  verifyPreviewToken,
} from "@/lib/preview/token";
import { publicUrl } from "@/lib/seo/constants";
import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return previewErrorResponse(
      "Missing preview token",
      "This preview link is incomplete. Open Preview again from the admin editor.",
      400,
    );
  }

  const payload = verifyPreviewToken(token);
  if (!payload) {
    return previewErrorResponse(
      "Invalid or expired preview",
      "This preview link is invalid or has expired. Open Preview again from the admin editor to get a fresh link.",
      401,
    );
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session || !canAccessOwnedContent(session)) {
    const login = publicUrl("/admin/login");
    login.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(login);
  }

  if (session.user.id !== payload.userId) {
    return previewErrorResponse(
      "Preview session mismatch",
      "This preview link was created for a different signed-in admin. Sign in as that user, or open Preview again from your own editor session.",
      403,
    );
  }

  let authorId: string | null = null;
  let liveSlug = payload.slug;
  let livePath: string | null = null;
  let parentSlug: string | null = payload.parentSlug ?? null;

  if (payload.type === "post") {
    const row = await getPostByIdForPreview(payload.id);
    if (!row) {
      return previewErrorResponse(
        "Post not found",
        "The post for this preview no longer exists. It may have been deleted.",
        404,
      );
    }
    authorId = row.authorId;
    liveSlug = row.slug;
  } else if (payload.type === "page") {
    const row = await getPageByIdForPreview(payload.id);
    if (!row) {
      return previewErrorResponse(
        "Page not found",
        "The page for this preview no longer exists. It may have been deleted.",
        404,
      );
    }
    authorId = row.authorId;
    liveSlug = row.slug;
    livePath = row.path;
  } else if (payload.type === "service") {
    const row = await getServiceByIdForPreview(payload.id);
    if (!row) {
      return previewErrorResponse(
        "Service not found",
        "The service for this preview no longer exists. It may have been deleted.",
        404,
      );
    }
    authorId = null;
    liveSlug = row.slug;
    parentSlug = await getServiceParentSlug(row.parentId);
  } else if (payload.type === "job") {
    const row = await getJobByIdForPreview(payload.id);
    if (!row) {
      return previewErrorResponse(
        "Job not found",
        "The job for this preview no longer exists. It may have been deleted.",
        404,
      );
    }
    authorId = null;
    liveSlug = row.slug;
  } else {
    const row = await getCaseStudyByIdForPreview(payload.id);
    if (!row) {
      return previewErrorResponse(
        "Case study not found",
        "The case study for this preview no longer exists. It may have been deleted.",
        404,
      );
    }
    authorId = row.authorId;
    liveSlug = row.slug;
  }

  if (!canEditEntity(session, { authorId })) {
    return previewErrorResponse(
      "Forbidden",
      "You do not have permission to preview this content.",
      403,
    );
  }

  const draft = await draftMode();
  draft.enable();

  const path = publicPathForPreview(
    payload.type,
    liveSlug,
    livePath,
    parentSlug,
  );
  return NextResponse.redirect(publicUrl(path));
}
