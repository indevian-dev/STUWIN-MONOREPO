import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SUBJECTS } from '@/lib/app-infrastructure/database';
export const POST: ApiRouteHandler = withApiHandler(async (req: NextRequest, { params, log, db }: ApiHandlerContext) => {
    try {
        if (!params) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        const { categoryId } = await params;
        // Validate category ID
        if (!categoryId) {
            return NextResponse.json({ error: 'Valid category ID is required' }, { status: 400 });
        }
        // Verify subject/category exists using Drizzle
        const categoryRecordId = categoryId.includes(':') ? categoryId : `${SUBJECTS}:${categoryId}`;
        const [subject] = await db.query(
            `SELECT id FROM ${SUBJECTS} WHERE id = $subjectId LIMIT 1`,
            { subjectId: categoryRecordId }
        );
        if (!subject) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }
        // Validate S3 credentials
        const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
        if (!accessKeyId || !secretAccessKey) {
            return NextResponse.json({ error: 'S3 credentials not configured' }, { status: 500 });
        }
        // Generate unique filename
        const fileName = uuidv4();
        // Create S3 client
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'global',
            endpoint: process.env.AWS_S3_ENDPOINT,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        // S3 parameters for category icon
        const s3Params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `categories/${categoryId}/${fileName}.webp`,
        };
        // Generate presigned URL
        const command = new PutObjectCommand(s3Params);
        const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });
        return NextResponse.json({
            uploadURL,
            fileName: `${fileName}.webp`,
            categoryId: categoryId
        }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error generating presigned URL';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
});
