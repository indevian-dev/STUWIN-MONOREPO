/**
 * One-time: Download existing cover PNG from R2, convert to WebP, re-upload as cover.webp
 * Run: bun --env-file=.env run scripts/convert-cover-to-webp.ts
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

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
    // 1. Download PNG
    console.log(`⬇️  Downloading: ${SOURCE}`);
    const getResult = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: SOURCE }));
    const bodyBytes = await getResult.Body!.transformToByteArray();
    console.log(`   Downloaded ${bodyBytes.length} bytes`);

    // 2. Convert to WebP
    console.log(`🔄 Converting to WebP...`);
    const webpBuffer = await sharp(Buffer.from(bodyBytes))
        .webp({ quality: 80 })
        .toBuffer();
    console.log(`   WebP size: ${webpBuffer.length} bytes (${Math.round((1 - webpBuffer.length / bodyBytes.length) * 100)}% smaller)`);

    // 3. Upload WebP
    console.log(`⬆️  Uploading: ${DEST}`);
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: DEST,
        Body: webpBuffer,
        ContentType: "image/webp",
    }));

    console.log(`✅ Done!`);
}

main().catch(err => { console.error("❌ Failed:", err); process.exit(1); });
