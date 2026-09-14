"use client";

import { useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Minus,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Sigma,
  Columns2,
  Lightbulb,
} from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function useActiveState(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: (ctx) => {
      const e = ctx.editor;
      if (!e) return null;
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        h1: e.isActive("heading", { level: 1 }),
        h2: e.isActive("heading", { level: 2 }),
        h3: e.isActive("heading", { level: 3 }),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        link: e.isActive("link"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });
}

export function Toolbar({ editor }: { editor: Editor | null }) {
  const state = useActiveState(editor);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!editor || !state) {
    return <div className="h-11 rounded-t-lg border border-input bg-muted/30" />;
  }

  function handleImageFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor!.chain().focus().insertImage({ src: reader.result as string, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
  }

  function applyLink() {
    if (linkValue) {
      editor!.chain().focus().extendMarkRange("link").setLink({ href: linkValue }).run();
    } else {
      editor!.chain().focus().unsetLink().run();
    }
    setLinkOpen(false);
    setLinkValue("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-input bg-muted/30 p-1.5">
      <Button variant="ghost" size="icon-sm" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()} aria-label="Undo">
        <Undo2 />
      </Button>
      <Button variant="ghost" size="icon-sm" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()} aria-label="Redo">
        <Redo2 />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Toggle size="sm" pressed={state.h1} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="Heading 1">
        <Heading1 />
      </Toggle>
      <Toggle size="sm" pressed={state.h2} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading 2">
        <Heading2 />
      </Toggle>
      <Toggle size="sm" pressed={state.h3} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Heading 3">
        <Heading3 />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Toggle size="sm" pressed={state.bold} onPressedChange={() => editor.chain().focus().toggleBold().run()} aria-label="Bold">
        <Bold />
      </Toggle>
      <Toggle size="sm" pressed={state.italic} onPressedChange={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic">
        <Italic />
      </Toggle>
      <Toggle size="sm" pressed={state.underline} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline">
        <UnderlineIcon />
      </Toggle>
      <Toggle size="sm" pressed={state.strike} onPressedChange={() => editor.chain().focus().toggleStrike().run()} aria-label="Strikethrough">
        <Strikethrough />
      </Toggle>
      <Toggle size="sm" pressed={state.code} onPressedChange={() => editor.chain().focus().toggleCode().run()} aria-label="Inline code">
        <Code />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Toggle size="sm" pressed={state.bulletList} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list">
        <List />
      </Toggle>
      <Toggle size="sm" pressed={state.orderedList} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list">
        <ListOrdered />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      {linkOpen ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            applyLink();
          }}
        >
          <input
            autoFocus
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://..."
            className="h-7 w-48 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <Button type="submit" size="sm">Apply</Button>
        </form>
      ) : (
        <Toggle
          size="sm"
          pressed={state.link}
          onPressedChange={() => {
            setLinkValue(editor.getAttributes("link").href ?? "");
            setLinkOpen(true);
          }}
          aria-label="Link"
        >
          <LinkIcon />
        </Toggle>
      )}
      <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().setHorizontalRule().run()} aria-label="Horizontal rule">
        <Minus />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button variant="ghost" size="icon-sm" onClick={() => imageInputRef.current?.click()} aria-label="Insert image">
        <ImageIcon />
      </Button>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().insertContent({ type: "blockMath" }).run()} aria-label="Insert math">
        <Sigma />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().insertColumns().run()} aria-label="Insert columns">
        <Columns2 />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().insertHint().run()} aria-label="Insert hint">
        <Lightbulb />
      </Button>
    </div>
  );
}
