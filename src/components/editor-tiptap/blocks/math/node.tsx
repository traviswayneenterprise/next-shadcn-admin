"use client";

// Adapted from Scibly's blocks/math/block-math and inline-math (both
// KaTeX-based, same as the equation node we already vendored for the
// Lexical editor - same "confirm KaTeX's safe render API, never raw HTML
// interpolation" check applies here). Simplified from their version: a
// plain textarea instead of react-katex + react-simple-code-editor +
// Prism LaTeX syntax highlighting, which would've meant three more
// dependencies just for editing polish, not core functionality.

import { useState } from "react";
import { Node, mergeAttributes, type NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Sigma } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

function KatexPreview({ formula, className }: { formula: string; className?: string }) {
  if (!formula.trim()) return null;
  const html = katex.renderToString(formula, { throwOnError: false, displayMode: true });
  // katex.renderToString's output is KaTeX's own safe, sanitization-audited
  // HTML - the same safe-render discipline already confirmed for the
  // Lexical equation node, not a raw-string interpolation of user input.
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function MathComponent({ node, updateAttributes, editor }: NodeViewProps) {
  const formula = (node.attrs.formula as string) ?? "";
  const [open, setOpen] = useState(formula.trim() === "");
  const isBlock = node.type.name === "blockMath";

  return (
    <NodeViewWrapper as={isBlock ? "div" : "span"} className={isBlock ? "flex justify-center py-2" : "inline-block"}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="cursor-pointer rounded-md border border-dashed border-input px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            />
          }
        >
          {formula.trim() ? (
            <KatexPreview formula={formula} />
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Sigma className="size-4" /> Enter formula
            </span>
          )}
        </PopoverTrigger>
        {editor.isEditable && (
          <PopoverContent className="w-80 space-y-2" align="start">
            <Textarea
              autoFocus
              value={formula}
              onChange={(event) => updateAttributes({ formula: event.target.value })}
              placeholder="LaTeX, e.g. x^2 + y^2 = r^2"
              className="font-mono text-sm"
              rows={3}
            />
            <div className="rounded-md border border-input p-2 text-center">
              <KatexPreview formula={formula} />
            </div>
          </PopoverContent>
        )}
      </Popover>
    </NodeViewWrapper>
  );
}

function createMathNode(name: "blockMath" | "inlineMath", isInline: boolean) {
  return Node.create({
    name,
    group: isInline ? "inline" : "block",
    inline: isInline,
    atom: true,
    selectable: true,

    addAttributes() {
      return { formula: { default: "" } };
    },

    parseHTML() {
      return [{ tag: `div[data-type="${name}"]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["div", mergeAttributes(HTMLAttributes, { "data-type": name })];
    },

    addNodeView() {
      return ReactNodeViewRenderer(MathComponent);
    },
  });
}

export const BlockMath = createMathNode("blockMath", false);
export const InlineMath = createMathNode("inlineMath", true);
