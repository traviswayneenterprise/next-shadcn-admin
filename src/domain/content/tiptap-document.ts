import { z } from "zod";
import { linkHref, imageSrc } from "./url-safety.ts";

// schemaVersion 3 stores a ProseMirror/Tiptap JSON document (the tree
// `editor.getJSON()` returns) directly in ContentDocument.blocks, the same
// way schemaVersion 2 stores a Lexical serialized state (see
// lexical-document.ts) and schemaVersion 1 stores our own block-array
// shape (blocks.ts). Same discipline as both: a closed, explicit schema -
// every node/mark `type` the editor can produce must have a branch here,
// and every field that becomes a stored URL goes through the same
// scheme/domain allowlists the other two validators use (ADR 0002). A
// document containing a type this file doesn't know about is rejected,
// regardless of what the client editor allowed.
//
// The exact node/mark type strings and attrs shapes below were confirmed
// against the extensions actually registered in
// src/components/editor-tiptap/editor.tsx - the stock @tiptap/extension-*
// packages' default attrs, plus our own vendored blocks under
// src/components/editor-tiptap/blocks/*. tests/tiptap-document.test.ts
// cross-checks the registered extension list against this file's coverage.

const MAX_NODES = 5000;
const MAX_DEPTH = 50;

type TiptapNodeInput = { type: string; content?: TiptapNodeInput[]; [key: string]: unknown };

// Every node type this file validates - kept in lockstep with the
// discriminated union below and with the extensions array in
// src/components/editor-tiptap/editor.tsx.
export const TIPTAP_NODE_TYPES = [
  "doc",
  "paragraph",
  "text",
  "heading",
  "codeBlock",
  "bulletList",
  "orderedList",
  "listItem",
  "hardBreak",
  "horizontalRule",
  "image",
  "blockMath",
  "inlineMath",
  "columns",
  "column",
  "hint",
] as const;

// Marks a text node can carry - bold/italic/underline/strike/code have no
// attrs; link's href goes through the same allowlist as every other
// stored link (linkHref).
const mark = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({ type: z.literal("underline") }),
  z.object({ type: z.literal("strike") }),
  z.object({ type: z.literal("code") }),
  z.object({
    type: z.literal("link"),
    attrs: z.object({
      href: linkHref,
      target: z.string().max(50).nullable().optional(),
      rel: z.string().max(200).nullable().optional(),
      class: z.string().max(200).nullable().optional(),
    }),
  }),
]);

const tiptapNode: z.ZodType<TiptapNodeInput> = z.lazy(() =>
  z.discriminatedUnion("type", [
    // --- text leaf --------------------------------------------------
    z.object({
      type: z.literal("text"),
      text: z.string().min(1).max(20_000),
      marks: z.array(mark).max(20).optional(),
    }),

    // --- containers ---------------------------------------------------
    z.object({ type: z.literal("doc"), content: z.array(tiptapNode).max(MAX_NODES) }),
    z.object({ type: z.literal("paragraph"), content: z.array(tiptapNode).max(1000).optional() }),
    z.object({
      type: z.literal("heading"),
      attrs: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
      content: z.array(tiptapNode).max(200).optional(),
    }),
    z.object({
      type: z.literal("codeBlock"),
      attrs: z.object({ language: z.string().max(50).nullable().optional() }).optional(),
      content: z.array(tiptapNode).max(2000).optional(),
    }),
    z.object({ type: z.literal("bulletList"), content: z.array(tiptapNode).max(500) }),
    z.object({
      type: z.literal("orderedList"),
      attrs: z.object({ start: z.number().int().min(0).max(100_000).optional() }).optional(),
      content: z.array(tiptapNode).max(500),
    }),
    z.object({ type: z.literal("listItem"), content: z.array(tiptapNode).max(500) }),
    z.object({ type: z.literal("columns"), content: z.array(tiptapNode).length(2) }),
    z.object({ type: z.literal("column"), content: z.array(tiptapNode).max(200) }),

    // --- leaves / atoms - no content --------------------------------
    z.object({ type: z.literal("hardBreak") }),
    z.object({ type: z.literal("horizontalRule") }),
    z.object({
      type: z.literal("image"),
      attrs: z.object({
        src: imageSrc,
        alt: z.string().max(1000).nullable().optional(),
        width: z.union([z.number().min(0).max(10_000), z.literal("inherit")]).optional(),
        height: z.union([z.number().min(0).max(10_000), z.literal("inherit")]).optional(),
      }),
    }),
    z.object({
      type: z.literal("blockMath"),
      attrs: z.object({ formula: z.string().max(4000) }).optional(),
    }),
    z.object({
      type: z.literal("inlineMath"),
      attrs: z.object({ formula: z.string().max(4000) }).optional(),
    }),
    z.object({
      type: z.literal("hint"),
      attrs: z.object({ content: z.string().max(2000) }).optional(),
    }),
  ]),
);

const tiptapDoc = z.object({
  type: z.literal("doc"),
  content: z.array(tiptapNode).max(MAX_NODES),
});

export type TiptapDocument = { schemaVersion: 3; blocks: z.infer<typeof tiptapDoc> };

function countNodes(node: TiptapNodeInput, depth: number): number {
  if (depth > MAX_DEPTH) {
    throw new z.ZodError([
      { code: "custom", path: [], message: `Document nesting exceeds ${MAX_DEPTH} levels.` },
    ]);
  }
  let count = 1;
  for (const child of node.content ?? []) {
    count += countNodes(child, depth + 1);
    if (count > MAX_NODES) {
      throw new z.ZodError([
        { code: "custom", path: [], message: `Document exceeds ${MAX_NODES} nodes.` },
      ]);
    }
  }
  return count;
}

export function validateTiptapDocument(value: unknown): TiptapDocument {
  const parsed = z.object({ schemaVersion: z.literal(3), blocks: tiptapDoc }).parse(value);
  countNodes(parsed.blocks, 0);
  return parsed;
}
