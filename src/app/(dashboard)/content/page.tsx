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
import { createDraftVersionAction } from "./actions"

export default async function ContentPage() {
  const session = await getCurrentSession()
  if (!session) redirect("/auth/sign-in")
  const permissions = await getGlobalPermissions(session.userId)
  if (!permissions.includes("content.read")) redirect("/403")

  const lessons = await prisma.lesson.findMany({
    orderBy: [{ module: { course: { track: { title: "asc" } } } }, { order: "asc" }],
    include: {
      module: { include: { course: { include: { track: true } } } },
      versions: { orderBy: { version: "desc" }, take: 1 },
    },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <HeaderContainer>
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
      </HeaderContainer>
      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No lessons yet. The curriculum importer (Wednesday) populates these from source folders.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Track / Course / Module</TableHead>
                  <TableHead>Latest version</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => {
                  const latest = lesson.versions[0]
                  return (
                    <TableRow key={lesson.id}>
                      <TableCell>{lesson.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lesson.module.course.track.title} / {lesson.module.course.title} / {lesson.module.title}
                      </TableCell>
                      <TableCell>
                        {latest ? <Badge variant="outline">{latest.status}</Badge> : <span className="text-xs text-muted-foreground">none</span>}
                      </TableCell>
                      <TableCell>
                        {latest ? <Badge variant="secondary">{latest.reviewStatus}</Badge> : null}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {latest && (
                          <Link href={`/content/lesson-versions/${latest.id}`}>
                            <Button size="sm" variant="outline">Open</Button>
                          </Link>
                        )}
                        {permissions.includes("content.edit") && (
                          <form action={createDraftVersionAction} className="inline">
                            <input type="hidden" name="lessonId" value={lesson.id} />
                            <input type="hidden" name="forkFromVersionId" value={latest?.id ?? ""} />
                            <Button size="sm" type="submit">New draft</Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
