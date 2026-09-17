import { LoginForm } from "@/components/admin/login-form";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-default border border-border bg-surface p-8 shadow-soft dark:shadow-glow">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Kavcom Expert
          </p>
          <p className="mt-2 text-sm text-muted">Sign in to the admin dashboard</p>
        </div>
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
