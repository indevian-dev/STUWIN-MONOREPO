import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { SUBJECTS } from '@/lib/app-infrastructure/database';
export const POST: ApiRouteHandler = withApiHandler(async (req: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
    try {
        if (!authData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!params) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        const { categoryId } = await params;
        const authAccId = authData.account.id;
        // Validate category ID
        if (!categoryId) {
            return NextResponse.json({ error: 'Valid category ID is required' }, { status: 400 });
        }
        // Get request body
        const body = await req.json();
        const { fileName } = body;
        if (!fileName) {
            return NextResponse.json({ error: 'File name is required' }, { status: 400 });
        }
        // Verify subject/category exists
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
        // Create S3 client
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'global',
            endpoint: process.env.AWS_S3_ENDPOINT,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        // Delete file from S3
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `categories/${categoryId}/${fileName}`,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3Client.send(deleteCommand);
        // TODO: Implement audit logging
        // await db.insert(actionLogs).values({
        //     action: 'delete_subject_media',
        //     createdBy: authAccId,
        //     resourceType: 'subjects',
        //     resourceId: parseInt(categoryId),
        // });
        return NextResponse.json({
            message: 'Media deleted successfully',
            categoryId: categoryId
        }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error deleting media';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
});
