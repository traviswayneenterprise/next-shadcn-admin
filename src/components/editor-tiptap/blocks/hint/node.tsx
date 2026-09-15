"use client";

// Adapted from Scibly's blocks/hint/node.ts + components/hint.tsx - an
// inline atom node with click-to-reveal behavior. Simplified from their
// version: dropped `learnerRevealed` (a runtime/learner-session concept
// that only matters once this content is actually served to learners,
// not while authoring) and swapped their ResizeInputField for a plain
// inline text input, keeping just `content` + `isRevealed`.

import { useState } from "react";
import { Node, mergeAttributes, type NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Lightbulb } from "lucide-react";

import { Input } from "@/components/ui/input";

function HintComponent({ node, updateAttributes, editor }: NodeViewProps) {
  const content = (node.attrs.content as string) ?? "";
  const [isRevealed, setIsRevealed] = useState(false);

  if (editor.isEditable) {
    return (
      <NodeViewWrapper as="span" className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5">
        <Lightbulb className="size-3.5 text-amber-600" />
        <Input
          value={content}
          onChange={(event) => updateAttributes({ content: event.target.value })}
          placeholder="Hint text"
          className="h-6 w-40 border-none bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-0"
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <button
        type="button"
        onClick={() => setIsRevealed((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-sm text-amber-700 hover:bg-amber-500/20"
      >
        <Lightbulb className="size-3.5" />
        {isRevealed ? content : "Show hint"}
      </button>
    </NodeViewWrapper>
  );
}

export const Hint = Node.create({
  name: "hint",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      content: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="hint"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "hint" })];
  },

  addCommands() {
    return {
      insertHint:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { content: "" } }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(HintComponent);
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    hint: {
      insertHint: () => ReturnType;
    };
  }
}

export default Hint;
