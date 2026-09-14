"use client";

import { useEffect } from "react";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";

import { Document } from "@tiptap/extension-document";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { Heading } from "@tiptap/extension-heading";
import { Bold } from "@tiptap/extension-bold";
import { Italic } from "@tiptap/extension-italic";
import { Underline } from "@tiptap/extension-underline";
import { Strike } from "@tiptap/extension-strike";
import { Code } from "@tiptap/extension-code";
import { CodeBlock } from "@tiptap/extension-code-block";
import { BulletList, OrderedList, ListItem, ListKeymap } from "@tiptap/extension-list";
import { Link } from "@tiptap/extension-link";
import { HardBreak } from "@tiptap/extension-hard-break";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Typography } from "@tiptap/extension-typography";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Dropcursor, Gapcursor, TrailingNode, UndoRedo } from "@tiptap/extensions";

import { Image } from "@/components/editor-tiptap/blocks/image/node";
import { BlockMath, InlineMath } from "@/components/editor-tiptap/blocks/math/node";
import { Columns, Column } from "@/components/editor-tiptap/blocks/columns/node";
import { Hint } from "@/components/editor-tiptap/blocks/hint/node";
import { Toolbar } from "@/components/editor-tiptap/toolbar";

/**
 * PR-T1: plumbing only, non-collaborative ("local") mode - mirrors
 * Scibly's own createLocalEditorOptions (apps/app/src/shared/content/editor/runtime/create-editor-options.ts):
 * plain JSONContent in, no Yjs, no Hocuspocus.
 *
 * Every extension below is a vanilla @tiptap/extension-* package, not
 * Scibly's vendored wrapper - reading Scibly's blocks/text-schema/extensions.ts
 * confirmed every one of those wrappers only adds an addHtmlSchemaAwareness()
 * method (metadata for their AI notebook feature, which we don't have) with
 * zero behavior change, except two .configure() calls reproduced here
 * (Link openOnClick, Heading levels) and CustomListItem's Tab-to-indent
 * keyboard shortcut, reproduced below since it's a real, worthwhile
 * behavior difference from the stock ListItem.
 */
const TabIndentListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: () => this.editor.commands.sinkListItem(this.name) || true,
    };
  },
});

const extensions = [
  Document,
  Paragraph,
  Text,
  Heading.configure({ levels: [1, 2, 3] }),
  Bold,
  Italic,
  Underline,
  Strike,
  Code,
  CodeBlock,
  BulletList,
  OrderedList,
  TabIndentListItem,
  ListKeymap,
  Link.configure({ openOnClick: false }),
  HardBreak,
  HorizontalRule,
  Typography,
  Placeholder.configure({ placeholder: "Type '/' for commands, or just start writing..." }),
  Dropcursor.configure({ color: "#DBEAFE", width: 5 }),
  Gapcursor,
  TrailingNode,
  // Only relevant in local (non-collaborative) mode - Yjs has its own undo
  // manager for collaborative editing, matching Scibly's own
  // undo-redo/definition.ts (`mode === "local" ? [UndoRedo] : []`).
  UndoRedo,
  // Widened block set (Image, Math, Columns, Hint) - adapted from Scibly's
  // richer block library so the Lexical/Tiptap trial compares similarly
  // broad feature sets rather than "everything" vs "the basics".
  Image,
  BlockMath,
  InlineMath,
  Columns,
  Column,
  Hint,
];

export function TiptapEditor({
  initialContent,
  onEditor,
}: {
  /** A ProseMirror/Tiptap JSONContent document, loaded once on mount. */
  initialContent?: JSONContent;
  /** Fires once with the created editor instance - use it to read content back out for saving. */
  onEditor?: (editor: Editor) => void;
}) {
  const editor = useEditor({
    extensions,
    content: initialContent,
    shouldRerenderOnTransaction: false,
    immediatelyRender: false,
    autofocus: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[300px] flex-1 rounded-b-lg border border-t-0 border-input bg-transparent px-4 py-3 outline-none focus-visible:ring-0",
      },
    },
  });

  useEffect(() => {
    if (editor) onEditor?.(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
      <Toolbar editor={editor} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
