import { notFound, redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { HeaderContainer } from "@/components/ui/header-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CatalogBreadcrumb } from "@/app/(dashboard)/(features)/content/components/catalog-breadcrumb"
import { CourseWorkspace, type ModuleRow } from "./components/course-workspace"

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ trackId: string; courseId: string }>
}) {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.read")) redirect("/403")

  const { trackId, courseId } = await params
  const course = await prisma.course.findUnique({
    where: { id: courseId, archivedAt: null },
    include: {
      track: true,
      modules: {
        where: { archivedAt: null },
        orderBy: { order: "asc" },
        include: { _count: { select: { lessons: { where: { archivedAt: null } } } } },
      },
    },
  })
  if (!course || course.trackId !== trackId) notFound()

  const modules: ModuleRow[] = course.modules.map((courseModule) => ({
    id: courseModule.id,
    title: courseModule.title,
    description: courseModule.description,
    status: courseModule.status,
    lessonCount: courseModule._count.lessons,
    href: `/content/tracks/${trackId}/courses/${courseId}/modules/${courseModule.id}`,
  }))

  return (
    <>
      <HeaderContainer>
        <div className="flex flex-col gap-1">
          <CatalogBreadcrumb
            items={[
              { label: "Tracks", href: "/content" },
              { label: course.track.title, href: `/content/tracks/${trackId}` },
              { label: course.title },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
        </div>
      </HeaderContainer>
      <div className="flex-1 overflow-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseWorkspace trackId={trackId} courseId={courseId} modules={modules} canEdit={permissions.includes("content.edit")} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
