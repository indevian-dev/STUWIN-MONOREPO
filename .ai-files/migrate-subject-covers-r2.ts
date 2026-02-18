/**
 * Migration: Copy subject cover files in R2 from old location to new path
 *
 * Old location in bucket: {filename}  (bare, at bucket root)
 *   OR: subjects/covers/{subjectId}/{filename}
 *
 * New location in bucket: {workspaceId}/subjects/{subjectId}/covers/{filename}
 *
 * This script reads the DB for all subjects with covers already in the new key format,
 * then tries to copy from the old location to the new one.
 *
 * Run from the `next` directory:
 *   bun --env-file=.env run ../.ai-files/migrate-subject-covers-r2.ts
 */

import { S3Client, CopyObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { isNotNull } from "drizzle-orm";
import { providerSubjects } from "../next/lib/database/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL not set.");
    process.exit(1);
}

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const ENDPOINT = process.env.AWS_S3_ENDPOINT!;
const REGION = process.env.AWS_S3_REGION || "auto";
const ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY!;

if (!BUCKET || !ENDPOINT || !ACCESS_KEY || !SECRET_KEY) {
    console.error("❌ Missing S3 env vars (AWS_S3_BUCKET_NAME, AWS_S3_ENDPOINT, AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY)");
    process.exit(1);
}

const s3 = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

/** Check if a key exists in the bucket */
async function keyExists(key: string): Promise<boolean> {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

/** Try to copy from sourceKey to destKey */
async function copyObject(sourceKey: string, destKey: string): Promise<boolean> {
    try {
        await s3.send(new CopyObjectCommand({
            Bucket: BUCKET,
            CopySource: `${BUCKET}/${sourceKey}`,
            Key: destKey,
        }));
        return true;
    } catch (err) {
        console.error(`    ❌ Copy failed: ${err}`);
        return false;
    }
}

async function migrate() {
    console.log("🔍 Fetching subjects with covers from DB...\n");

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

    let copied = 0;
    let skipped = 0;
    let errors = 0;

    for (const subject of withCovers) {
        const newKey = subject.cover!; // Already updated to new format by previous migration
        const filename = newKey.split("/").pop()!;
        const subjectId = subject.id;

        console.log(`📁 [${subjectId}] "${subject.name}"`);
        console.log(`   Target key: ${newKey}`);

        // Check if file already exists at new location
        if (await keyExists(newKey)) {
            console.log(`   ⏭️  Already exists at new location — skipping\n`);
            skipped++;
            continue;
        }

        // Try old locations in order of likelihood
        const candidateSources = [
            filename,                                          // bare filename at root
            `subjects/covers/${subjectId}/${filename}`,        // old subjectId-based path
            `categories/${subjectId}/${filename}`,             // legacy path
        ];

        let copied_ok = false;
        for (const sourceKey of candidateSources) {
            console.log(`   🔎 Trying source: ${sourceKey}`);
            if (await keyExists(sourceKey)) {
                console.log(`   ✅ Found at: ${sourceKey}`);
                const ok = await copyObject(sourceKey, newKey);
                if (ok) {
                    console.log(`   ✅ Copied → ${newKey}\n`);
                    copied++;
                    copied_ok = true;
                } else {
                    errors++;
                }
                break;
            }
        }

        if (!copied_ok && !skipped) {
            console.warn(`   ⚠️  File not found at any candidate source location\n`);
            errors++;
        }
    }

    console.log("═══════════════════════════════════");
    console.log(`✅ Copied:  ${copied}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors:  ${errors}`);
    console.log("═══════════════════════════════════");

    await client.end();
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
