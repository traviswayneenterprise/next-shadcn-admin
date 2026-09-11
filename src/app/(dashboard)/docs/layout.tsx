import Link from "next/link";

import { listDocs } from "@/lib/docs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = await listDocs();

  return (
    <div className="flex h-full min-h-0 flex-1">
      <ScrollArea className="w-64 shrink-0 border-r p-4">
        <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
          Project docs
        </p>
        <nav className="flex flex-col gap-0.5">
          {docs.map((doc) => (
            <Link
              key={doc.slug.join("/")}
              href={`/docs/${doc.slug.join("/")}`}
              className="truncate rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              title={doc.slug.join("/")}
            >
              {doc.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <ScrollArea className="flex-1 p-8">{children}</ScrollArea>
    </div>
  );
}
