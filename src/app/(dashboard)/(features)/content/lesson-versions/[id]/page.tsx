import { notFound, redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { HeaderContainer } from "@/components/ui/header-container"
import { EditorSwitcher } from "@/components/content/editor-switcher"
import { LessonEditor } from "@/components/content/lesson-editor"
import { LessonVersionSidePanel } from "@/components/content/lesson-version-side-panel"

export default async function LessonVersionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.edit")) redirect("/403")

  const { id } = await params
  const version = await prisma.lessonVersion.findUnique({
    where: { id },
    include: { documentV1: true, lesson: true },
  })
  if (!version) notFound()

  return (
    <>
      <HeaderContainer>
        <h1 className="text-2xl font-bold tracking-tight">{version.lesson.title}</h1>
        <EditorSwitcher versionId={version.id} active="classic" activeSchemaVersion={version.activeSchemaVersion} />
      </HeaderContainer>
      <div className="flex-1 overflow-auto space-y-4">
        <LessonEditor
          versionId={version.id}
          status={version.status}
          reviewStatus={version.reviewStatus}
          initialBlocks={version.documentV1.blocks}
          canPublish={permissions.includes("content.publish")}
        />
        <LessonVersionSidePanel lessonVersionId={version.id} />
      </div>
    </>
  )
}
