/**
 * Migration: Fix subject cover image paths
 *
 * Correct R2 path structure:
 *   {workspaceId}/subjects/{subjectId}/covers/{filename}
 *
 * Old values in DB may be:
 *   - Full URL: https://s3.stuwin.ai/{filename}
 *   - Bare filename: 1770057244751-filename.png
 *   - Old key: subjects/covers/{subjectId}/{filename}
 *
 * Run from the `next` directory:
 *   bun --env-file=.env run ../.ai-files/migrate-subject-covers.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, isNotNull } from "drizzle-orm";
import { providerSubjects } from "../next/lib/database/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL not set.");
    console.error("Run: bun --env-file=.env run ../.ai-files/migrate-subject-covers.ts");
    process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

/** Extract just the filename from any cover value */
function extractFilename(cover: string): string | null {
    if (cover.startsWith("http")) {
        try {
            const url = new URL(cover);
            const parts = url.pathname.split("/").filter(Boolean);
            return parts[parts.length - 1] || null;
        } catch {
            return null;
        }
    }
    // Could be "subjects/covers/xxx/filename.png" or bare "filename.png"
    const parts = cover.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
}

async function migrate() {
    console.log("🔍 Fetching subjects with cover images...\n");

    const subjects = await db
        .select({
            id: providerSubjects.id,
            workspaceId: providerSubjects.workspaceId,
            cover: providerSubjects.cover,
            name: providerSubjects.name,
        })
        .from(providerSubjects)
        .where(isNotNull(providerSubjects.cover));

    const withCovers = subjects.filter((s) => s.cover);
    console.log(`Found ${withCovers.length} subjects with covers.\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const subject of withCovers) {
        const cover = subject.cover!;
        const workspaceId = subject.workspaceId;
        const subjectId = subject.id;

        if (!workspaceId) {
            console.warn(`⚠️  [${subjectId}] No workspaceId — skipping`);
            skipped++;
            continue;
        }

        // Already in the correct format — skip
        const correctPrefix = `${workspaceId}/subjects/${subjectId}/covers/`;
        if (cover.startsWith(correctPrefix)) {
            console.log(`⏭️  [${subjectId}] Already correct: ${cover}`);
            skipped++;
            continue;
        }

        const filename = extractFilename(cover);
        if (!filename) {
            console.error(`❌ [${subjectId}] Could not extract filename from: ${cover}`);
            errors++;
            continue;
        }

        const newKey = `${workspaceId}/subjects/${subjectId}/covers/${filename}`;

        console.log(`✏️  [${subjectId}] "${subject.name}"`);
        console.log(`    OLD: ${cover}`);
        console.log(`    NEW: ${newKey}`);

        try {
            await db
                .update(providerSubjects)
                .set({ cover: newKey })
                .where(eq(providerSubjects.id, subjectId));

            console.log(`    ✅ Updated\n`);
            updated++;
        } catch (err) {
            console.error(`    ❌ Failed to update:`, err);
            errors++;
        }
    }

    console.log("═══════════════════════════════════");
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors:  ${errors}`);
    console.log("═══════════════════════════════════");

    await client.end();
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
