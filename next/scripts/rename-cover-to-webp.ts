/**
 * Copy existing cover file to deterministic cover.webp name
 * Run: bun --env-file=.env run scripts/rename-cover-to-webp.ts
 */
import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const s3 = new S3Client({
    region: process.env.AWS_S3_REGION || "auto",
    endpoint: process.env.AWS_S3_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
    },
});

const SOURCE = "01KFXRGEFFA75KZN/subjects/01KGFQC925H4SQ0F/covers/1770057244751-A-person-holding-a-credit-card-and-a-calculator.png";
const DEST = "01KFXRGEFFA75KZN/subjects/01KGFQC925H4SQ0F/covers/cover.webp";

async function main() {
    console.log(`📋 Copying:\n   FROM: ${SOURCE}\n   TO:   ${DEST}\n`);

    await s3.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${SOURCE}`,
        Key: DEST,
    }));

    console.log("✅ Done! File copied to cover.webp");
}

main().catch(err => { console.error("❌ Failed:", err); process.exit(1); });
