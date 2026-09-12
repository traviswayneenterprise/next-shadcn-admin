import { notFound, redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { HeaderContainer } from "@/components/ui/header-container"
import { LessonEditor } from "@/components/content/lesson-editor"

export default async function LessonVersionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.edit")) redirect("/403")

  const { id } = await params
  const version = await prisma.lessonVersion.findUnique({
    where: { id },
    include: { document: true, lesson: true },
  })
  if (!version) notFound()

  return (
    <div className="space-y-4">
      <HeaderContainer>
        <h1 className="text-2xl font-bold tracking-tight">{version.lesson.title}</h1>
      </HeaderContainer>
      <LessonEditor
        versionId={version.id}
        status={version.status}
        reviewStatus={version.reviewStatus}
        initialBlocks={version.document.blocks}
        canPublish={permissions.includes("content.publish")}
      />
    </div>
  )
}
