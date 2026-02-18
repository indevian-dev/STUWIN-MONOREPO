/**
 * Migration: Copy subject cover files in R2 from old location to new path
 *
 * Run from the `next` directory:
 *   bun --env-file=.env run scripts/migrate-subject-covers-r2.ts
 */

import { S3Client, CopyObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { isNotNull } from "drizzle-orm";
import { providerSubjects } from "../lib/database/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("❌ DATABASE_URL not set"); process.exit(1); }

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const ENDPOINT = process.env.AWS_S3_ENDPOINT!;
const REGION = process.env.AWS_S3_REGION || "auto";
const ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY!;

if (!BUCKET || !ENDPOINT || !ACCESS_KEY || !SECRET_KEY) {
    console.error("❌ Missing S3 env vars"); process.exit(1);
}

const s3 = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const pgClient = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(pgClient);

async function keyExists(key: string): Promise<boolean> {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch { return false; }
}

async function copyObject(sourceKey: string, destKey: string): Promise<boolean> {
    try {
        await s3.send(new CopyObjectCommand({
            Bucket: BUCKET,
            CopySource: `${BUCKET}/${sourceKey}`,
            Key: destKey,
        }));
        return true;
    } catch (err) {
        console.error(`    ❌ Copy failed:`, err);
        return false;
    }
}

async function migrate() {
    console.log("🔍 Fetching subjects with covers from DB...\n");

    const subjects = await db
        .select({ id: providerSubjects.id, workspaceId: providerSubjects.workspaceId, cover: providerSubjects.cover, name: providerSubjects.name })
        .from(providerSubjects)
        .where(isNotNull(providerSubjects.cover));

    const withCovers = subjects.filter(s => s.cover);
    console.log(`Found ${withCovers.length} subjects with covers.\n`);

    let copied = 0, skipped = 0, errors = 0;

    for (const subject of withCovers) {
        const newKey = subject.cover!;
        const filename = newKey.split("/").pop()!;
        const subjectId = subject.id;

        console.log(`📁 [${subjectId}] "${subject.name}"`);
        console.log(`   Target: ${newKey}`);

        if (await keyExists(newKey)) {
            console.log(`   ⏭️  Already at new location\n`);
            skipped++; continue;
        }

        // Try candidate old locations
        const candidates = [
            filename,                                       // bare filename at bucket root
            `subjects/covers/${subjectId}/${filename}`,     // old subjectId-based path
            `categories/${subjectId}/${filename}`,          // legacy path
        ];

        let done = false;
        for (const src of candidates) {
            console.log(`   🔎 Trying: ${src}`);
            if (await keyExists(src)) {
                console.log(`   ✅ Found at: ${src}`);
                if (await copyObject(src, newKey)) {
                    console.log(`   ✅ Copied → ${newKey}\n`);
                    copied++; done = true;
                } else { errors++; }
                break;
            }
        }

        if (!done) {
            console.warn(`   ⚠️  Not found at any candidate source\n`);
            errors++;
        }
    }

    console.log("═══════════════════════════════════");
    console.log(`✅ Copied:  ${copied}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors:  ${errors}`);
    console.log("═══════════════════════════════════");

    await pgClient.end();
}

migrate().catch(err => { console.error("Migration failed:", err); process.exit(1); });
