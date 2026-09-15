import type { ContentDocument } from "@/domain/content/blocks";
import { assetPublicUrl } from "@/domain/content/assets";
import { prisma } from "@/lib/db";

type V1Block = ContentDocument["blocks"][number];
type RichTextSpan = { text: string; marks?: string[] } | { type: "link"; href: string; children: { text: string; marks?: string[] }[] };

function textNode(text: string, marks: string[] = []) {
  let format = 0;
  if (marks.includes("bold")) format |= 1;
  if (marks.includes("italic")) format |= 2;
  if (marks.includes("code")) format |= 16;
  return { type: "text", version: 1, text, format, detail: 0, mode: "normal", style: "" };
}

function isLinkSpan(span: RichTextSpan): span is Extract<RichTextSpan, { type: "link" }> {
  return "type" in span && span.type === "link";
}

function richTextToNodes(richText: RichTextSpan[] | undefined): unknown[] {
  if (!richText || richText.length === 0) return [];
  return richText.map((span) => {
    if (isLinkSpan(span)) {
      return {
        type: "link",
        version: 1,
        url: span.href,
        target: null,
        rel: null,
        title: null,
        format: "",
        indent: 0,
        direction: "ltr",
        children: span.children.map((child) => textNode(child.text, child.marks)),
      };
    }
    return textNode(span.text, span.marks);
  });
}

function paragraphNode(children: unknown[]) {
  return { type: "paragraph", version: 1, format: "", indent: 0, direction: "ltr", children };
}

/**
 * Maps a single v1 content block to its schemaVersion-2 (Lexical) node-JSON
 * equivalent. Only the block types actually used across real lessons are
 * covered - heading, paragraph, list, table, code, callout, image,
 * divider. Anything else is dropped with a warning comment node (a visible
 * paragraph explaining what was lost) rather than either silently
 * discarding content or throwing and blocking the whole migration.
 *
 * This only ever runs in memory when a staff member opens an existing v1
 * DRAFT in editor-x - never in bulk, never against a PUBLISHED version.
 * Nothing is persisted here; the result is just fed to the editor as its
 * initial state, and only becomes the stored document on the next save
 * (see updateDraftDocument in documents.ts).
 */
export async function migrateBlockToLexical(block: V1Block): Promise<unknown> {
  switch (block.type) {
    case "paragraph":
      return paragraphNode(richTextToNodes(block.data.richText as RichTextSpan[]));

    case "heading": {
      const tag = `h${block.data.level}` as "h2" | "h3" | "h4";
      return {
        type: "heading",
        version: 1,
        tag,
        format: "",
        indent: 0,
        direction: "ltr",
        children: [textNode(block.data.text)],
      };
    }

    case "list": {
      const listType = block.data.style === "ordered" ? "number" : "bullet";
      const tag = block.data.style === "ordered" ? "ol" : "ul";
      return {
        type: "list",
        version: 1,
        listType,
        start: 1,
        tag,
        format: "",
        indent: 0,
        direction: "ltr",
        children: block.data.items.map((item) => {
          const childItems = item.children?.length
            ? item.children.map((sub) => ({
                type: "listitem",
                version: 1,
                value: 1,
                format: "",
                indent: 1,
                direction: "ltr",
                children: richTextToNodes(sub.richText as RichTextSpan[]),
              }))
            : [];
          return {
            type: "listitem",
            version: 1,
            value: 1,
            format: "",
            indent: 0,
            direction: "ltr",
            children: [...richTextToNodes(item.richText as RichTextSpan[]), ...childItems],
          };
        }),
      };
    }

    case "table": {
      const headerRow = {
        type: "tablerow",
        version: 1,
        children: block.data.headers.map((cellRichText) => ({
          type: "tablecell",
          version: 1,
          headerState: 1,
          colSpan: 1,
          rowSpan: 1,
          width: null,
          backgroundColor: null,
          children: [paragraphNode(richTextToNodes(cellRichText as RichTextSpan[]))],
        })),
      };
      const bodyRows = block.data.rows.map((row) => ({
        type: "tablerow",
        version: 1,
        children: row.map((cellRichText) => ({
          type: "tablecell",
          version: 1,
          headerState: 0,
          colSpan: 1,
          rowSpan: 1,
          width: null,
          backgroundColor: null,
          children: [paragraphNode(richTextToNodes(cellRichText as RichTextSpan[]))],
        })),
      }));
      return { type: "table", version: 1, format: "", indent: 0, direction: "ltr", children: [headerRow, ...bodyRows] };
    }

    case "code":
      return {
        type: "code",
        version: 1,
        language: block.data.language,
        format: "",
        indent: 0,
        direction: "ltr",
        children: [{ type: "text", version: 1, text: block.data.code, format: 0, detail: 0, mode: "normal", style: "" }],
      };

    case "callout": {
      // No dedicated "callout" node is registered - a quote is the closest
      // safe, already-allowed semantic equivalent. The tone label is kept
      // as a bold lead-in so the distinction isn't silently lost.
      const lead = textNode(`[${block.data.tone.toUpperCase()}]${block.data.title ? " " + block.data.title : ""} `, ["bold"]);
      return {
        type: "quote",
        version: 1,
        format: "",
        indent: 0,
        direction: "ltr",
        children: [paragraphNode([lead, textNode(block.data.body)])],
      };
    }

    case "image": {
      const asset = await prisma.asset.findUnique({ where: { id: block.data.assetId } });
      if (!asset) {
        return paragraphNode([textNode(`[Missing image asset: ${block.data.assetId}]`)]);
      }
      return {
        type: "image",
        version: 1,
        altText: block.data.alt ?? "",
        src: assetPublicUrl(asset.key),
        maxWidth: 800,
      };
    }

    case "divider":
      return { type: "horizontalrule", version: 1 };

    default:
      return paragraphNode([textNode(`[Block type "${block.type}" was not carried over by the Editor X migration - re-add it manually.]`, ["italic"])]);
  }
}

export async function migrateDocumentToLexical(document: ContentDocument): Promise<{ type: "root"; version: 1; format: ""; indent: 0; direction: "ltr"; children: unknown[] }> {
  const children: unknown[] = [];
  for (const block of document.blocks) {
    children.push(await migrateBlockToLexical(block));
  }
  // Lexical's root node must always have at least one child - setEditorState
  // throws "the editor state is empty" otherwise. A v1 document with zero
  // blocks (any brand-new draft, or an empty v1 slot) is a real, valid case
  // now that v1/v2/v3 are independent slots (see documents.ts) - represent
  // it as a single empty paragraph, exactly what a blank editor looks like.
  if (children.length === 0) {
    children.push(paragraphNode([]));
  }
  return { type: "root", version: 1, format: "", indent: 0, direction: "ltr", children };
}
