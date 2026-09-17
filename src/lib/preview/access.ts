import { getOptionalPageSession } from "@/lib/admin/session";
import { canEditEntity, canAccessOwnedContent } from "@/lib/authz";
import {
  getCaseStudyForPreview,
  getJobForPreview,
  getPageForPreview,
  getPageForPreviewByPath,
  getPostForPreview,
  getServiceForPreview,
} from "@/lib/preview/content";
import { draftMode } from "next/headers";

/**
 * When Draft Mode is on and a privileged session can edit the entity,
 * return the preview (row + latest revision). Otherwise null → caller
 * should use the normal published query (unchanged for visitors).
 */
export async function resolvePostPreview(slug: string) {
  const draft = await draftMode();
  if (!draft.isEnabled) return null;

  const session = await getOptionalPageSession();
  if (!session || !canAccessOwnedContent(session)) return null;

  const post = await getPostForPreview(slug);
  if (!post) return null;
  if (!canEditEntity(session, { authorId: post.authorId })) return null;

  return post;
}

export async function resolvePagePreview(slug: string) {
  const draft = await draftMode();
  if (!draft.isEnabled) return null;

  const session = await getOptionalPageSession();
  if (!session || !canAccessOwnedContent(session)) return null;

  const page = await getPageForPreview(slug);
  if (!page) return null;
  if (!canEditEntity(session, { authorId: page.authorId })) return null;

  return page;
}

/** Nested / system paths: resolve draft CMS page by full public path. */
export async function resolvePagePreviewByPath(path: string) {
  const draft = await draftMode();
  if (!draft.isEnabled) return null;

  const session = await getOptionalPageSession();
  if (!session || !canAccessOwnedContent(session)) return null;

  const page = await getPageForPreviewByPath(path);
  if (!page) return null;
  if (!canEditEntity(session, { authorId: page.authorId })) return null;

  return page;
}

export async function resolveCaseStudyPreview(slug: string) {
  const draft = await draftMode();
  if (!draft.isEnabled) return null;

  const session = await getOptionalPageSession();
  if (!session || !canAccessOwnedContent(session)) return null;

  const study = await getCaseStudyForPreview(slug);
  if (!study) return null;
  if (!canEditEntity(session, { authorId: study.authorId })) return null;

  return study;
}

export async function resolveServicePreview(slug: string) {
  const draft = await draftMode();
  if (!draft.isEnabled) return null;

  const session = await getOptionalPageSession();
  if (!session || !canAccessOwnedContent(session)) return null;

  const service = await getServiceForPreview(slug);
  if (!service) return null;
  // Services have no authorId; editors/admins with owned-content access can preview.
  if (!canEditEntity(session, { authorId: null })) return null;

  return service;
}

export async function resolveJobPreview(slug: string) {
  const draft = await draftMode();
  if (!draft.isEnabled) return null;

  const session = await getOptionalPageSession();
  if (!session || !canAccessOwnedContent(session)) return null;

  const job = await getJobForPreview(slug);
  if (!job) return null;
  // Jobs have no authorId; editors/admins with owned-content access can preview.
  if (!canEditEntity(session, { authorId: null })) return null;

  return job;
}

export async function isDraftPreviewEnabled(): Promise<boolean> {
  const draft = await draftMode();
  return draft.isEnabled;
}
