import { z } from "zod";

const id = z.string().min(1).max(100);
const assetReference = z.object({ assetId: id, alt: z.string().max(500).optional() });
const link = z.object({ label: z.string().min(1), href: z.string().url() });

const base = z.object({ id, version: z.literal(1) });

const leafBlocks = [
  base.extend({ type: z.literal("text"), data: z.object({ html: z.string().max(100_000) }) }),
  base.extend({
    type: z.literal("heading"),
    data: z.object({ level: z.number().int().min(2).max(4), text: z.string().min(1).max(500) }),
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
  base.extend({ type: z.literal("video"), data: z.object({ url: z.string().url(), title: z.string().optional() }) }),
  base.extend({ type: z.literal("file"), data: assetReference.extend({ label: z.string().min(1) }) }),
  base.extend({ type: z.literal("divider"), data: z.object({}) }),
  base.extend({ type: z.literal("embed"), data: z.object({ url: z.string().url(), title: z.string().min(1) }) }),
  base.extend({ type: z.literal("lab"), data: z.object({ assetId: id, title: z.string().min(1), height: z.number().int().min(300).max(1200).default(640) }) }),
  base.extend({ type: z.literal("quiz"), data: z.object({ quizId: id }) }),
  base.extend({ type: z.literal("assignment"), data: z.object({ assignmentId: id }) }),
  base.extend({ type: z.literal("projectBrief"), data: z.object({ title: z.string(), body: z.string(), links: z.array(link).default([]) }) }),
  base.extend({ type: z.literal("submissionPrompt"), data: z.object({ assignmentId: id, prompt: z.string() }) }),
  base.extend({ type: z.literal("reusableSnapshot"), data: z.object({ sourceId: id, sourceVersion: z.number().int().positive(), blocks: z.array(z.unknown()) }) }),
] as const;

export const leafBlockSchema = z.discriminatedUnion("type", leafBlocks);

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

export const contentBlockSchema = z.discriminatedUnion("type", [...leafBlocks, ...layoutBlocks]);
export const contentDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  blocks: z.array(contentBlockSchema).max(500),
});

export type ContentDocument = z.infer<typeof contentDocumentSchema>;

export function validateContentDocument(value: unknown): ContentDocument {
  return contentDocumentSchema.parse(value);
}
