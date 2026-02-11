import { TopicRepository } from "./topic.repository";
import { BaseService } from "../base/base.service";
import { AuthContext } from "@/lib/domain/base/types";
import { Database } from "@/lib/database";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import type { TopicEntity } from "../learning/learning.entity";
import type { TopicCreateInput } from "../learning/learning.inputs";

/**
 * TopicService - Manages topics (CRUD, bulk create, PDF metadata, book analysis)
 */
export class TopicService extends BaseService {
    constructor(
        private readonly repository: TopicRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
    ) {
        super();
    }

    async createWithContent(subjectId: string, data: TopicCreateInput & { pdfFileName?: string; pdfId?: string }) {
        try {
            return await this.db.transaction(async (tx) => {
                const topic = await this.repository.create({
                    providerSubjectId: subjectId, name: data.name, description: data.description || "",
                    gradeLevel: data.gradeLevel || 1, language: data.language,
                    pdfDetails: { s3Key: data.pdfFileName || data.pdfId },
                    workspaceId: this.ctx.activeWorkspaceId || "default",
                    isActiveAiGeneration: false, aiAssistantCrib: data.aiAssistantCrib,
                }, tx);
                return { success: true as const, data: topic as unknown as TopicEntity };
            });
        } catch (error) {
            this.handleError(error, "createWithContent");
            return { success: false as const, error: "Failed to create topic" };
        }
    }

    async update(topicId: string, data: Partial<TopicCreateInput>) {
        try {

            const updated = await this.repository.update(topicId, data);
            if (!updated) return { success: false, error: "Topic not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "update");
            return { success: false, error: "Failed to update topic" };
        }
    }

    async getDetail(topicId: string, subjectId?: string) {
        try {
            const topic = await this.repository.findById(topicId);
            if (!topic) return { success: false, error: "Topic not found" };
            if (subjectId && topic.providerSubjectId !== subjectId) {
                return { success: false, error: "Topic does not belong to this subject" };
            }
            return { success: true, data: topic };
        } catch (error) {
            this.handleError(error, "getDetail");
            return { success: false, error: "Failed to load topic detail" };
        }
    }

    async bulkCreate(subjectId: string, topicsData: (Omit<TopicCreateInput, 'providerSubjectId'> & { pdfFileName?: string, pdfPagesByTopic?: number[], pdfPageStart?: number, pdfPageEnd?: number, pdfS3Key?: string, body?: string })[]) {
        try {

            const result = await this.db.transaction(async (tx) => {
                const topicsToInsert = await Promise.all(topicsData.map(async t => ({
                    providerSubjectId: subjectId, name: t.name, description: t.description || t.body || "",
                    gradeLevel: t.gradeLevel || 1, language: t.language,
                    pdfDetails: t.pdfDetails || {
                        s3Key: t.pdfFileName || t.pdfS3Key,
                        pageStart: t.pdfPageStart, pageEnd: t.pdfPageEnd,
                        pages: (t.pdfPageStart !== undefined && t.pdfPageEnd !== undefined) ? { start: t.pdfPageStart, end: t.pdfPageEnd } : undefined
                    },
                    workspaceId: this.ctx.activeWorkspaceId || "default",
                    isActiveAiGeneration: t.isActiveAiGeneration || false,
                    questionsStats: t.questionsStats
                })));
                return await this.repository.bulkCreate(topicsToInsert, tx);
            });
            return { success: true, data: result };
        } catch (error) {
            this.handleError(error, "bulkCreate");
            return { success: false, error: "Failed to create topics" };
        }
    }

    async list(params: { subjectId?: string; gradeLevel?: number }) {
        try {
            if (params.subjectId) {
                const topics = await this.repository.listBySubject(params.subjectId, { excludeVector: true });
                const filteredTopics = params.gradeLevel ? topics.filter(t => t.gradeLevel === params.gradeLevel) : topics;
                return { success: true, data: filteredTopics };
            }
            return { success: true, data: [] };
        } catch (error) {
            this.handleError(error, "list");
            return { success: false, error: "Failed to load topics" };
        }
    }

    async getById(topicId: string) {
        try {
            const topic = await this.repository.findById(topicId);
            if (!topic) return { success: false, error: "Topic not found" };
            return { success: true, data: topic };
        } catch (error) {
            this.handleError(error, "getById");
            return { success: false, error: "Failed to load topic" };
        }
    }

    async delete(topicId: string) {
        try {
            const deleted = await this.repository.delete(topicId);
            if (!deleted) return { success: false, error: "Topic not found" };
            return { success: true, data: deleted };
        } catch (error) {
            this.handleError(error, "delete");
            return { success: false, error: "Failed to delete topic" };
        }
    }

    async incrementQuestionStats(topicId: string, count: number) {
        try {
            await this.repository.incrementQuestionStats(topicId, count);
            return { success: true };
        } catch (error) {
            this.handleError(error, "incrementQuestionStats");
            return { success: false, error: "Failed to update topic stats" };
        }
    }

    async getMediaUploadUrl(topicId: string, fileName: string, fileType: string) {
        try {
            if (fileType !== "application/pdf") return { success: false, error: "Only PDF files are allowed", code: 400 };
            const topicResult = await this.getById(topicId);
            if (!topicResult.success) return topicResult;
            const s3Client = new S3Client({ region: process.env.AWS_S3_REGION || "auto", endpoint: process.env.AWS_S3_ENDPOINT || "", credentials: { accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "", secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "" }, forcePathStyle: true });
            const timestamp = Date.now();
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
            const generatedFileName = `${timestamp}-${sanitizedFileName}`;
            const s3Key = `topics/pdfs/${topicId}/${generatedFileName}`;
            const command = new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: s3Key, ContentType: fileType });
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
            return { success: true, data: { presignedUrl, uploadURL: presignedUrl, s3Key, pdfKey: s3Key, fileName: sanitizedFileName, generatedFileName } };
        } catch (error) {
            this.handleError(error, "getMediaUploadUrl");
            return { success: false, error: "Failed to generate topic upload URL" };
        }
    }

    async savePdfMetadata(topicId: string, data: { s3Key: string, pdfPageStart?: number, pdfPageEnd?: number, chapterNumber?: string }) {
        try {
            if (data.pdfPageStart && data.pdfPageEnd && data.pdfPageStart > data.pdfPageEnd) {
                return { success: false, error: "pdfPageStart must be less than or equal to pdfPageEnd", code: 400 };
            }
            let totalPages: number | null = null;
            try {
                const { getTotalPages } = await import("@/lib/utils/upload/PdfUtil");
                const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";
                const pdfUrl = `${s3Prefix}${data.s3Key}`;
                const response = await fetch(pdfUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const pdfBuffer = Buffer.from(arrayBuffer);
                    totalPages = await getTotalPages(pdfBuffer);
                }
            } catch { /* Ignore page count error */ }
            const updateData: Partial<TopicCreateInput> = {
                pdfDetails: { s3Key: data.s3Key, pageStart: data.pdfPageStart ?? undefined, pageEnd: data.pdfPageEnd ?? undefined, totalPages: totalPages ?? undefined, chapterNumber: data.chapterNumber ?? undefined },
            };
            const result = await this.update(topicId, updateData);
            if (!result.success) return result;
            return { success: true, data: result.data, message: "PDF uploaded successfully" };
        } catch (error) {
            this.handleError(error, "savePdfMetadata");
            return { success: false, error: "Failed to save PDF metadata" };
        }
    }

    async analyzeBook(params: { pdfKey: string, subjectId: string, gradeLevel: number }) {
        try {
            const { pdfKey, subjectId, gradeLevel } = params;
            const s3Client = new S3Client({ region: process.env.AWS_S3_REGION || "auto", endpoint: process.env.AWS_S3_ENDPOINT || "", credentials: { accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "", secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "" }, forcePathStyle: true });
            if (!process.env.GEMINI_API_KEY) return { success: false, error: "AI service not configured", code: 500 };
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
            const bucketName = process.env.AWS_S3_BUCKET_NAME;
            if (!bucketName) throw new Error("AWS S3 bucket name not configured");
            let s3Key = pdfKey;
            const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";
            if (s3Prefix && pdfKey.startsWith(s3Prefix)) { s3Key = pdfKey.replace(s3Prefix, ""); }
            else if (pdfKey.startsWith("http")) { const url = new URL(pdfKey); s3Key = url.pathname.substring(1); }
            const command = new GetObjectCommand({ Bucket: bucketName, Key: s3Key });
            const s3Response = await s3Client.send(command);
            if (!s3Response.Body) throw new Error("No body returned from S3");
            const reader = s3Response.Body.transformToByteArray();
            const buffer = await reader;
            const pdfBuffer = Buffer.from(buffer);
            const uploadResult = await fileManager.uploadFile(pdfBuffer, { mimeType: "application/pdf", displayName: pdfKey });
            let file = await fileManager.getFile(uploadResult.file.name);
            while (file.state === FileState.PROCESSING) { await new Promise((resolve) => setTimeout(resolve, 2000)); file = await fileManager.getFile(uploadResult.file.name); }
            if (file.state === FileState.FAILED) throw new Error("PDF processing failed in Gemini");
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview", systemInstruction: "You are a precise educational content extractor. You must scan the entire document. Accuracy of page numbers is your top priority." });
            const prompt = `Analyze this textbook (Grade ${gradeLevel}, Subject ${subjectId}) and extract ALL topics with their page numbers.\n\n**Response Format (JSON only):**\n{\n  "topics": [\n    {\n      "name": "Topic Title",\n      "pageStart": 1,\n      "pageEnd": 10\n    }\n  ]\n}`;
            const result = await model.generateContent([{ fileData: { mimeType: file.mimeType, fileUri: file.uri } }, { text: prompt }]);
            const responseText = result.response.text();
            try { await fileManager.deleteFile(file.name); } catch { }
            const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            const parsedResponse = JSON.parse(jsonMatch ? jsonMatch[1] : responseText);
            const validTopics = parsedResponse.topics
                .filter((t: { name?: string, pageStart?: number, pageEnd?: number }) => t.name && typeof t.pageStart === "number" && typeof t.pageEnd === "number")
                .map((t: { name: string, pageStart: number, pageEnd: number }) => ({ name: t.name.trim(), pageStart: t.pageStart, pageEnd: t.pageEnd }));
            return { success: true, topics: validTopics, totalTopics: validTopics.length };
        } catch (error) {
            this.handleError(error, "analyzeBook");
            return { success: false, error: error instanceof Error ? error.message : "Failed to analyze PDF" };
        }
    }
}
