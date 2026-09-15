import { notFound, redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { HeaderContainer } from "@/components/ui/header-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CatalogBreadcrumb } from "@/app/(dashboard)/(features)/content/components/catalog-breadcrumb"
import { TrackWorkspace, type CourseRow } from "./components/track-workspace"

export default async function TrackDetailPage({ params }: { params: Promise<{ trackId: string }> }) {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.read")) redirect("/403")

  const { trackId } = await params
  const track = await prisma.track.findUnique({
    where: { id: trackId, archivedAt: null },
    include: {
      courses: {
        where: { archivedAt: null },
        orderBy: { order: "asc" },
        include: { _count: { select: { modules: { where: { archivedAt: null } } } } },
      },
    },
  })
  if (!track) notFound()

  const courses: CourseRow[] = track.courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    status: course.status,
    moduleCount: course._count.modules,
    href: `/content/tracks/${trackId}/courses/${course.id}`,
  }))

  return (
    <>
      <HeaderContainer>
        <div className="flex flex-col gap-1">
          <CatalogBreadcrumb items={[{ label: "Tracks", href: "/content" }, { label: track.title }]} />
          <h1 className="text-2xl font-bold tracking-tight">{track.title}</h1>
        </div>
      </HeaderContainer>
      <div className="flex-1 overflow-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackWorkspace trackId={trackId} courses={courses} canEdit={permissions.includes("content.edit")} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
