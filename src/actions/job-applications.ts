"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireContentManager } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { jobApplications, jobs } from "@/lib/db/schema";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { checkFormSpam } from "@/lib/security/form-spam";
import { getPublicUrl, uploadToR2 } from "@/lib/r2";
import { createHash } from "node:crypto";
import path from "node:path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const ALLOWED_RESUME_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const applicationStatusSchema = z.enum([
  "new",
  "reviewed",
  "shortlisted",
  "rejected",
  "hired",
]);

type ApplicationResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function submitApplication(
  formData: FormData,
): Promise<ApplicationResult> {
  try {
    const ip = await getClientIp();
    const limited = await checkRateLimit(
      `lead:application:${ip}`,
      RATE_LIMITS.publicLead.max,
      RATE_LIMITS.publicLead.windowMs,
    );
    if (!limited.success) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    const website =
      typeof formData.get("website") === "string"
        ? String(formData.get("website"))
        : "";
    const formStartedRaw = formData.get("formStartedAt");
    const formStartedAt =
      typeof formStartedRaw === "string" ? Number(formStartedRaw) : undefined;

    const spam = checkFormSpam({ website, formStartedAt });
    if (spam.discard) {
      return { success: true, id: "discarded" };
    }

    const jobId = formData.get("jobId");
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const linkedinUrl = formData.get("linkedinUrl");
    const coverLetter = formData.get("coverLetter");
    const resumeFile = formData.get("resume");

    const parsed = z
      .object({
        jobId: z.string().uuid("Invalid job"),
        name: z.string().trim().min(1, "Name is required"),
        email: z.string().trim().email("Valid email required"),
        phone: z.string().optional(),
        linkedinUrl: z
          .string()
          .url("Invalid LinkedIn URL")
          .optional()
          .or(z.literal("")),
        coverLetter: z.string().optional(),
      })
      .parse({ jobId, name, email, phone, linkedinUrl, coverLetter });

    if (!(resumeFile instanceof File) || resumeFile.size === 0) {
      return { success: false, error: "Resume file is required" };
    }

    if (!ALLOWED_RESUME_MIME_TYPES.has(resumeFile.type)) {
      return {
        success: false,
        error: "Resume must be a PDF, DOC, or DOCX file",
      };
    }

    if (resumeFile.size > MAX_RESUME_SIZE) {
      return { success: false, error: "Resume must be 5MB or smaller" };
    }

    const [jobRow] = await getDb()
      .select({ id: jobs.id, status: jobs.status })
      .from(jobs)
      .where(eq(jobs.id, parsed.jobId))
      .limit(1);

    if (!jobRow || jobRow.status !== "published") {
      return { success: false, error: "Job posting not found" };
    }

    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 24);
    const ext = path.extname(resumeFile.name).replace(".", "").toLowerCase() || "pdf";
    const key = `resumes/${hash}.${ext}`;

    await uploadToR2(key, buffer, resumeFile.type);
    const resumeUrl = getPublicUrl(key);

    const [created] = await getDb()
      .insert(jobApplications)
      .values({
        jobId: parsed.jobId,
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone?.trim() || null,
        linkedinUrl: parsed.linkedinUrl?.trim() || null,
        coverLetter: parsed.coverLetter?.trim() || null,
        resumeUrl,
        resumeFilename: resumeFile.name.slice(0, 180),
        status: "new",
      })
      .returning({ id: jobApplications.id });

    revalidatePath(`/admin/jobs/${parsed.jobId}`);
    revalidatePath("/admin/applications");

    return { success: true, id: created.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }

    return { success: false, error: "Failed to submit application" };
  }
}

export async function updateApplicationStatus(
  id: string,
  status: z.infer<typeof applicationStatusSchema>,
  notes?: string,
): Promise<ApplicationResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    applicationStatusSchema.parse(status);

    const [existing] = await getDb()
      .select({ id: jobApplications.id, jobId: jobApplications.jobId })
      .from(jobApplications)
      .where(eq(jobApplications.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Application not found" };
    }

    await getDb()
      .update(jobApplications)
      .set({
        status,
        ...(notes !== undefined ? { notes: notes.trim() || null } : {}),
      })
      .where(eq(jobApplications.id, id));

    revalidatePath(`/admin/jobs/${existing.jobId}`);
    revalidatePath("/admin/applications");

    await audit({
      action: "update",
      entityType: "job_application",
      entityId: id,
      meta: { status },
    });

    return { success: true, id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to update application status" };
  }
}

export async function deleteApplication(id: string): Promise<ApplicationResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select({ id: jobApplications.id, jobId: jobApplications.jobId })
      .from(jobApplications)
      .where(eq(jobApplications.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Application not found" };
    }

    await getDb().delete(jobApplications).where(eq(jobApplications.id, id));

    revalidatePath(`/admin/jobs/${existing.jobId}`);
    revalidatePath("/admin/applications");

    await audit({
      action: "delete",
      entityType: "job_application",
      entityId: id,
    });

    return { success: true, id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to delete application" };
  }
}
