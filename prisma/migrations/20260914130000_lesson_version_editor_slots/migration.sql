-- AlterTable
ALTER TABLE "LessonVersion" ADD COLUMN     "activeSchemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "documentIdV2" TEXT,
ADD COLUMN     "documentIdV3" TEXT;

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_resourceType_resourceId_createdAt_idx" ON "Comment"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LessonVersion_documentIdV2_key" ON "LessonVersion"("documentIdV2");

-- CreateIndex
CREATE UNIQUE INDEX "LessonVersion_documentIdV3_key" ON "LessonVersion"("documentIdV3");

-- AddForeignKey
ALTER TABLE "LessonVersion" ADD CONSTRAINT "LessonVersion_documentIdV2_fkey" FOREIGN KEY ("documentIdV2") REFERENCES "ContentDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonVersion" ADD CONSTRAINT "LessonVersion_documentIdV3_fkey" FOREIGN KEY ("documentIdV3") REFERENCES "ContentDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
