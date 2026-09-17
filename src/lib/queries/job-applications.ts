import { getDb } from "@/lib/db";
import { jobApplications, jobs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getApplicationsByJobId(jobId: string) {
  return getDb()
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.jobId, jobId))
    .orderBy(desc(jobApplications.createdAt));
}

export async function getAllApplications() {
  return getDb()
    .select({
      id: jobApplications.id,
      jobId: jobApplications.jobId,
      jobTitle: jobs.title,
      name: jobApplications.name,
      email: jobApplications.email,
      phone: jobApplications.phone,
      linkedinUrl: jobApplications.linkedinUrl,
      resumeUrl: jobApplications.resumeUrl,
      resumeFilename: jobApplications.resumeFilename,
      status: jobApplications.status,
      notes: jobApplications.notes,
      createdAt: jobApplications.createdAt,
    })
    .from(jobApplications)
    .leftJoin(jobs, eq(jobApplications.jobId, jobs.id))
    .orderBy(desc(jobApplications.createdAt));
}
