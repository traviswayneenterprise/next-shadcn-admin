import { notFound } from "next/navigation";
import { marked } from "marked";

import { readDoc } from "@/lib/docs";

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const content = await readDoc(slug);
  if (content === null) notFound();

  const html = await marked.parse(content);

  return (
    <article
      className={[
        "max-w-3xl text-sm leading-relaxed",
        "[&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold",
        "[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold",
        "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_p]:mb-3",
        "[&_ul]:mb-3 [&_ul]:ml-5 [&_ul]:list-disc",
        "[&_ol]:mb-3 [&_ol]:ml-5 [&_ol]:list-decimal",
        "[&_li]:mb-1",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
        "[&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4",
        "[&_table]:mb-3 [&_table]:w-full [&_table]:border-collapse",
        "[&_th]:border [&_th]:p-2 [&_th]:text-left [&_th]:font-medium",
        "[&_td]:border [&_td]:p-2",
        "[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
