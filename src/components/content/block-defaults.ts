function randomUUID() {
  return crypto.randomUUID();
}

export const BLOCK_TYPES = [
  "heading",
  "paragraph",
  "list",
  "code",
  "callout",
  "image",
  "divider",
  "table",
  "video",
  "file",
  "embed",
  "lab",
  "quiz",
  "assignment",
  "projectBrief",
  "submissionPrompt",
  "reusableSnapshot",
  "columns",
  "tabs",
  "accordion",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

/** Simple block types get a purpose-built form; everything else falls back to raw-JSON editing. */
export const SIMPLE_BLOCK_TYPES: BlockType[] = ["heading", "paragraph", "list", "code", "callout", "image", "divider"];

export function defaultBlockData(type: BlockType): unknown {
  switch (type) {
    case "heading":
      return { level: 2, text: "New heading" };
    case "paragraph":
      return { richText: [{ text: "" }] };
    case "list":
      return { style: "unordered", items: [{ richText: [{ text: "" }] }] };
    case "code":
      return { language: "text", code: "" };
    case "callout":
      return { tone: "info", body: "" };
    case "image":
      return { assetId: "", alt: "" };
    case "divider":
      return {};
    case "table":
      return { headers: [[{ text: "Column 1" }]], rows: [] };
    case "video":
      return { url: "https://" };
    case "file":
      return { assetId: "", label: "File" };
    case "embed":
      return { url: "https://", title: "Embed" };
    case "lab":
      return { assetId: "", title: "Lab", height: 640 };
    case "quiz":
      return { quizId: "" };
    case "assignment":
      return { assignmentId: "" };
    case "projectBrief":
      return { title: "", body: "", links: [] };
    case "submissionPrompt":
      return { assignmentId: "", prompt: "" };
    case "reusableSnapshot":
      return { sourceId: "", sourceVersion: 1, blocks: [] };
    case "columns":
      return { columns: [[], []] };
    case "tabs":
      return { tabs: [{ id: randomUUID(), label: "Tab 1", blocks: [] }] };
    case "accordion":
      return { items: [{ id: randomUUID(), title: "Item 1", blocks: [] }] };
  }
}

export function newBlock(type: BlockType) {
  return { id: randomUUID(), version: 1 as const, type, data: defaultBlockData(type) };
}
