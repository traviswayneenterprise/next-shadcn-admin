// One-off backfill for the lesson-version-editor-slots migration.
//
// Before this migration, LessonVersion.documentId (now documentIdV1, same
// physical column via @map) pointed at exactly one ContentDocument, which
// could hold ANY schemaVersion depending on whichever editor last saved it
// (that was the whole bug this migration fixes). documentIdV1 is required,
// so any LessonVersion whose current document isn't actually schemaVersion
// 1 needs: (a) its real content moved into the matching v2/v3 slot, and
// (b) a fresh empty v1 document created to satisfy the NOT NULL slot.
// Run once, after `prisma migrate deploy` + `prisma generate` for this
// migration, before the app relies on documentIdV1 truly meaning "classic
// content". Safe to run multiple times - already-v1 versions are no-ops.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const versions = await prisma.lessonVersion.findMany({
    include: { documentV1: true },
  });

  let moved = 0;
  for (const version of versions) {
    const currentSchemaVersion = version.documentV1.schemaVersion;
    if (currentSchemaVersion === 1) continue;
    if (currentSchemaVersion !== 2 && currentSchemaVersion !== 3) {
      console.warn(`Skipping ${version.id}: unrecognized schemaVersion ${currentSchemaVersion}`);
      continue;
    }

    await prisma.$transaction(async (transaction) => {
      const emptyV1 = await transaction.contentDocument.create({
        data: { schemaVersion: 1, blocks: [] },
      });
      await transaction.lessonVersion.update({
        where: { id: version.id },
        data: {
          documentIdV1: emptyV1.id,
          ...(currentSchemaVersion === 2
            ? { documentIdV2: version.documentV1.id }
            : { documentIdV3: version.documentV1.id }),
          activeSchemaVersion: currentSchemaVersion,
        },
      });
    });
    moved++;
    console.log(`Moved lesson version ${version.id}: schemaVersion ${currentSchemaVersion} document -> slot v${currentSchemaVersion}, new empty v1 slot created.`);
  }

  console.log(`Done. ${moved} of ${versions.length} lesson version(s) backfilled.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
