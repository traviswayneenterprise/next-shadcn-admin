import { z } from "zod";

const id = z.string().min(1).max(100);
const assetReference = z.object({ assetId: id, alt: z.string().max(500).optional() });

// z.string().url() alone accepts javascript:, data:, and vbscript: URIs -
// all valid WHATWG URLs, all trivial stored-XSS if ever rendered into an
// href. Every URL a renderer turns into a real href/src goes through one of
// these two scheme allowlists instead of the bare .url() check.
function schemeAllowedUrl(schemes: readonly string[]) {
  return z.string().url().refine((value) => {
    try {
      return schemes.includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "URL scheme is not allowed.");
}
const linkHref = schemeAllowedUrl(["http:", "https:", "mailto:"]);
const httpUrl = schemeAllowedUrl(["http:", "https:"]);

const link = z.object({ label: z.string().min(1), href: linkHref });

// ADR 0002 forbids admin-provided arbitrary HTML: rich text is a bounded,
// validated span tree, never a stored/trusted HTML string. Renderers turn
// this into React elements directly - no dangerouslySetInnerHTML anywhere
// in the lesson-rendering path.
const textMark = z.enum(["bold", "italic", "code"]);
const textSpan = z.object({ text: z.string().max(2000), marks: z.array(textMark).max(3).optional() });
const linkSpan = z.object({ type: z.literal("link"), href: linkHref, children: z.array(textSpan).min(1).max(50) });
const richText = z.array(z.union([textSpan, linkSpan])).max(200);

const base = z.object({ id, version: z.literal(1) });

const leafBlocks = [
  base.extend({ type: z.literal("paragraph"), data: z.object({ richText }) }),
  base.extend({
    type: z.literal("heading"),
    data: z.object({ level: z.number().int().min(2).max(4), text: z.string().min(1).max(500) }),
  }),
  base.extend({
    type: z.literal("list"),
    data: z.object({
      style: z.enum(["ordered", "unordered"]),
      // Bounded, non-recursive nesting (one sub-level) - matches the layout
      // blocks' "bounded nesting" rule rather than an unbounded recursive tree.
      items: z.array(z.object({ richText, children: z.array(z.object({ richText })).max(20).optional() })).max(100),
    }),
  }),
  base.extend({
    type: z.literal("table"),
    data: z.object({
      headers: z.array(richText).max(20),
      rows: z.array(z.array(richText).max(20)).max(100),
    }),
  }),
  base.extend({
    type: z.literal("callout"),
    data: z.object({ tone: z.enum(["info", "success", "warning", "danger"]), title: z.string().optional(), body: z.string() }),
  }),
  base.extend({
    type: z.literal("code"),
    data: z.object({ language: z.string().max(50), code: z.string().max(100_000), filename: z.string().max(255).optional() }),
  }),
  base.extend({ type: z.literal("image"), data: assetReference }),
  base.extend({ type: z.literal("video"), data: z.object({ url: httpUrl, title: z.string().optional() }) }),
  base.extend({ type: z.literal("file"), data: assetReference.extend({ label: z.string().min(1) }) }),
  base.extend({ type: z.literal("divider"), data: z.object({}) }),
  base.extend({ type: z.literal("embed"), data: z.object({ url: httpUrl, title: z.string().min(1) }) }),
  base.extend({ type: z.literal("lab"), data: z.object({ assetId: id, title: z.string().min(1), height: z.number().int().min(300).max(1200).default(640) }) }),
  base.extend({ type: z.literal("quiz"), data: z.object({ quizId: id }) }),
  base.extend({ type: z.literal("assignment"), data: z.object({ assignmentId: id }) }),
  base.extend({ type: z.literal("projectBrief"), data: z.object({ title: z.string(), body: z.string(), links: z.array(link).default([]) }) }),
  base.extend({ type: z.literal("submissionPrompt"), data: z.object({ assignmentId: id, prompt: z.string() }) }),
] as const;

// A reusable-block snapshot is fully-resolved content, captured at publish
// time - it can never itself contain another reusable-block reference (that
// would defeat "snapshots, not live references"). So it validates against
// the leaf blocks above, defined separately to avoid a self-referential
// schema rather than falling back to z.unknown() (which validated nothing).
const snapshotSchema = z.discriminatedUnion("type", leafBlocks);
const reusableSnapshotBlock = base.extend({
  type: z.literal("reusableSnapshot"),
  data: z.object({ sourceId: id, sourceVersion: z.number().int().positive(), blocks: z.array(snapshotSchema).max(200) }),
});

const allLeafBlocks = [...leafBlocks, reusableSnapshotBlock] as const;
export const leafBlockSchema = z.discriminatedUnion("type", allLeafBlocks);

const childLeafBlocks = z.array(leafBlockSchema).max(100);
const layoutBlocks = [
  base.extend({ type: z.literal("columns"), data: z.object({ columns: z.array(childLeafBlocks).min(2).max(4) }) }),
  base.extend({
    type: z.literal("tabs"),
    data: z.object({ tabs: z.array(z.object({ id, label: z.string().min(1), blocks: childLeafBlocks })).min(1).max(12) }),
  }),
  base.extend({
    type: z.literal("accordion"),
    data: z.object({ items: z.array(z.object({ id, title: z.string().min(1), blocks: childLeafBlocks })).min(1).max(30) }),
  }),
] as const;

export const contentBlockSchema = z.discriminatedUnion("type", [...allLeafBlocks, ...layoutBlocks]);
export const contentDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  blocks: z.array(contentBlockSchema).max(500),
});

export type ContentDocument = z.infer<typeof contentDocumentSchema>;

export function validateContentDocument(value: unknown): ContentDocument {
  return contentDocumentSchema.parse(value);
}
