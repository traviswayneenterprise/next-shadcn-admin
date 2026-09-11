import { readDoc } from "@/lib/docs";
import DocPage from "./[...slug]/page";

export default async function DocsIndexPage() {
  const hasReadme = (await readDoc(["README"])) !== null;
  if (hasReadme) {
    return <DocPage params={Promise.resolve({ slug: ["README"] })} />;
  }
  return (
    <p className="text-sm text-muted-foreground">
      Select a document from the list to view it.
    </p>
  );
}
