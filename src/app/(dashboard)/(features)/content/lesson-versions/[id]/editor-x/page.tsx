import { notFound, redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { validateContentDocument } from "@/domain/content/blocks"
import { migrateDocumentToLexical } from "@/domain/content/migrate-to-lexical"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { HeaderContainer } from "@/components/ui/header-container"
import { EditorSwitcher } from "@/components/content/editor-switcher"
import { EditorXClient } from "@/components/content/editor-x-client"
import { LessonVersionSidePanel } from "@/components/content/lesson-version-side-panel"

export default async function LessonVersionEditorXPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.edit")) redirect("/403")

  const { id } = await params
  const version = await prisma.lessonVersion.findUnique({
    where: { id },
    include: { lesson: true, documentV1: true, documentV2: true },
  })
  if (!version) notFound()

  // Published versions are immutable - editor-x only ever edits drafts,
  // exactly like the v1 editor.
  if (version.status !== "DRAFT") {
    redirect(`/content/lesson-versions/${version.id}`)
  }

  // Editor X has its own independent slot (documentV2) - if it's never
  // been saved in yet, start from a one-time copy of the classic content
  // as a convenient starting point (migrate-to-lexical.ts). Since v1 and
  // v2 are now separate slots, this is purely a head start - saving here
  // can never touch or lose the original v1 content.
  const initialState: Record<string, unknown> = version.documentV2
    ? (version.documentV2.blocks as Record<string, unknown>)
    : await migrateDocumentToLexical(
        validateContentDocument({ schemaVersion: 1, blocks: version.documentV1.blocks }),
      )

  return (
    <>
      <HeaderContainer>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{version.lesson.title}</h1>
          <Badge variant="secondary">Editor X preview</Badge>
          {!version.documentV2 && <Badge variant="outline">Started from a copy of the Classic content</Badge>}
        </div>
        <EditorSwitcher versionId={version.id} active="editor-x" activeSchemaVersion={version.activeSchemaVersion} />
      </HeaderContainer>
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <EditorXClient versionId={version.id} initialState={initialState} />
      </div>
      <LessonVersionSidePanel lessonVersionId={version.id} />
    </>
  )
}
