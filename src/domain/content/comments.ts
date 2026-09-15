import { prisma } from "@/lib/db";

const RESOURCE_TYPE = "LessonVersion";

export async function listLessonVersionComments(lessonVersionId: string) {
  return prisma.comment.findMany({
    where: { resourceType: RESOURCE_TYPE, resourceId: lessonVersionId },
    orderBy: { createdAt: "asc" },
    include: { author: true },
  });
}

export async function addLessonVersionComment(input: { lessonVersionId: string; authorId: string; body: string }) {
  return prisma.comment.create({
    data: {
      resourceType: RESOURCE_TYPE,
      resourceId: input.lessonVersionId,
      authorId: input.authorId,
      body: input.body,
    },
    include: { author: true },
  });
}
