import { apiError, apiSuccess } from "@/lib/api/response";
import { getCurrentSession } from "@/lib/auth/current-session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const session = await getCurrentSession();
  if (!session) return apiError(401, "UNAUTHENTICATED", "Authentication required.");

  const { slug } = await context.params;
  const track = await prisma.track.findUnique({
    where: { slug },
    include: {
      courses: {
        orderBy: { order: "asc" },
        include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
      },
    },
  });
  if (!track) return apiError(404, "NOT_FOUND", "Track not found.");

  const entitlement = await prisma.entitlement.findFirst({
    where: { userId: session.userId, trackId: track.id, status: "ACTIVE", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
  });
  if (!entitlement) return apiError(403, "FORBIDDEN", "You don't have access to this track.");

  const enrollment = await prisma.enrollment.findFirst({ where: { userId: session.userId, trackId: track.id } });
  const progressByLessonId = enrollment
    ? new Map(
        (await prisma.lessonProgress.findMany({ where: { enrollmentId: enrollment.id } })).map((p) => [p.lessonId, p.status]),
      )
    : new Map<string, string>();

  const lessonSequence = track.courses.flatMap((course) => course.modules.flatMap((module_) => module_.lessons));
  let previousCompleted = true; // the first lesson is always reachable once entitled.

  const lessonStatusById = new Map<string, string>();
  for (const lesson of lessonSequence) {
    const persisted = progressByLessonId.get(lesson.id);
    const status = persisted ?? (previousCompleted && lesson.currentPublishedVersion ? "AVAILABLE" : "LOCKED");
    lessonStatusById.set(lesson.id, lesson.currentPublishedVersion ? status : "LOCKED");
    previousCompleted = persisted === "COMPLETED";
  }

  return apiSuccess({
    id: track.id,
    slug: track.slug,
    title: track.title,
    courses: track.courses.map((course) => ({
      id: course.id,
      title: course.title,
      modules: course.modules.map((module_) => ({
        id: module_.id,
        title: module_.title,
        lessons: module_.lessons.map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          status: lessonStatusById.get(lesson.id),
        })),
      })),
    })),
  });
}
