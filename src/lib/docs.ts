import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const DOCS_ROOT = path.join(process.cwd(), "docs");

export type DocEntry = {
  slug: string[];
  title: string;
};

function titleFromSlug(slug: string[]) {
  const last = slug.at(-1) ?? "";
  return last
    .replace(/\.md$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function walk(dir: string, base: string[] = []): Promise<DocEntry[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: DocEntry[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      results.push(...(await walk(path.join(dir, entry.name), [...base, entry.name])));
    } else if (entry.name.endsWith(".md")) {
      const slug = [...base, entry.name.replace(/\.md$/, "")];
      results.push({ slug, title: titleFromSlug(slug) });
    }
  }
  return results;
}

export async function listDocs(): Promise<DocEntry[]> {
  return walk(DOCS_ROOT);
}

export async function readDoc(slug: string[]): Promise<string | null> {
  // Reject traversal outside docs/ before touching the filesystem.
  if (slug.some((segment) => segment.includes("..") || segment.includes("/") || segment.includes("\\"))) {
    return null;
  }
  const filePath = path.join(DOCS_ROOT, ...slug) + ".md";
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}
