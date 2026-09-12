import assert from "node:assert/strict";
import test from "node:test";

import { parseMarkdown } from "../src/domain/content/markdown.ts";
import { validateContentDocument } from "../src/domain/content/blocks.ts";

test("a realistic lesson markdown file parses into a valid, sanitized document", () => {
  const markdown = `# Lesson 1: Intro

## Section 1: Career Paths
Software engineering is about **solving problems**, not just writing \`code\`.

- Frontend
- Backend
  - Node.js
  - PostgreSQL

\`\`\`html
<!DOCTYPE html>
\`\`\`

| Folder | Description |
|--------|-------------|
| notes/ | Guide |

---

> A tip in a blockquote.

<div>raw html should be dropped</div>
`;

  const parsed = parseMarkdown(markdown);
  const doc = validateContentDocument({ schemaVersion: 1, blocks: parsed.blocks });

  const types = doc.blocks.map((block) => block.type);
  assert.deepEqual(types, ["heading", "paragraph", "list", "code", "table", "divider", "callout"]);
  assert.equal(parsed.warnings.some((w) => w.code === "html.unsupported"), true);
});

test("Learning Objectives sections are captured separately, not imported as a body list", () => {
  const markdown = `# Lesson 1

## 🎯 Learning Objectives
By the end, students will:
- Understand X
- Configure Y

## Section 1
Body text.
`;
  const parsed = parseMarkdown(markdown);
  assert.deepEqual(parsed.objectives, ["Understand X", "Configure Y"]);
  assert.equal(parsed.blocks.some((b) => (b as { type: string }).type === "list"), false);
});
