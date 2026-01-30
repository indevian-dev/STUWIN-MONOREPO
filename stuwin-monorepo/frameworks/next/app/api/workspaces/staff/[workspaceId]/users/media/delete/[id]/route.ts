import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
    try {
      const { filename, filePath } = await request.json();
      if (!filename || !filePath) {
        return NextResponse.json(
          { error: "Filename and filePath are required" },
          { status: 400 },
        );
      }
      // Validate S3 credentials
      const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
      if (!accessKeyId || !secretAccessKey) {
        return NextResponse.json(
          { error: "S3 credentials not configured" },
          { status: 500 },
        );
      }
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || "global",
        endpoint: process.env.AWS_S3_ENDPOINT,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: `${filePath}/${filename}`,
      };
      // Delete the object
      const deleteCommand = new DeleteObjectCommand(params);
      await s3Client.send(deleteCommand);
      // Verify deletion
      try {
        const headCommand = new HeadObjectCommand(params);
        await s3Client.send(headCommand);
        return NextResponse.json(
          { error: "File could not be deleted" },
          { status: 500 },
        );
      } catch (headErr: unknown) {
        if (
          headErr &&
          typeof headErr === "object" &&
          "name" in headErr &&
          headErr.name === "NotFound"
        ) {
          return NextResponse.json(
            { message: "File deleted successfully" },
            { status: 200 },
          );
        }
        throw headErr;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the file";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
