"use client";

import { quickDraftPost } from "@/actions/posts";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuickDraftBox({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      toast("Add a title first", "error");
      return;
    }
    setSaving(true);
    const result = await quickDraftPost({ title, body });
    setSaving(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Draft saved");
    router.push(`/admin/posts/${result.id}`);
    router.refresh();
  }

  const form = (
    <div className={embedded ? "space-y-3" : "mt-4 space-y-3 border border-border bg-surface p-4"}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="inline-flex h-9 items-center justify-center bg-accent px-4 text-sm font-medium text-surface disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save draft"}
      </button>
    </div>
  );

  if (embedded) {
    return form;
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">Quick draft</h2>
      {form}
    </div>
  );
}
