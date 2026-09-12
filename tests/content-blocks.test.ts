import assert from "node:assert/strict";
import test from "node:test";
import { validateContentDocument } from "../src/domain/content/blocks.ts";

test("a realistic lesson document validates", () => {
  const doc = validateContentDocument({
    schemaVersion: 1,
    blocks: [
      { id: "b1", version: 1, type: "heading", data: { level: 2, text: "Section 1" } },
      { id: "b2", version: 1, type: "paragraph", data: { richText: [{ text: "Software engineering is about " }, { text: "solving problems", marks: ["bold"] }, { text: "." }] } },
      { id: "b3", version: 1, type: "list", data: { style: "unordered", items: [{ richText: [{ text: "Frontend" }] }, { richText: [{ text: "Backend" }], children: [{ richText: [{ text: "Node.js" }] }] }] } },
      { id: "b4", version: 1, type: "code", data: { language: "html", code: "<!DOCTYPE html>" } },
      { id: "b5", version: 1, type: "table", data: { headers: [[{ text: "Folder" }], [{ text: "Description" }]], rows: [[[{ text: "notes/" }], [{ text: "Guide" }]]] } },
      { id: "b6", version: 1, type: "lab", data: { assetId: "asset_1", title: "HTML Simulator" } },
      { id: "b7", version: 1, type: "reusableSnapshot", data: { sourceId: "rb_1", sourceVersion: 1, blocks: [{ id: "b8", version: 1, type: "callout", data: { tone: "info", body: "Tip" } }] } },
    ],
  });
  assert.equal(doc.blocks.length, 7);
});

test("a raw HTML text block is rejected (ADR 0002)", () => {
  assert.throws(() => validateContentDocument({ schemaVersion: 1, blocks: [{ id: "b1", version: 1, type: "text", data: { html: "<script>alert(1)</script>" } }] }));
});

test("a reusableSnapshot cannot smuggle an unregistered block type", () => {
  assert.throws(() => validateContentDocument({
    schemaVersion: 1,
    blocks: [{ id: "b1", version: 1, type: "reusableSnapshot", data: { sourceId: "rb_1", sourceVersion: 1, blocks: [{ id: "b2", version: 1, type: "notARealType", data: {} }] } }],
  }));
});
