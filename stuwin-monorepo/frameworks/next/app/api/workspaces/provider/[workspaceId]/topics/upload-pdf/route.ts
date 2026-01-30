import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
    try {
      if (!authData) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const { topicId, fileName, fileType } = body;

      if (!topicId || typeof topicId !== "string" || !fileName || !fileType) {
        return NextResponse.json(
          { error: "topicId, fileName, and fileType are required" },
          { status: 400 },
        );
      }

      // Validate file type (only PDF)
      if (fileType !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are allowed" },
          { status: 400 },
        );
      }

      log.info("Generating PDF upload presigned URL", { topicId, fileName });

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
      const pdfKey = `topics/pdfs/${topicId}/${timestamp}-${sanitizedFileName}`;

      const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: pdfKey,
        ContentType: fileType,
      };

      const command = new PutObjectCommand(s3Params);
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 600,
      });

      log.info("Presigned URL generated successfully", { topicId, pdfKey });

      return NextResponse.json(
        {
          presignedUrl,
          pdfKey,
          fileName: sanitizedFileName,
        },
        { status: 200 },
      );
    } catch (error) {
      log.error("Error generating PDF upload presigned URL", error as Error);
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 },
      );
    }
  },
);
