"use client";

import { submitApplication } from "@/actions/job-applications";
import {
  HoneypotFields,
  useFormStartedAt,
} from "@/components/site/form-spam-fields";
import { useRef, useState } from "react";

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

export type JobApplyFormProps = {
  jobId: string;
  applyNameLabel?: string;
  applyNamePlaceholder?: string;
  applyEmailLabel?: string;
  applyEmailPlaceholder?: string;
  applyPhoneLabel?: string;
  applyPhonePlaceholder?: string;
  applyLinkedinLabel?: string;
  applyLinkedinPlaceholder?: string;
  applyCoverLabel?: string;
  applyCoverPlaceholder?: string;
  applyResumeLabel?: string;
  applySubmitLabel?: string;
  applySuccessTitle?: string;
  applySuccessBody?: string;
};

export function JobApplyForm({
  jobId,
  applyNameLabel = "Full name",
  applyNamePlaceholder = "Jane Smith",
  applyEmailLabel = "Email address",
  applyEmailPlaceholder = "jane@example.com",
  applyPhoneLabel = "Phone",
  applyPhonePlaceholder = "+1 555 000 0000",
  applyLinkedinLabel = "LinkedIn URL",
  applyLinkedinPlaceholder = "https://linkedin.com/in/…",
  applyCoverLabel = "Cover letter",
  applyCoverPlaceholder = "Tell us why you're a great fit for this role…",
  applyResumeLabel = "Resume",
  applySubmitLabel = "Submit application",
  applySuccessTitle = "Application submitted",
  applySuccessBody = "Thank you for applying. We review every application personally and will be in touch if there's a good fit.",
}: JobApplyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { markStarted, getStartedAt } = useFormStartedAt();
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [fileName, setFileName] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    const formData = new FormData(event.currentTarget);
    formData.set("formStartedAt", String(getStartedAt()));
    const result = await submitApplication(formData);

    if (result.success) {
      setState({ status: "success" });
      formRef.current?.reset();
      setFileName("");
    } else {
      setState({ status: "error", message: result.error });
    }
  }

  if (state.status === "success") {
    return (
      <div className="rounded-default border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent/10">
          <svg
            className="size-6 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground">
          {applySuccessTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {applySuccessBody}
        </p>
      </div>
    );
  }

  const isLoading = state.status === "loading";

  return (
    <form
      ref={formRef}
      onSubmit={(event) => void handleSubmit(event)}
      onFocusCapture={markStarted}
      className="relative space-y-5"
    >
      <HoneypotFields />
      <input type="hidden" name="jobId" value={jobId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            {applyNameLabel} <span className="text-danger">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder={applyNamePlaceholder}
            className={fieldClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            {applyEmailLabel} <span className="text-danger">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={applyEmailPlaceholder}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="phone"
            className="text-sm font-medium text-foreground"
          >
            {applyPhoneLabel}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder={applyPhonePlaceholder}
            className={fieldClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="linkedinUrl"
            className="text-sm font-medium text-foreground"
          >
            {applyLinkedinLabel}
          </label>
          <input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder={applyLinkedinPlaceholder}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="coverLetter"
          className="text-sm font-medium text-foreground"
        >
          {applyCoverLabel}
        </label>
        <textarea
          id="coverLetter"
          name="coverLetter"
          rows={5}
          placeholder={applyCoverPlaceholder}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="resume"
          className="text-sm font-medium text-foreground"
        >
          {applyResumeLabel} <span className="text-danger">*</span>
        </label>
        <p className="text-xs text-muted">PDF, DOC, or DOCX — max 5 MB</p>
        <label
          htmlFor="resume"
          className="flex cursor-pointer items-center gap-3 rounded-default border border-border bg-background px-4 py-3 transition-colors hover:border-accent"
        >
          <svg
            className="size-5 shrink-0 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <span className="text-sm text-muted">
            {fileName || "Choose file…"}
          </span>
          <input
            id="resume"
            name="resume"
            type="file"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) =>
              setFileName(e.target.files?.[0]?.name ?? "")
            }
          />
        </label>
      </div>

      {state.status === "error" ? (
        <p className="rounded-default bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-12 w-full items-center justify-center rounded-default bg-accent text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isLoading ? "Submitting…" : applySubmitLabel}
      </button>
    </form>
  );
}
