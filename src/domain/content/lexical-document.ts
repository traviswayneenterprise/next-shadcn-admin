import { z } from "zod";
import { linkHref, imageSrc } from "./url-safety.ts";

// schemaVersion 2 stores a Lexical serialized editor-state tree (the
// `root` node, i.e. `editor.getEditorState().toJSON().root`) directly in
// ContentDocument.blocks, rather than our own array-of-typed-blocks shape
// (that's schemaVersion 1, unchanged forever - see blocks.ts).
//
// Same discipline as v1: a closed, explicit schema - every node `type`
// the editor can produce must have a branch here, and every field that
// becomes a stored URL goes through the same scheme/domain allowlists v1
// uses. A document containing a node type this file doesn't know about is
// rejected, regardless of what the client editor allowed - the validator,
// not the editor, is what makes stored content trustworthy (ADR 0002).
//
// The exact node type strings and field shapes below were confirmed by
// reading each node class in src/components/editor/nodes/* and the
// official @lexical/* packages actually registered in
// src/components/editor/editor.tsx - not guessed from documentation. If a
// new extension is registered there, this file needs a matching branch;
// tests/lexical-document.test.ts cross-checks the two lists.

const MAX_NODES = 5000;
const MAX_DEPTH = 50;

// Embed nodes (figma/youtube/tweet) store an opaque provider ID, not a
// full URL - confirmed by reading figma-node.tsx/youtube-node.tsx/tweet-node.tsx's
// exportJSON: {documentID}/{videoID}/{id} respectively. The actual embed
// URL is built client-side from a fixed template at render time, so the
// domain boundary (youtube.com/youtu.be, twitter.com/x.com, figma.com -
// see url-safety.ts's domainAllowedUrl) belongs at that render site, not
// here - this just bounds the stored ID to a safe, URL-safe token shape.
const embedId = z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/, "Invalid embed id.");

const textFormat = z.number().int().min(0).max(0xffff);
const elementFormat = z.enum(["left", "start", "center", "right", "end", "justify", ""]).optional();
const direction = z.enum(["ltr", "rtl"]).nullable().optional();
const textMode = z.enum(["normal", "token", "segmented"]).optional();

const baseNode = z.object({ version: z.number().int().min(1).max(10) });

const textNodeBase = baseNode.extend({
  text: z.string().max(20_000),
  format: textFormat.optional(),
  style: z.string().max(2000).optional(),
  mode: textMode,
  detail: z.number().int().min(0).max(3).optional(),
});

const elementNodeBase = baseNode.extend({
  format: elementFormat,
  indent: z.number().int().min(0).max(50).optional(),
  direction,
});

// Recursive: an element node's children are lexical nodes too. z.lazy()
// breaks the circular reference; the depth/count cap below (not Zod
// itself) is what actually bounds recursion, since a discriminated union
// alone has no depth limit.
type LexicalNodeInput = { type: string; children?: LexicalNodeInput[]; [key: string]: unknown };

// Every custom (non-official-Lexical-package) node type string this file
// validates, i.e. every `this.config("<type>", ...)` call under
// src/components/editor/nodes/*. Hand-maintained in lockstep with the
// discriminated union below - tests/lexical-document.test.ts greps the
// node files for their type strings and asserts every one is listed here,
// so registering a new custom node without validating it fails CI.
export const LMS_CUSTOM_NODE_TYPES = [
  "mention",
  "emoji",
  "specialText",
  "ruby",
  "card",
  "slot-container",
  "collapsible-container",
  "collapsible-title",
  "collapsible-content",
  "layout-container",
  "layout-item",
  "mark",
  "pullquote",
  "review",
  "image",
  "equation",
  "figma",
  "youtube",
  "tweet",
  "poll",
  "datetime",
] as const;

const lexicalNode: z.ZodType<LexicalNodeInput> = z.lazy(() =>
  z.discriminatedUnion("type", [
    // --- text-like leaves --------------------------------------------
    textNodeBase.extend({ type: z.literal("text") }),
    textNodeBase.extend({ type: z.literal("tab") }),
    textNodeBase.extend({ type: z.literal("code-highlight"), highlightType: z.string().max(50).optional() }),
    textNodeBase.extend({ type: z.literal("mention"), mentionName: z.string().min(1).max(200) }),
    textNodeBase.extend({ type: z.literal("emoji"), className: z.string().max(200) }),
    textNodeBase.extend({ type: z.literal("specialText") }),
    textNodeBase.extend({ type: z.literal("ruby"), annotation: z.string().max(200) }),
    baseNode.extend({ type: z.literal("linebreak") }),

    // --- element containers --------------------------------------------
    elementNodeBase.extend({ type: z.literal("root"), children: z.array(lexicalNode).max(MAX_NODES) }),
    elementNodeBase.extend({ type: z.literal("paragraph"), children: z.array(lexicalNode).max(1000) }),
    elementNodeBase.extend({
      type: z.literal("heading"),
      tag: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
      children: z.array(lexicalNode).max(200),
    }),
    elementNodeBase.extend({ type: z.literal("quote"), children: z.array(lexicalNode).max(500) }),
    elementNodeBase.extend({
      type: z.literal("list"),
      listType: z.enum(["bullet", "number", "check"]),
      start: z.number().int().min(0).max(100_000).optional(),
      tag: z.enum(["ul", "ol"]),
      children: z.array(lexicalNode).max(500),
    }),
    elementNodeBase.extend({
      type: z.literal("listitem"),
      value: z.number().int().min(0).max(100_000).optional(),
      checked: z.boolean().optional(),
      children: z.array(lexicalNode).max(500),
    }),
    elementNodeBase.extend({
      type: z.literal("link"),
      url: linkHref,
      target: z.string().max(50).nullable().optional(),
      rel: z.string().max(200).nullable().optional(),
      title: z.string().max(500).nullable().optional(),
      children: z.array(lexicalNode).max(200),
    }),
    elementNodeBase.extend({
      type: z.literal("autolink"),
      url: linkHref,
      target: z.string().max(50).nullable().optional(),
      rel: z.string().max(200).nullable().optional(),
      title: z.string().max(500).nullable().optional(),
      isUnlinked: z.boolean().optional(),
      children: z.array(lexicalNode).max(50),
    }),
    elementNodeBase.extend({
      type: z.literal("code"),
      language: z.string().max(50).nullable().optional(),
      children: z.array(lexicalNode).max(2000),
    }),
    elementNodeBase.extend({ type: z.literal("table"), children: z.array(lexicalNode).max(500) }),
    elementNodeBase.extend({
      type: z.literal("tablerow"),
      height: z.number().nullable().optional(),
      children: z.array(lexicalNode).max(50),
    }),
    elementNodeBase.extend({
      type: z.literal("tablecell"),
      headerState: z.number().int().min(0).max(3).optional(),
      colSpan: z.number().int().min(1).max(50).optional(),
      rowSpan: z.number().int().min(1).max(50).optional(),
      width: z.number().nullable().optional(),
      backgroundColor: z.string().max(50).nullable().optional(),
      children: z.array(lexicalNode).max(500),
    }),
    baseNode.extend({ type: z.literal("horizontalrule") }),

    // --- LMS-editor custom containers (see src/components/editor/nodes) ---
    elementNodeBase.extend({ type: z.literal("card"), children: z.array(lexicalNode).max(200) }),
    elementNodeBase.extend({ type: z.literal("slot-container"), children: z.array(lexicalNode).max(200) }),
    elementNodeBase.extend({
      type: z.literal("collapsible-container"),
      open: z.boolean(),
      children: z.array(lexicalNode).max(200),
    }),
    elementNodeBase.extend({ type: z.literal("collapsible-title"), children: z.array(lexicalNode).max(200) }),
    elementNodeBase.extend({ type: z.literal("collapsible-content"), children: z.array(lexicalNode).max(500) }),
    elementNodeBase.extend({
      type: z.literal("layout-container"),
      // Grid track-sizing syntax only (fr/px/%/repeat/minmax/digits/spaces/commas) -
      // written directly into element.style.gridTemplateColumns at render time.
      // Not an XSS vector (CSSOM property assignment can't execute script), but
      // kept to a closed character set rather than accepting arbitrary CSS text.
      templateColumns: z.string().max(200).regex(/^[0-9a-zA-Z%.\s,()fr-]*$/, "Invalid grid template."),
      children: z.array(lexicalNode).max(12),
    }),
    elementNodeBase.extend({ type: z.literal("layout-item"), children: z.array(lexicalNode).max(500) }),
    elementNodeBase.extend({
      type: z.literal("mark"),
      ids: z.array(z.string().min(1).max(100)).max(50),
      children: z.array(lexicalNode).max(200),
    }),
    elementNodeBase.extend({ type: z.literal("pullquote"), children: z.array(lexicalNode).max(200) }),
    elementNodeBase.extend({
      type: z.literal("review"),
      rating: z.number().int().min(0).max(5),
      children: z.array(lexicalNode).max(200),
    }),

    // --- LMS-editor decorators (no children - self-contained payload) ---
    baseNode.extend({
      type: z.literal("image"),
      altText: z.string().max(1000),
      src: imageSrc,
      height: z.number().min(0).max(10_000).optional(),
      width: z.number().min(0).max(10_000).optional(),
      maxWidth: z.number().min(0).max(10_000),
    }),
    baseNode.extend({
      type: z.literal("equation"),
      equation: z.string().max(4000),
      inline: z.boolean(),
    }),
    elementNodeBase.extend({ type: z.literal("figma"), documentID: embedId }),
    elementNodeBase.extend({ type: z.literal("youtube"), videoID: embedId }),
    elementNodeBase.extend({ type: z.literal("tweet"), id: embedId }),
    baseNode.extend({
      type: z.literal("poll"),
      question: z.string().max(500),
      options: z
        .array(
          z.object({
            text: z.string().max(500),
            uid: z.string().min(1).max(100),
            votes: z.array(z.string().max(100)).max(10_000),
          }),
        )
        .max(50),
    }),
    baseNode.extend({
      type: z.literal("datetime"),
      dateTime: z.string().datetime().optional(),
    }),
  ]),
);

const lexicalRootNode = z.object({
  type: z.literal("root"),
  version: z.number().int().min(1).max(10),
  format: elementFormat,
  indent: z.number().int().min(0).max(50).optional(),
  direction,
  children: z.array(lexicalNode),
});

export type LexicalDocument = { schemaVersion: 2; blocks: z.infer<typeof lexicalRootNode> };

function countNodes(node: LexicalNodeInput, depth: number): number {
  if (depth > MAX_DEPTH) {
    throw new z.ZodError([
      { code: "custom", path: [], message: `Document nesting exceeds ${MAX_DEPTH} levels.` },
    ]);
  }
  let count = 1;
  for (const child of node.children ?? []) {
    count += countNodes(child, depth + 1);
    if (count > MAX_NODES) {
      throw new z.ZodError([
        { code: "custom", path: [], message: `Document exceeds ${MAX_NODES} nodes.` },
      ]);
    }
  }
  return count;
}

export function validateLexicalDocument(value: unknown): LexicalDocument {
  const parsed = z.object({ schemaVersion: z.literal(2), blocks: lexicalRootNode }).parse(value);
  countNodes(parsed.blocks, 0);
  return parsed;
}
