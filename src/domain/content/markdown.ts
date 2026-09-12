import { remark } from "remark";
import remarkGfm from "remark-gfm";
import type { Root, RootContent, PhrasingContent, ListItem } from "mdast";

const processor = remark().use(remarkGfm);

export type ParseWarning = { code: string; message: string };
export type ParsedMarkdown = { blocks: unknown[]; warnings: ParseWarning[]; objectives: string[] | null };

function newId() {
  return crypto.randomUUID();
}

// parseMarkdown() runs fully synchronously per call (no awaits), so a
// module-level sink for warnings raised deep inside the recursive rich-text
// helpers below is safe - it's reset at the start of every call and never
// interleaves between calls.
let currentWarnings: ParseWarning[] = [];

function isAbsoluteUrl(value: string) {
  return /^(https?:|mailto:)/i.test(value);
}

function flattenPlainText(nodes: PhrasingContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value;
      if (node.type === "inlineCode") return node.value;
      if (node.type === "break") return "\n";
      if ("children" in node) return flattenPlainText(node.children as PhrasingContent[]);
      return "";
    })
    .join("");
}

function toRichText(nodes: PhrasingContent[], marks: string[] = []): unknown[] {
  const spans: unknown[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        if (node.value) spans.push(marks.length ? { text: node.value, marks } : { text: node.value });
        break;
      case "inlineCode":
        spans.push({ text: node.value, marks: [...marks, "code"].slice(0, 3) });
        break;
      case "break":
        spans.push({ text: "\n" });
        break;
      case "strong":
        spans.push(...toRichText(node.children, [...marks, "bold"]));
        break;
      case "emphasis":
        spans.push(...toRichText(node.children, [...marks, "italic"]));
        break;
      case "link":
        // Source content frequently cross-references sibling files with a
        // relative path (e.g. "../examples/foo.js"), which isn't a URL the
        // block schema (or a learner's browser) can resolve. Demoted to
        // plain text rather than failing the whole document's validation.
        if (isAbsoluteUrl(node.url)) {
          spans.push({ type: "link", href: node.url, children: toRichText(node.children, marks) });
        } else {
          currentWarnings.push({ code: "link.relative", message: `Relative link target "${node.url}" was kept as plain text (not a resolvable URL).` });
          spans.push(...toRichText(node.children, marks));
        }
        break;
      case "image":
        // Inline images reference external URLs, not uploaded R2 assets; not
        // supported inline (the block schema's `image` block needs a real
        // assetId). Represented as a visible placeholder rather than dropped.
        spans.push({ text: `[image: ${node.alt ?? node.url}]` });
        break;
      default:
        if ("children" in node) spans.push(...toRichText(node.children as PhrasingContent[], marks));
    }
  }
  return spans.length > 0 ? spans : [{ text: "" }];
}

function listItemRichText(item: ListItem): unknown[] {
  const firstParagraph = item.children.find((child) => child.type === "paragraph");
  if (firstParagraph && firstParagraph.type === "paragraph") return toRichText(firstParagraph.children);
  return [{ text: "" }];
}

export function parseMarkdown(source: string): ParsedMarkdown {
  // CRLF source files (this curriculum repo's line endings) otherwise leak
  // \r into code-block and text content verbatim.
  const markdown = source.replace(/\r\n/g, "\n");
  const tree = processor.parse(markdown) as Root;
  const blocks: unknown[] = [];
  const warnings: ParseWarning[] = [];
  currentWarnings = warnings;
  let objectives: string[] | null = null;

  function pushHeading(depth: number, children: PhrasingContent[]) {
    if (depth <= 1) return; // h1 is the lesson title, already captured elsewhere.
    const level = Math.min(depth, 4);
    blocks.push({ id: newId(), version: 1, type: "heading", data: { level, text: flattenPlainText(children).trim() || "Untitled section" } });
  }

  for (let i = 0; i < tree.children.length; i++) {
    const node: RootContent = tree.children[i];
    switch (node.type) {
      case "heading": {
        const text = flattenPlainText(node.children).trim();
        // "## 🎯 Learning Objectives" (or similar) is followed by a
        // bullet list in every source README - capture it structurally
        // instead of importing it as another body block.
        if (/objectives/i.test(text)) {
          // The list is usually preceded by a lead-in paragraph ("By the end,
          // students will:") - scan past any paragraphs to find it, pushing
          // those lead-in paragraphs as normal body content along the way.
          let j = i + 1;
          const leadIn: RootContent[] = [];
          while (j < tree.children.length && tree.children[j].type === "paragraph") {
            leadIn.push(tree.children[j]);
            j += 1;
          }
          const candidate = tree.children[j];
          if (candidate && candidate.type === "list") {
            for (const paragraph of leadIn) {
              if (paragraph.type === "paragraph") blocks.push({ id: newId(), version: 1, type: "paragraph", data: { richText: toRichText(paragraph.children) } });
            }
            objectives = candidate.children.map((item) => {
              const paragraph = item.children.find((child) => child.type === "paragraph");
              return paragraph && paragraph.type === "paragraph" ? flattenPlainText(paragraph.children).trim() : "";
            }).filter(Boolean);
            i = j; // consume the list (and any lead-in paragraphs), don't also import the list as a body block.
            continue;
          }
        }
        pushHeading(node.depth, node.children);
        break;
      }
      case "paragraph":
        blocks.push({ id: newId(), version: 1, type: "paragraph", data: { richText: toRichText(node.children) } });
        break;
      case "list": {
        const items = node.children.map((item) => {
          const richText = listItemRichText(item);
          const nestedList = item.children.find((child) => child.type === "list");
          const children = nestedList && nestedList.type === "list"
            ? nestedList.children.map((sub) => ({ richText: listItemRichText(sub) })).slice(0, 20)
            : undefined;
          if (nestedList && nestedList.type === "list" && nestedList.children.length > 20) {
            warnings.push({ code: "list.truncated", message: "A nested list had more than 20 items; extra items were dropped." });
          }
          return children ? { richText, children } : { richText };
        }).slice(0, 100);
        blocks.push({ id: newId(), version: 1, type: "list", data: { style: node.ordered ? "ordered" : "unordered", items } });
        break;
      }
      case "code":
        blocks.push({ id: newId(), version: 1, type: "code", data: { language: node.lang || "text", code: node.value } });
        break;
      case "table": {
        const [headerRow, ...bodyRows] = node.children;
        blocks.push({
          id: newId(),
          version: 1,
          type: "table",
          data: {
            headers: (headerRow?.children ?? []).map((cell) => toRichText(cell.children)),
            rows: bodyRows.map((row) => row.children.map((cell) => toRichText(cell.children))),
          },
        });
        break;
      }
      case "thematicBreak":
        blocks.push({ id: newId(), version: 1, type: "divider", data: {} });
        break;
      case "blockquote": {
        const text = node.children
          .filter((child) => child.type === "paragraph")
          .map((paragraph) => flattenPlainText(paragraph.children))
          .join("\n")
          .trim();
        blocks.push({ id: newId(), version: 1, type: "callout", data: { tone: "info", body: text } });
        break;
      }
      case "html":
        warnings.push({ code: "html.unsupported", message: "Raw HTML in source markdown is never imported as trusted content." });
        break;
      default:
        warnings.push({ code: "node.unsupported", message: `Unsupported markdown node type: ${node.type}` });
    }
  }

  return { blocks, warnings, objectives };
}
