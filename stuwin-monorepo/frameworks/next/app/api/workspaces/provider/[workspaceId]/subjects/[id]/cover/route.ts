import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SUBJECTS } from "@/lib/app-infrastructure/database";

export const POST: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, log, db, params }: ApiHandlerContext,
  ) => {
    try {
      if (!authData) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const subjectId = params?.id as string;

      if (!subjectId) {
        return NextResponse.json(
          { success: false, error: "Invalid subject ID" },
          { status: 400 },
        );
      }

      const body = await request.json();
      const { fileName, fileType } = body;

      if (!fileName || !fileType) {
        return NextResponse.json(
          { error: "fileName and fileType are required" },
          { status: 400 },
        );
      }

      // Validate file type (only images)
      if (!fileType.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image files are allowed" },
          { status: 400 },
        );
      }

      log.info("Generating subject cover upload presigned URL", {
        subjectId,
        fileName,
      });

      // Validate AWS credentials
      if (
        !process.env.AWS_S3_ACCESS_KEY_ID ||
        !process.env.AWS_S3_SECRET_ACCESS_KEY
      ) {
        log.error("AWS credentials not configured");
        return NextResponse.json(
          { error: "S3 configuration error" },
          { status: 500 },
        );
      }

      const s3Client = new S3Client({
        region: process.env.AWS_S3_REGION || "global",
        endpoint: process.env.AWS_S3_ENDPOINT || "https://s3.tebi.io",
        credentials: {
          accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        },
      });

      // Generate unique S3 key
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const coverKey = `subjects/covers/${subjectId}/${timestamp}-${sanitizedFileName}`;

      const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: coverKey,
        ContentType: fileType,
      };

      const command = new PutObjectCommand(s3Params);
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 600,
      });

      // Generate the public URL for the uploaded cover
      const publicUrl = `${process.env.AWS_S3_PUBLIC_URL || process.env.AWS_S3_ENDPOINT}/${process.env.AWS_S3_BUCKET_NAME}/${coverKey}`;

      log.info("Subject cover presigned URL generated successfully", {
        subjectId,
        coverKey,
      });

      return NextResponse.json(
        {
          success: true,
          presignedUrl,
          coverKey,
          publicUrl,
          fileName: sanitizedFileName,
        },
        { status: 200 },
      );
    } catch (error) {
      log.error(
        "Error generating subject cover upload presigned URL",
        error as Error,
      );
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 },
      );
    }
  },
);

// PUT endpoint to save the cover URL to the database after successful S3 upload
export const PUT: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, log, db, params }: ApiHandlerContext,
  ) => {
    try {
      if (!authData) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const subjectId = params?.id as string;

      if (!subjectId) {
        return NextResponse.json(
          { success: false, error: "Invalid subject ID" },
          { status: 400 },
        );
      }

      const body = await request.json();
      const { coverUrl } = body;

      if (!coverUrl) {
        return NextResponse.json(
          { error: "coverUrl is required" },
          { status: 400 },
        );
      }

      // Update the subject with the new cover URL
      const subjectRecordId = subjectId.includes(":")
        ? subjectId
        : `${SUBJECTS}:${subjectId}`;

      await db.query(
        "UPDATE $record SET cover = $coverUrl",
        { record: subjectRecordId, coverUrl }
      );

      log.info("Subject cover updated successfully", {
        subjectId,
        accountId: authData.account?.id,
      });

      return NextResponse.json({
        success: true,
        message: "Cover updated successfully",
      });
    } catch (error) {
      log.error("Failed to update subject cover", {
        error: error instanceof Error ? error.message : "Unknown error",
        accountId: authData.account?.id,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to update subject cover",
        },
        { status: 500 },
      );
    }
  },
);
