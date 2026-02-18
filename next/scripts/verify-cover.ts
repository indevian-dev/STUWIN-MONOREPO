/**
 * Verify: check if cover.webp exists in R2 via S3 API
 * Run: bun --env-file=.env run scripts/verify-cover.ts
 */
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const s3 = new S3Client({
    region: process.env.AWS_S3_REGION || "auto",
    endpoint: process.env.AWS_S3_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
    },
});

const KEY = "01KFXRGEFFA75KZN/subjects/01KGFQC925H4SQ0F/covers/cover.webp";

async function main() {
    // Check if key exists
    try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: KEY }));
        console.log("✅ File exists!");
        console.log(`   Content-Type: ${head.ContentType}`);
        console.log(`   Size: ${head.ContentLength} bytes`);
        console.log(`   Last modified: ${head.LastModified}`);
    } catch (err: any) {
        console.log("❌ File NOT found via HeadObject:", err.name);
    }

    // List all files in the covers folder
    console.log("\n📂 Listing all files in covers folder:");
    const list = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: "01KFXRGEFFA75KZN/subjects/01KGFQC925H4SQ0F/covers/",
    }));
    if (list.Contents && list.Contents.length > 0) {
        for (const obj of list.Contents) {
            console.log(`   ${obj.Key} (${obj.Size} bytes)`);
        }
    } else {
        console.log("   (empty)");
    }
}

main().catch(err => { console.error("Failed:", err); process.exit(1); });
