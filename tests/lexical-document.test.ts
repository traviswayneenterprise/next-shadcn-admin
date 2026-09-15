import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validateLexicalDocument, LMS_CUSTOM_NODE_TYPES } from "../src/domain/content/lexical-document.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODES_DIR = path.join(__dirname, "..", "src", "components", "editor", "nodes");

function minimalDoc(rootChildren: unknown[]) {
  return {
    schemaVersion: 2,
    blocks: { type: "root", version: 1, format: "", direction: "ltr", children: rootChildren },
  };
}

test("every custom node type declared in src/components/editor/nodes/* has a validator branch", () => {
  const typeStrings: string[] = [];
  for (const file of readdirSync(NODES_DIR)) {
    if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
    const content = readFileSync(path.join(NODES_DIR, file), "utf8");
    for (const match of content.matchAll(/this\.config\(\s*["'`]([^"'`]+)["'`]/g)) {
      typeStrings.push(match[1]);
    }
  }
  assert.ok(typeStrings.length > 10, "sanity check: expected to find several node type declarations");
  for (const type of typeStrings) {
    assert.ok(
      (LMS_CUSTOM_NODE_TYPES as readonly string[]).includes(type),
      `node type "${type}" is declared in src/components/editor/nodes/${"*"} but has no branch in lexical-document.ts`,
    );
  }
});

test("a minimal valid v2 document validates", () => {
  const doc = validateLexicalDocument(
    minimalDoc([
      {
        type: "paragraph",
        version: 1,
        format: "",
        direction: "ltr",
        children: [{ type: "text", version: 1, text: "Hello", format: 0, detail: 0, mode: "normal", style: "" }],
      },
    ]),
  );
  assert.equal(doc.schemaVersion, 2);
});

test("an unrecognized node type is rejected", () => {
  assert.throws(() => validateLexicalDocument(minimalDoc([{ type: "notARealType", version: 1 }])));
});

test("a link node with a javascript: URL is rejected (ADR 0002)", () => {
  assert.throws(() =>
    validateLexicalDocument(
      minimalDoc([
        {
          type: "link",
          version: 1,
          url: "javascript:alert(1)",
          format: "",
          direction: "ltr",
          children: [{ type: "text", version: 1, text: "click me", format: 0, detail: 0, mode: "normal", style: "" }],
        },
      ]),
    ),
  );
});

test("an image node with a javascript: src is rejected", () => {
  assert.throws(() =>
    validateLexicalDocument(
      minimalDoc([{ type: "image", version: 1, src: "javascript:alert(1)", altText: "x", maxWidth: 500 }]),
    ),
  );
});

test("an image node with a data: URL src (the editor's own insert-image flow) validates", () => {
  const doc = validateLexicalDocument(
    minimalDoc([
      { type: "image", version: 1, src: "data:image/png;base64,iVBORw0KGgo=", altText: "x", maxWidth: 500 },
    ]),
  );
  assert.equal(doc.schemaVersion, 2);
});

test("an image node with a data:image/svg+xml src is rejected", () => {
  assert.throws(() =>
    validateLexicalDocument(
      minimalDoc([
        { type: "image", version: 1, src: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", altText: "x", maxWidth: 500 },
      ]),
    ),
  );
});

test("an embed node with a non-token id is rejected", () => {
  assert.throws(() =>
    validateLexicalDocument(
      minimalDoc([{ type: "youtube", version: 1, videoID: "https://evil.example/x", format: "", direction: "ltr", children: [] }]),
    ),
  );
});

test("a document past the node-count cap is rejected", () => {
  const children = Array.from({ length: 6000 }, () => ({
    type: "paragraph",
    version: 1,
    format: "",
    direction: "ltr",
    children: [],
  }));
  assert.throws(() => validateLexicalDocument(minimalDoc(children)));
});
