import { redirect } from "next/navigation"
import Link from "next/link"

import { getCurrentSession } from "@/lib/auth/current-session"
import { getGlobalPermissions } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeaderContainer } from "@/components/ui/header-container"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function ContentReviewPage() {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.publish")) redirect("/403")

  const versions = await prisma.lessonVersion.findMany({
    where: { reviewStatus: "PENDING" },
    include: { lesson: { include: { module: { include: { course: { include: { track: true } } } } } } },
    orderBy: { lesson: { order: "asc" } },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <HeaderContainer>
        <h1 className="text-2xl font-bold tracking-tight">Manual review queue</h1>
      </HeaderContainer>
      <Card>
        <CardHeader>
          <CardTitle>Pending review ({versions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing pending review.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>{version.lesson.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{version.lesson.module.course.track.title}</TableCell>
                    <TableCell><Badge variant="outline">{version.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Link href={`/content/lesson-versions/${version.id}`}>
                        <Button size="sm" variant="outline">Review</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
