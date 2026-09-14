import { notFound, redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { HeaderContainer } from "@/components/ui/header-container"
import { EditorSwitcher } from "@/components/content/editor-switcher"
import { EditorTiptapClient } from "@/components/content/editor-tiptap-client"
import { LessonVersionSidePanel } from "@/components/content/lesson-version-side-panel"

export default async function LessonVersionEditorTiptapPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.edit")) redirect("/403")

  const { id } = await params
  const version = await prisma.lessonVersion.findUnique({
    where: { id },
    include: { lesson: true, documentV3: true },
  })
  if (!version) notFound()

  // Published versions are immutable - editor-tiptap only ever edits
  // drafts, exactly like the classic and editor-x pages.
  if (version.status !== "DRAFT") {
    redirect(`/content/lesson-versions/${version.id}`)
  }

  // Tiptap has its own independent slot (documentV3). No v1/v2 -> v3
  // migration exists (see the trial plan), so a draft that's never been
  // saved in this editor just starts blank here - and, since slots are
  // independent now, saving can never touch v1/v2's content either way.
  const initialContent = version.documentV3 ? (version.documentV3.blocks as Record<string, unknown>) : null

  return (
    <>
      <HeaderContainer>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{version.lesson.title}</h1>
          <Badge variant="secondary">Editor Tiptap preview</Badge>
        </div>
        <EditorSwitcher versionId={version.id} active="editor-tiptap" activeSchemaVersion={version.activeSchemaVersion} />
      </HeaderContainer>
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <EditorTiptapClient versionId={version.id} initialContent={initialContent} />
      </div>
      <LessonVersionSidePanel lessonVersionId={version.id} />
    </>
  )
}
