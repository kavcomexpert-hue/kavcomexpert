import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { MapPin, Briefcase, Clock } from "lucide-react";
import Link from "next/link";

type JobCard = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string;
  requirements: string | null;
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  remote: "Remote",
};

function JobCard({ job, index }: { job: JobCard; index: number }) {
  const card = (
    <Link
      href={`/careers/${job.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-default border border-border bg-background p-7 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow"
    >
      {job.department ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">
          {job.department}
        </p>
      ) : null}

      <h3 className="font-display text-lg font-semibold leading-snug text-foreground group-hover:text-accent">
        {job.title}
      </h3>

      <div className="mt-3 flex flex-wrap gap-3">
        {job.location ? (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {job.location}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
          {EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType}
        </span>
      </div>

      {job.requirements ? (
        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
          {job.requirements}
        </p>
      ) : null}

      <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent">
        View role
        <svg
          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );

  return (
    <BlurReveal delay={index * 0.07} key={job.id}>
      {card}
    </BlurReveal>
  );
}

export function CareerJobsGrid({
  jobs,
  emptyTitle = "No open positions right now",
  emptyBody = "We don't have any openings at the moment, but we're always happy to hear from talented people. Drop us a line at",
  emptyEmail = "career@kavcomexpert.com",
}: {
  jobs: JobCard[];
  emptyTitle?: string;
  emptyBody?: string;
  emptyEmail?: string;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-default border border-border bg-surface px-8 py-16 text-center">
        <Briefcase className="mx-auto mb-4 size-10 text-muted/50" />
        <p className="font-display text-xl font-semibold text-foreground">
          {emptyTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {emptyBody}{" "}
          <a
            href={`mailto:${emptyEmail}`}
            className="text-accent hover:opacity-80"
          >
            {emptyEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <ul
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Open positions"
    >
      {jobs.map((job, index) => (
        <li key={job.id} className="flex flex-col">
          <JobCard job={job} index={index} />
        </li>
      ))}
    </ul>
  );
}
