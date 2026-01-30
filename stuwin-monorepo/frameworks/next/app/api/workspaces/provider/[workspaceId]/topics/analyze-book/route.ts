import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/integrations/awsClient";

export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
    try {
      if (!authData) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const { pdfKey, subjectId, gradeLevel } = body;

      if (!pdfKey || !subjectId || !gradeLevel) {
        return NextResponse.json(
          { error: "pdfKey, subjectId, and gradeLevel are required" },
          { status: 400 },
        );
      }

      log.info("Analyzing book PDF with Gemini", {
        pdfKey,
        subjectId,
        gradeLevel,
      });

      // Validate Gemini API key
      if (!process.env.GEMINI_API_KEY) {
        log.error("Gemini API key not configured");
        return NextResponse.json(
          { error: "AI service not configured" },
          { status: 500 },
        );
      }

      // Initialize Gemini AI and File Manager
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

      // 1. DOWNLOAD PDF FROM S3 using AWS SDK
      log.info("Downloading PDF from S3 using AWS SDK...", {
        pdfKey,
        bucketName: process.env.AWS_S3_BUCKET_NAME,
      });

      const bucketName = process.env.AWS_S3_BUCKET_NAME;

      if (!bucketName) {
        throw new Error("AWS S3 bucket name not configured");
      }

      // Extract S3 key from pdfKey (remove S3 prefix if present)
      let s3Key = pdfKey;

      // Check if pdfKey is a full S3 URL and extract the key part
      const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";
      if (s3Prefix && pdfKey.startsWith(s3Prefix)) {
        // Remove the S3 prefix to get just the key
        s3Key = pdfKey.replace(s3Prefix, "");
        log.info("Extracted S3 key from full URL", {
          originalPdfKey: pdfKey,
          s3Prefix,
          extractedKey: s3Key,
        });
      } else if (pdfKey.startsWith("http")) {
        // Fallback: try to extract from any HTTP URL
        const url = new URL(pdfKey);
        s3Key = url.pathname.substring(1); // Remove leading slash
        log.info("Extracted S3 key from HTTP URL", {
          originalPdfKey: pdfKey,
          extractedKey: s3Key,
        });
      }

      let pdfBuffer: Buffer;

      try {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
        });

        log.info("Sending S3 GetObjectCommand", {
          bucket: bucketName,
          key: s3Key,
        });

        const s3Response = await s3Client.send(command);

        if (!s3Response.Body) {
          throw new Error("No body returned from S3");
        }

        // Convert the stream to buffer
        const reader = s3Response.Body.transformToByteArray();
        const buffer = await reader;

        log.info("PDF downloaded successfully from S3", {
          size: buffer.length,
          contentType: s3Response.ContentType,
        });

        // Convert to a Buffer for the SDK (server-side)
        pdfBuffer = Buffer.from(buffer);
      } catch (s3Error) {
        log.error("Failed to fetch PDF from S3", {
          pdfKey,
          error: s3Error instanceof Error ? s3Error.message : String(s3Error),
        });
        throw new Error("Failed to fetch PDF from S3: 403 Forbidden");
      }

      // 2. UPLOAD TO GEMINI FILES API
      log.info("Uploading PDF to Gemini Files API...");
      const uploadResult = await fileManager.uploadFile(pdfBuffer, {
        mimeType: "application/pdf",
        displayName: pdfKey,
      });

      // 3. WAIT FOR PROCESSING
      log.info("Waiting for Gemini to process the PDF...");
      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === FileState.PROCESSING) {
        log.info("PDF still processing, waiting 2 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
      }

      if (file.state === FileState.FAILED) {
        throw new Error("PDF processing failed in Gemini Files API");
      }

      log.info("PDF processed successfully", {
        fileName: file.name,
        fileUri: file.uri,
      });

      // 4. ANALYZE WITH GEMINI
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview", // Use Flash 3 for better reasoning than Preview
        systemInstruction:
          "You are a precise educational content extractor. You must scan the entire document. Accuracy of page numbers is your top priority.",
      });

      const prompt = `Analyze this textbook (Grade ${gradeLevel}, Subject ${subjectId}) and extract ALL topics with their page numbers.

**Important Instructions:**
1. Extract EVERY topic, chapter, section, or lesson from the table of contents or content structure
2. For each topic, provide:
   - Exact topic name/title
   - Start page number (where the topic begins)
   - End page number (where the topic ends, before the next topic starts)
3. Be thorough - don't skip any topics
4. Page numbers must be accurate integers
5. Topics should cover the entire book without gaps

**Response Format (JSON only, no markdown):**
{
  "topics": [
    {
      "name": "Topic Title",
      "pageStart": 1,
      "pageEnd": 10
    }
  ]
}`;

      try {
        const result = await model.generateContent([
          {
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.uri,
            },
          },
          { text: prompt },
        ]);

        const response = await result.response;
        const text = response.text();

        // 5. CLEAN UP - Delete the file from Gemini
        try {
          await fileManager.deleteFile(file.name);
          log.info("Cleaned up file from Gemini Files API", {
            fileName: file.name,
          });
        } catch (cleanupError) {
          log.warn("Failed to cleanup file from Gemini", {
            error: cleanupError,
            fileName: file.name,
          });
        }

        log.info("Gemini response received", { responseLength: text.length });

        // Parse JSON response
        let parsedResponse;
        try {
          // Try to extract JSON from markdown code blocks if present
          const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[1]);
          } else {
            // Try direct JSON parse
            parsedResponse = JSON.parse(text);
          }
        } catch (parseError) {
          log.error("Failed to parse Gemini response as JSON", {
            text,
            error: parseError,
          });

          // Fallback: Try to extract topics using regex
          const topicPattern =
            /"name":\s*"([^"]+)"[\s\S]*?"pageStart":\s*(\d+)[\s\S]*?"pageEnd":\s*(\d+)[\s\S]*?"summary":\s*"([^"]+)"/g;
          const topics = [];
          let match;

          while ((match = topicPattern.exec(text)) !== null) {
            topics.push({
              name: match[1],
              pageStart: parseInt(match[2]),
              pageEnd: parseInt(match[3]),
            });
          }

          if (topics.length > 0) {
            parsedResponse = { topics };
          } else {
            throw new Error("Could not extract topics from AI response");
          }
        }

        // Validate response structure
        if (!parsedResponse.topics || !Array.isArray(parsedResponse.topics)) {
          log.error("Invalid response structure from Gemini", {
            parsedResponse,
          });
          throw new Error("Invalid AI response structure");
        }

        // Validate and clean topics
        const validTopics = parsedResponse.topics
          .filter((topic: any) => {
            return (
              topic.name &&
              typeof topic.pageStart === "number" &&
              typeof topic.pageEnd === "number" &&
              topic.pageStart > 0 &&
              topic.pageEnd >= topic.pageStart
            );
          })
          .map((topic: any) => ({
            name: topic.name.trim(),
            pageStart: topic.pageStart,
            pageEnd: topic.pageEnd,
          }));

        if (validTopics.length === 0) {
          log.error("No valid topics extracted from Gemini response");
          throw new Error("No valid topics found in the book");
        }

        log.info("Topics extracted successfully", {
          count: validTopics.length,
        });

        return NextResponse.json(
          {
            success: true,
            topics: validTopics,
            totalTopics: validTopics.length,
          },
          { status: 200 },
        );
      } catch (geminiError) {
        log.error("Gemini API error", geminiError as Error);

        // Return a more specific error message
        if (geminiError instanceof Error) {
          if (geminiError.message.includes("quota")) {
            return NextResponse.json(
              { error: "AI service quota exceeded. Please try again later." },
              { status: 429 },
            );
          } else if (geminiError.message.includes("timeout")) {
            return NextResponse.json(
              { error: "AI analysis timed out. The PDF might be too large." },
              { status: 408 },
            );
          }
        }

        throw geminiError;
      }
    } catch (error) {
      log.error("Error analyzing book PDF", error as Error);
      return NextResponse.json(
        { error: "Failed to analyze PDF. Please try again." },
        { status: 500 },
      );
    }
  },
);
