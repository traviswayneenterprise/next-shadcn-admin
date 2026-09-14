import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validateTiptapDocument, TIPTAP_NODE_TYPES } from "../src/domain/content/tiptap-document.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOCKS_DIR = path.join(__dirname, "..", "src", "components", "editor-tiptap", "blocks");

function minimalDoc(content: unknown[]) {
  return { schemaVersion: 3, blocks: { type: "doc", content } };
}

test("every custom node type declared in src/components/editor-tiptap/blocks/* has a validator branch", () => {
  const typeStrings: string[] = [];
  for (const dir of readdirSync(BLOCKS_DIR)) {
    const file = path.join(BLOCKS_DIR, dir, "node.tsx");
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    // Most blocks declare `name: "literal"` directly in Node.create(); the
    // math block instead shares one factory (createMathNode) parameterized
    // by name, so its call sites are the literal source instead.
    for (const match of content.matchAll(/name:\s*["'`]([^"'`]+)["'`]/g)) {
      typeStrings.push(match[1]);
    }
    for (const match of content.matchAll(/createMathNode\(\s*["'`]([^"'`]+)["'`]/g)) {
      typeStrings.push(match[1]);
    }
  }
  assert.ok(typeStrings.length >= 5, "sanity check: expected to find several custom block type declarations");
  for (const type of typeStrings) {
    assert.ok(
      (TIPTAP_NODE_TYPES as readonly string[]).includes(type),
      `node type "${type}" is declared under src/components/editor-tiptap/blocks/* but has no branch in tiptap-document.ts`,
    );
  }
});

test("a minimal valid v3 document validates", () => {
  const doc = validateTiptapDocument(
    minimalDoc([
      {
        type: "paragraph",
        content: [{ type: "text", text: "Hello", marks: [{ type: "bold" }] }],
      },
    ]),
  );
  assert.equal(doc.schemaVersion, 3);
});

test("an unrecognized node type is rejected", () => {
  assert.throws(() => validateTiptapDocument(minimalDoc([{ type: "notARealType" }])));
});

test("a text node with a javascript: link mark is rejected (ADR 0002)", () => {
  assert.throws(() =>
    validateTiptapDocument(
      minimalDoc([
        {
          type: "paragraph",
          content: [{ type: "text", text: "click me", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }],
        },
      ]),
    ),
  );
});

test("an image node with a data: URL src (the toolbar's insert-image flow) validates", () => {
  const doc = validateTiptapDocument(
    minimalDoc([{ type: "image", attrs: { src: "data:image/png;base64,iVBORw0KGgo=", alt: "x" } }]),
  );
  assert.equal(doc.schemaVersion, 3);
});

test("an image node with a data:image/svg+xml src is rejected", () => {
  assert.throws(() =>
    validateTiptapDocument(
      minimalDoc([{ type: "image", attrs: { src: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", alt: "x" } }]),
    ),
  );
});

test("a columns node with other than 2 children is rejected", () => {
  assert.throws(() =>
    validateTiptapDocument(
      minimalDoc([{ type: "columns", content: [{ type: "column", content: [{ type: "paragraph" }] }] }]),
    ),
  );
});

test("a document past the node-count cap is rejected", () => {
  const content = Array.from({ length: 6000 }, () => ({ type: "paragraph" }));
  assert.throws(() => validateTiptapDocument(minimalDoc(content)));
});
