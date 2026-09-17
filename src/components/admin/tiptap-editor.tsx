"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TiptapLinkDialog } from "@/components/admin/tiptap-link-dialog";
import {
  normalizeLinkHref,
  toPlainTiptapJson,
} from "@/lib/tiptap/serialize";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Table,
} from "lucide-react";
import { useEffect, useImperativeHandle, forwardRef, useState } from "react";

export type TiptapEditorHandle = {
  insertImage: (url: string) => void;
};

type TiptapEditorProps = {
  content: unknown;
  onChange: (content: unknown) => void;
  onPickImage?: () => void;
};

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-default border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        active
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-border bg-background text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditor({ content, onChange, onPickImage }, ref) {
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkHref, setLinkHref] = useState("");

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          link: false,
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          // TipTap's default isAllowedUri is protocol-oriented; explicitly
          // allow site-relative paths from the internal link picker.
          isAllowedUri: (url, ctx) => {
            if (!url?.trim()) return false;
            const trimmed = url.trim();
            if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
            return ctx.defaultValidate(trimmed);
          },
          HTMLAttributes: {
            class: "text-accent underline underline-offset-2",
            // Don't force target=_blank — RichText decides per URL.
            target: null,
            rel: null,
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: "max-w-full rounded-default",
          },
        }),
        TableKit.configure({
          table: {
            resizable: true,
            HTMLAttributes: {
              class: "w-full border-collapse border border-border",
            },
          },
        }),
      ],
      content: content ?? { type: "doc", content: [] },
      editorProps: {
        attributes: {
          class: "tiptap-content min-h-[320px] px-4 py-3 focus:outline-none",
        },
        // openOnClick is false so normal clicks keep the caret for editing.
        // Cmd/Ctrl (+ Meta) click opens the link in a new tab.
        handleDOMEvents: {
          click: (_view, event) => {
            const mouseEvent = event as MouseEvent;
            if (!mouseEvent.metaKey && !mouseEvent.ctrlKey) {
              return false;
            }
            const target = mouseEvent.target;
            if (!(target instanceof Element)) {
              return false;
            }
            const anchor = target.closest("a");
            const href = anchor?.getAttribute("href")?.trim();
            if (!href) {
              return false;
            }
            mouseEvent.preventDefault();
            window.open(href, "_blank", "noopener,noreferrer");
            return true;
          },
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        // ProseMirror builds node/mark `attrs` with Object.create(null).
        // React Flight drops those on server actions, which previously
        // saved link marks as `{ type: "link" }` with no href. Always
        // emit Flight-safe plain objects (and heal bare URL link text).
        onChange(toPlainTiptapJson(currentEditor.getJSON()));
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        insertImage(url: string) {
          editor?.chain().focus().setImage({ src: url }).run();
        },
      }),
      [editor],
    );

    useEffect(() => {
      if (!editor) {
        return;
      }

      const current = editor.getJSON();
      const incoming = content ?? { type: "doc", content: [] };

      const plainIncoming = toPlainTiptapJson(incoming);
      if (JSON.stringify(current) !== JSON.stringify(plainIncoming)) {
        editor.commands.setContent(plainIncoming);
      }
    }, [content, editor]);

    if (!editor) {
      return null;
    }

    function setLink() {
      const previousUrl = editor?.getAttributes("link").href as
        | string
        | undefined;
      setLinkHref(previousUrl ?? "");
      setLinkOpen(true);
    }

    function applyLink(href: string) {
      const cleaned = normalizeLinkHref(href);
      if (!cleaned || !editor) return;

      const { empty } = editor.state.selection;
      const chain = editor.chain().focus().extendMarkRange("link");
      // TipTap won't create a link mark on an empty selection — insert the
      // URL as text first so the mark always lands with a real href.
      if (empty) {
        chain.insertContent(cleaned).setLink({ href: cleaned }).run();
      } else {
        chain.setLink({ href: cleaned }).run();
      }
      onChange(toPlainTiptapJson(editor.getJSON()));
      setLinkOpen(false);
    }

    function removeLink() {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
    }

    function addImage() {
      if (onPickImage) {
        onPickImage();
        return;
      }

      const url = window.prompt("Enter image URL");

      if (!url) {
        return;
      }

      editor?.chain().focus().setImage({ src: url }).run();
    }

    function insertTable() {
      editor
        ?.chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }

    return (
      <div className="rounded-default border border-border bg-surface">
        <div className="sticky top-0 z-20 flex flex-wrap gap-2 border-b border-border bg-background px-3 py-2 shadow-soft">
          <ToolbarButton
            label="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Ordered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            active={editor.isActive("link")}
            onClick={setLink}
          >
            <Link2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Image" onClick={addImage}>
            <ImageIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Table"
            active={editor.isActive("table")}
            onClick={insertTable}
          >
            <Table className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="size-4" />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} />
        <TiptapLinkDialog
          open={linkOpen}
          initialHref={linkHref}
          onClose={() => setLinkOpen(false)}
          onSubmit={applyLink}
          onRemove={linkHref ? removeLink : undefined}
        />
      </div>
    );
  },
);
