import { notFound, redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { HeaderContainer } from "@/components/ui/header-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CatalogBreadcrumb } from "@/app/(dashboard)/(features)/content/components/catalog-breadcrumb"
import { ContentTable } from "./components/content-table"
import { NewLessonDialogWrapper } from "./components/new-lesson-dialog-wrapper"
import type { LessonRow } from "./components/columns"

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ trackId: string; courseId: string; moduleId: string }>
}) {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.read")) redirect("/403")

  const { trackId, courseId, moduleId } = await params
  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId, archivedAt: null },
    include: {
      course: { include: { track: true } },
      lessons: {
        where: { archivedAt: null },
        orderBy: { order: "asc" },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      },
    },
  })
  if (!courseModule || courseModule.courseId !== courseId || courseModule.course.trackId !== trackId) notFound()

  const rows: LessonRow[] = courseModule.lessons.map((lesson) => {
    const latest = lesson.versions[0]
    return {
      id: lesson.id,
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes,
      latestVersionId: latest?.id ?? null,
      latestStatus: latest?.status ?? null,
      latestReviewStatus: latest?.reviewStatus ?? null,
    }
  })

  return (
    <>
      <HeaderContainer>
        <div className="flex flex-col gap-1">
          <CatalogBreadcrumb
            items={[
              { label: "Tracks", href: "/content" },
              { label: courseModule.course.track.title, href: `/content/tracks/${trackId}` },
              { label: courseModule.course.title, href: `/content/tracks/${trackId}/courses/${courseId}` },
              { label: courseModule.title },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight">{courseModule.title}</h1>
        </div>
        {permissions.includes("content.edit") && <NewLessonDialogWrapper moduleId={moduleId} />}
      </HeaderContainer>
      <div className="flex-1 overflow-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lessons in this module yet.</p>
            ) : (
              <ContentTable lessons={rows} canEdit={permissions.includes("content.edit")} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
