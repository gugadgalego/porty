"use client";

import * as React from "react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function CmsRichTextEditor({
  value,
  onChange,
  placeholder = "Escreve o texto…",
  className,
}: Props) {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: cn(
          "cms-editor-prose min-h-[168px] max-w-none px-3 py-3 text-[14px] leading-relaxed",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    if (value !== cur) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[168px] animate-pulse rounded-none border border-border bg-muted/50",
          className,
        )}
      />
    );
  }

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const tb = "h-7 min-w-7 rounded-none px-2 font-mono text-[11px]";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-none border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 px-2 py-1.5">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          className={tb}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          className={tb}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="sm"
          className={tb}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </Button>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="sm"
          className={tb}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
          size="sm"
          className={tb}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </Button>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
          className={tb}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Lista
        </Button>
        <Button type="button" variant="ghost" size="sm" className={tb} onClick={setLink}>
          Link
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
