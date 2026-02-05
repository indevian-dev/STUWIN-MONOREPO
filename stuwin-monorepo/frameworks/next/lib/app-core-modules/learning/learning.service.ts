
import { LearningRepository } from "./learning.repository";
import { SemanticMasteryService } from "../semantic-mastery/SemanticMasteryService";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";
import slugify from 'slugify';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

/**
 * LearningService - Coordinates educational content delivery
 */
export class LearningService extends BaseService {
    constructor(
        private readonly repository: LearningRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
        private readonly semanticMastery: SemanticMasteryService
    ) {
        super();
    }

    /**
     * Get a single subject by ID
     */
    async getSubjectById(subjectId: string) {
        try {
            const subject = await this.repository.findSubjectById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            return { success: true, data: subject };
        } catch (error) {
            this.handleError(error, "getSubjectById");
            return { success: false, error: "Failed to load subject" };
        }
    }

    /**
     * Get a full overview of a subject including topics
     */
    async getSubjectOverview(subjectId: string) {
        try {
            const subject = await this.repository.findSubjectById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };

            const topics = await this.repository.listTopicsBySubject(subjectId, { excludeVector: true });
            const pdfs = (subject.files as any) || [];

            return {
                success: true,
                data: {
                    ...subject,
                    topics,
                    pdfs,
                },
            };
        } catch (error) {
            this.handleError(error, "getSubjectOverview");
            return { success: false, error: "Failed to load subject overview" };
        }
    }

    /**
     * Get all subjects for a specific workspace
     */
    async getWorkspaceSubjects(workspaceId: string) {
        try {
            const subjects = await this.repository.listSubjects({ workspaceId });
            return { success: true, data: subjects };
        } catch (error) {
            this.handleError(error, "getWorkspaceSubjects");
            return { success: false, error: "Failed to load subjects" };
        }
    }

    /**
     * Get all public subjects
     */
    async getPublicSubjects() {
        try {
            const subjects = await this.repository.listSubjects({ onlyActive: true });
            return { success: true, data: subjects };
        } catch (error) {
            this.handleError(error, "getPublicSubjects");
            return { success: false, error: "Failed to load subjects" };
        }
    }

    /**
     * Get all PDFs for a subject
     */
    async getSubjectPdfs(subjectId: string) {
        try {
            const subject = await this.repository.findSubjectById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };

            const pdfs: any[] = (subject.files as any) || [];
            const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";

            // Reconstruct URL if stored as filename only
            const processedPdfs = pdfs.map(pdf => ({
                ...pdf,
                pdfUrl: pdf.pdfUrl && !pdf.pdfUrl.startsWith('http')
                    ? `${s3Prefix}subjects/pdfs/${subjectId}/${pdf.pdfUrl}`
                    : pdf.pdfUrl
            }));

            return { success: true, data: processedPdfs };
        } catch (error) {
            this.handleError(error, "getSubjectPdfs");
            return { success: false, error: "Failed to load subject PDFs" };
        }
    }

    /**
     * Save metadata for an uploaded PDF
     */
    async saveSubjectPdf(params: {
        subjectId: string;
        pdfFileName: string;
        uploadAccountId: string;
        workspaceId: string;
        name?: string;
        language?: string;
    }) {
        try {
            const subject = await this.repository.findSubjectById(params.subjectId);
            if (!subject) return { success: false, error: "Subject not found" };

            const currentFiles = (subject.files as any[]) || [];
            const newFile = {
                id: uuidv4(),
                pdfUrl: params.pdfFileName,
                name: params.name || params.pdfFileName,
                language: params.language,
                createdAt: new Date(),
                isActive: true
            };

            const updatedFiles = [...currentFiles, newFile];
            await this.repository.updateSubject(params.subjectId, { files: updatedFiles });

            return { success: true, data: newFile };
        } catch (error) {
            this.handleError(error, "saveSubjectPdf");
            return { success: false, error: "Failed to save PDF metadata" };
        }
    }

    /**
     * Create a new subject
     */
    async createSubject(data: {
        title: string;
        description: string;
        cover?: string;
        aiLabel?: string;
        isGlobal?: boolean;
        organizationId?: string;
        workspaceId?: string;
        aiAssistantCrib?: string;
    }) {
        try {
            // Validate name format: -(locale)-(grade)
            const locales = (process.env.ALLOWED_PROVIDER_CONTENTLOCALES || 'az').split(',');
            const regex = new RegExp(`-(${locales.join('|')})-(\\d+)$`);
            const match = data.title.match(regex);

            if (!match || parseInt(match[2], 10) < 1 || parseInt(match[2], 10) > 20) {
                return { success: false, error: "Subject title must end with -(locale)-(grade) (e.g. -az-1). Grade 1-20." };
            }

            const slug = slugify(data.title, { lower: true, strict: true });

            const newSubject = await this.repository.createSubject({
                name: data.title,
                description: data.description,
                slug,
                cover: data.cover,
                aiLabel: data.aiLabel,
                workspaceId: data.workspaceId,
                aiAssistantCrib: data.aiAssistantCrib,
                createdAt: new Date(),
                isActive: true
            });

            return { success: true, data: newSubject };
        } catch (error) {
            this.handleError(error, "createSubject");
            return { success: false, error: "Failed to create subject" };
        }
    }

    /**
     * Update an existing subject
     */
    async updateSubject(id: string, data: {
        title?: string;
        description?: string;
        isActive?: boolean;
        is_active?: boolean; // For backward compatibility with legacy payloads
        cover?: string;
        aiLabel?: string;
        aiAssistantCrib?: string;
    }) {
        try {
            const updateData: any = { ...data };
            const subjectName = data.title || (data as any).name;

            if (subjectName) {
                // Validate name format: -(locale)-(grade)
                const locales = (process.env.ALLOWED_PROVIDER_CONTENTLOCALES || 'az').split(',');
                const regex = new RegExp(`-(${locales.join('|')})-(\\d+)$`);
                const match = subjectName.match(regex);

                if (!match || parseInt(match[2], 10) < 1 || parseInt(match[2], 10) > 20) {
                    return { success: false, error: "Subject name must end with -(locale)-(grade) (e.g. -az-1). Grade 1-20." };
                }

                updateData.name = subjectName;
                updateData.slug = slugify(subjectName, { lower: true, strict: true });
                if (updateData.title) delete updateData.title;
            }

            // Handle legacy is_active
            if (data.is_active !== undefined) {
                updateData.isActive = data.is_active;
                delete updateData.is_active;
            }

            const updated = await this.repository.updateSubject(id, updateData);
            if (!updated) return { success: false, error: "Subject not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "updateSubject");
            return { success: false, error: "Failed to update subject" };
        }
    }

    /**
     * Delete an existing subject
     */
    async deleteSubject(id: string) {
        try {
            const deleted = await this.repository.deleteSubject(id);
            if (!deleted) return { success: false, error: "Subject not found" };
            return { success: true, data: deleted };
        } catch (error) {
            this.handleError(error, "deleteSubject");
            return { success: false, error: "Failed to delete subject" };
        }
    }

    /**
     * List questions with pagination and filters
     */
    async listQuestions(params: {
        page?: number;
        pageSize?: number;
        subjectId?: string;
        complexity?: string;
        gradeLevel?: number;
        authorAccountId?: string;
        onlyPublished?: boolean;
        workspaceId?: string;
    }) {
        try {
            const page = params.page || 1;
            const pageSize = params.pageSize || 20;
            const offset = (page - 1) * pageSize;

            const [questions, total] = await Promise.all([
                this.repository.listQuestions({
                    limit: pageSize,
                    offset,
                    providerSubjectId: params.subjectId,
                    complexity: params.complexity,
                    gradeLevel: params.gradeLevel,
                    authorAccountId: params.authorAccountId,
                    onlyPublished: params.onlyPublished,
                    workspaceId: params.workspaceId
                }),
                this.repository.countQuestions({
                    providerSubjectId: params.subjectId,
                    complexity: params.complexity,
                    gradeLevel: params.gradeLevel,
                    authorAccountId: params.authorAccountId,
                    onlyPublished: params.onlyPublished,
                    workspaceId: params.workspaceId
                })
            ]);

            return {
                success: true,
                data: {
                    questions,
                    pagination: {
                        page,
                        pageSize,
                        total,
                        totalPages: Math.ceil(total / pageSize)
                    }
                }
            };
        } catch (error) {
            this.handleError(error, "listQuestions");
            return { success: false, error: "Failed to list questions" };
        }
    }

    /**
     * Create a new question
     */
    async createQuestion(data: any, authorAccountId: string) {
        try {
            let context = data.context;

            // If context not provided, try to build it from IDs
            if (!context && (data.providerSubjectId || data.providerSubjectTopicId)) {
                try {
                    let subjectName = "Unknown Subject";
                    let topicName = "Unknown Topic";
                    let chapterNumber: string | undefined = undefined;

                    if (data.providerSubjectId) {
                        const subject = await this.repository.findSubjectById(data.providerSubjectId);
                        if (subject) subjectName = subject.name || subjectName;
                    }

                    if (data.providerSubjectTopicId) {
                        const topic = await this.repository.findTopicById(data.providerSubjectTopicId);
                        if (topic) {
                            topicName = topic.name || topicName;
                            chapterNumber = (topic as any).chapterNumber;
                        }
                    }

                    context = { subjectName, topicName, chapterNumber };
                } catch (err) {
                    this.handleError(err, "createQuestion.contextBuild");
                }
            }

            const newQuestion = await this.repository.createQuestion({
                ...data,
                authorAccountId,
                createdAt: new Date(),
                updatedAt: new Date(),
                isPublished: false,
                context
            });

            return { success: true, data: newQuestion };
        } catch (error) {
            this.handleError(error, "createQuestion");
            return { success: false, error: "Failed to create question" };
        }
    }

    /**
     * Create a topic and associate it with a PDF if provided
     */
    async createTopicWithContent(subjectId: string, data: { name: string; description: string; gradeLevel?: number; language?: string; pdfId?: string }) {
        try {
            // Verify name format
            const TOPIC_PREFIX_REGEX = /^\d+\.\d+\s+/;
            if (!TOPIC_PREFIX_REGEX.test(data.name)) {
                return { success: false as const, error: "Topic name must start with 'X.Y ' prefix (e.g., 1.0 Topic Name)" };
            }

            return await this.db.transaction(async (tx) => {
                const knowledgeVector = await this.semanticMastery.generateTopicVector(data.name, data.description);

                const topic = await this.repository.createTopic({
                    providerSubjectId: subjectId,
                    name: data.name,
                    description: data.description,
                    gradeLevel: data.gradeLevel,
                    language: data.language,
                    pdfDetails: { s3Key: (data as any).pdfFileName || data.pdfId },
                    workspaceId: this.ctx.activeWorkspaceId || "default",
                    isActiveAiGeneration: false,
                    aiAssistantCrib: (data as any).aiAssistantCrib,
                }, tx as any);

                return { success: true as const, data: topic };
            });
        } catch (error) {
            this.handleError(error, "createTopicWithContent");
            return { success: false as const, error: "Failed to create topic" };
        }
    }

    /**
     * Get single question by ID
     */
    async getQuestionById(id: string) {
        try {
            const question = await this.repository.findQuestionById(id);
            if (!question) return { success: false, error: "Question not found" };
            return { success: true, data: question };
        } catch (error) {
            this.handleError(error, "getQuestionById");
            return { success: false, error: "Failed to get question" };
        }
    }

    /**
     * Update question
     */
    async updateQuestion(id: string, data: any) {
        try {
            const updated = await this.repository.updateQuestion(id, data);
            if (!updated) return { success: false, error: "Question not found or update failed" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "updateQuestion");
            return { success: false, error: "Failed to update question" };
        }
    }

    /**
     * Set question publish status
     */
    async setQuestionPublished(id: string, isPublished: boolean) {
        try {
            const updated = await this.repository.updateQuestion(id, { isPublished });
            if (!updated) return { success: false, error: "Question not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "setQuestionPublished");
            return { success: false, error: "Failed to update publish status" };
        }
    }

    /**
     * Delete question
     */
    async deleteQuestion(id: string) {
        try {
            const deleted = await this.repository.deleteQuestion(id);
            if (!deleted) return { success: false, error: "Question not found or delete failed" };
            return { success: true, data: deleted };
        } catch (error) {
            this.handleError(error, "deleteQuestion");
            return { success: false, error: "Failed to delete question" };
        }
    }

    /**
     * Map a database question record to legacy format
     */
    mapQuestionToLegacy(data: any) {
        const q = data.question || data;
        return {
            id: q.id,
            body: q.question,
            answers: q.answers,
            correct_answer: q.correctAnswer,
            complexity: q.complexity,
            grade_level: q.gradeLevel,
            explanation_guide: q.explanationGuide,
            is_published: q.isPublished,
            created_at: q.createdAt,
            updated_at: q.updatedAt
        };
    }

    /**
     * Increment topic question stats
     */
    async incrementTopicQuestionStats(topicId: string, count: number) {
        try {
            await this.repository.incrementTopicQuestionStats(topicId, count);
            return { success: true };
        } catch (error) {
            this.handleError(error, "incrementTopicQuestionStats");
            return { success: false, error: "Failed to update topic stats" };
        }
    }

    /**
     * Update a topic
     */
    async updateTopic(topicId: string, data: any) {
        try {
            // Verify name format if provided
            if (data.name) {
                const TOPIC_PREFIX_REGEX = /^\d+\.\d+\s+/;
                if (!TOPIC_PREFIX_REGEX.test(data.name)) {
                    return { success: false, error: "Topic name must start with 'X.Y ' prefix (e.g., 1.0 Topic Name)" };
                }
            }

            const updated = await this.repository.updateTopic(topicId, data);
            if (!updated) return { success: false, error: "Topic not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "updateTopic");
            return { success: false, error: "Failed to update topic" };
        }
    }

    /**
     * Get a single topic detail
     */
    async getTopicDetail(topicId: string, subjectId?: string) {
        try {
            const topic = await this.repository.findTopicById(topicId);
            if (!topic) return { success: false, error: "Topic not found" };

            if (subjectId && topic.providerSubjectId !== subjectId) {
                return { success: false, error: "Topic does not belong to this subject" };
            }

            return { success: true, data: topic };
        } catch (error) {
            this.handleError(error, "getTopicDetail");
            return { success: false, error: "Failed to load topic detail" };
        }
    }

    /**
     * Bulk create topics
     */
    async bulkCreateTopics(subjectId: string, topicsData: any[]) {
        try {
            // Verify name format: number.number followed by a space
            // Pattern: X.Y Topic Name (e.g., 1.0 Algebra Basics)
            const TOPIC_PREFIX_REGEX = /^\d+\.\d+\s+/;
            const invalidNames = topicsData
                .filter(t => !TOPIC_PREFIX_REGEX.test(t.name))
                .map(t => t.name);

            if (invalidNames.length > 0) {
                return {
                    success: false,
                    error: `Invalid topic name format. Missing 'X.Y ' prefix: ${invalidNames.slice(0, 3).join(", ")}${invalidNames.length > 3 ? "..." : ""}`
                };
            }

            const result = await this.db.transaction(async (tx) => {
                const topicsToInsert = await Promise.all(topicsData.map(async t => ({
                    providerSubjectId: subjectId,
                    name: t.name,
                    description: t.description || t.body,
                    gradeLevel: t.gradeLevel,
                    language: t.language,
                    pdfDetails: t.pdfDetails || {
                        s3Key: t.pdfFileName || t.pdfS3Key,
                        pages: t.pdfPagesByTopic,
                        pageStart: t.pdfPageStart,
                        pageEnd: t.pdfPageEnd
                    },
                    workspaceId: this.ctx.activeWorkspaceId || "default",
                    isActiveAiGeneration: t.isActiveAiGeneration || false,
                    questionsStats: t.questionsStats,
                    parentTopicId: t.parentTopicId
                })));

                const createdTopics = await this.repository.bulkCreateTopics(topicsToInsert, tx as any);
                return createdTopics;
            });

            return { success: true, data: result };
        } catch (error) {
            this.handleError(error, "bulkCreateTopics");
            return { success: false, error: "Failed to create topics" };
        }
    }

    /**
     * List topics with filters
     */
    async getTopics(params: { subjectId?: string; gradeLevel?: number }) {
        try {
            if (params.subjectId) {
                const topics = await this.repository.listTopicsBySubject(params.subjectId, { excludeVector: true });
                const filteredTopics = params.gradeLevel
                    ? topics.filter(t => t.gradeLevel === params.gradeLevel)
                    : topics;
                return { success: true, data: filteredTopics };
            }
            return { success: true, data: [] };
        } catch (error) {
            this.handleError(error, "getTopics");
            return { success: false, error: "Failed to load topics" };
        }
    }

    /**
     * Get a topic detail by ID
     */
    async getTopicById(topicId: string) {
        try {
            const topic = await this.repository.findTopicById(topicId);
            if (!topic) return { success: false, error: "Topic not found" };
            return { success: true, data: topic };
        } catch (error) {
            this.handleError(error, "getTopicById");
            return { success: false, error: "Failed to load topic" };
        }
    }

    /**
     * Delete a topic
     */
    async deleteTopic(topicId: string) {
        try {
            const deleted = await this.repository.deleteTopic(topicId);
            if (!deleted) return { success: false, error: "Topic not found" };
            return { success: true, data: deleted };
        } catch (error) {
            this.handleError(error, "deleteTopic");
            return { success: false, error: "Failed to delete topic" };
        }
    }

    /**
     * Get a PDF (file) by ID from subject files
     */
    async getPdfById(subjectId: string, pdfId: string) {
        try {
            const subject = await this.repository.findSubjectById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };

            const pdfs: any[] = (subject.files as any) || [];
            const pdf = pdfs.find(p => p.id === pdfId);

            if (!pdf) return { success: false, error: "PDF not found" };
            return { success: true, data: pdf };
        } catch (error) {
            this.handleError(error, "getPdfById");
            return { success: false, error: "Failed to load PDF" };
        }
    }

    /**
     * Reorder files within a subject
     */
    async reorderPdfs(subjectId: string, orderedPdfIds: string[]) {
        try {
            const subject = await this.repository.findSubjectById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };

            const pdfs: any[] = (subject.files as any) || [];
            const sortedPdfs = orderedPdfIds.map(id => pdfs.find(p => p.id === id)).filter(Boolean);

            await this.repository.updateSubject(subjectId, { files: sortedPdfs });
            return { success: true, data: sortedPdfs };
        } catch (error) {
            this.handleError(error, "reorderPdfs");
            return { success: false, error: "Failed to reorder PDFs" };
        }
    }


    /**
     * Generate S3 Upload URL for Subject Cover
     */
    async getSubjectCoverUploadUrlLegacy(subjectId: string) {
        try {
            // Verify subject exists
            const subject = await this.repository.findSubjectById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };

            const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
            const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

            if (!accessKeyId || !secretAccessKey) {
                return { success: false, error: "S3 credentials not configured" };
            }

            const fileName = uuidv4();
            const s3Client = new S3Client({
                region: process.env.AWS_REGION || 'global',
                endpoint: process.env.AWS_S3_ENDPOINT,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });

            const s3Params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: `categories/${subjectId}/${fileName}.webp`,
            };

            const command = new PutObjectCommand(s3Params);
            const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });

            return {
                success: true,
                data: {
                    uploadURL,
                    fileName: `${fileName}.webp`,
                    categoryId: subjectId
                }
            };
        } catch (error) {
            this.handleError(error, "getSubjectCoverUploadUrl");
            return { success: false, error: "Error generating presigned URL" };
        }
    }

    /**
     * Delete Subject Media from S3
     */
    async deleteSubjectMedia(subjectId: string, fileName: string) {
        try {
            // Verify subject exists
            const subject = await this.repository.findSubjectById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };

            const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
            const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

            if (!accessKeyId || !secretAccessKey) {
                return { success: false, error: "S3 credentials not configured" };
            }

            const s3Client = new S3Client({
                region: process.env.AWS_REGION || 'global',
                endpoint: process.env.AWS_S3_ENDPOINT,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });

            const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: `categories/${subjectId}/${fileName}`,
            };

            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3Client.send(deleteCommand);

            return { success: true };
        } catch (error) {
            this.handleError(error, "deleteSubjectMedia");
            return { success: false, error: "Error deleting media" };
        }
    }

    /**
     * Get questions by subject slug for public display
     */
    async getQuestionsBySubject(params: {
        slug: string;
        page?: number;
        pageSize?: number;
        complexity?: string;
        gradeLevel?: number;
    }) {
        try {
            // 1. Find subject by slug
            const subject = await this.repository.findSubjectBySlug(params.slug);
            if (!subject) return { success: false, error: "Subject not found", code: 404 };

            // 2. Map name to title for compatibility if needed
            const subjectWithTitle = {
                ...subject,
                title: (subject as any).name
            };

            // 3. List questions with filters
            const page = params.page || 1;
            const pageSize = params.pageSize || 20;

            const result = await this.listQuestions({
                page,
                pageSize,
                subjectId: subject.id,
                complexity: params.complexity,
                gradeLevel: params.gradeLevel,
                onlyPublished: true
            });

            if (!result.success) return result;

            return {
                success: true,
                data: {
                    subject: subjectWithTitle,
                    questions: (result.data as any).questions,
                    page,
                    pageSize,
                    total: (result.data as any).pagination.total,
                    totalPages: (result.data as any).pagination.totalPages
                }
            };
        } catch (error) {
            this.handleError(error, "getQuestionsBySubject");
            return { success: false, error: "Failed to load questions by subject" };
        }
    }

    async getSubjectCoverUploadUrl(subjectId: string, fileName: string, fileType: string) {
        try {
            if (!fileType.startsWith("image/")) {
                return { success: false, error: "Only image files are allowed", code: 400 };
            }

            const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
            const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

            const s3Client = new S3Client({
                region: process.env.AWS_S3_REGION || "",
                endpoint: process.env.AWS_S3_ENDPOINT || "",
                credentials: {
                    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
                },
            });

            const timestamp = Date.now();
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
            const generatedFileName = `${timestamp}-${sanitizedFileName}`;
            const coverKey = `subjects/covers/${subjectId}/${generatedFileName}`;

            const s3Params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: coverKey,
                ContentType: fileType,
            };

            const command = new PutObjectCommand(s3Params);
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

            const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";
            const publicUrl = `${s3Prefix.replace(/\/$/, "")}/${coverKey.startsWith("/") ? coverKey.substring(1) : coverKey}`;

            return {
                success: true,
                data: { presignedUrl, coverKey, publicUrl, fileName: sanitizedFileName, generatedFileName }
            };
        } catch (error) {
            this.handleError(error, "getSubjectCoverUploadUrl");
            return { success: false, error: "Failed to generate cover upload URL" };
        }
    }

    async getSubjectPdfUploadUrl(subjectId: string, fileName: string, fileType: string) {
        try {
            if (fileType !== "application/pdf") {
                return { success: false, error: "Only PDF files are allowed", code: 400 };
            }

            const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
            const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

            const s3Client = new S3Client({
                region: process.env.AWS_S3_REGION || "auto",
                endpoint: process.env.AWS_S3_ENDPOINT || "",
                credentials: {
                    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
                },
                forcePathStyle: true,
            });

            const timestamp = Date.now();
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
            const generatedFileName = `${timestamp}-${sanitizedFileName}`;
            const pdfKey = `subjects/pdfs/${subjectId}/${generatedFileName}`;

            const s3Params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: pdfKey,
                ContentType: fileType,
            };

            const command = new PutObjectCommand(s3Params);
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

            return {
                success: true,
                data: { presignedUrl, pdfKey, fileName: sanitizedFileName, generatedFileName }
            };
        } catch (error) {
            this.handleError(error, "getSubjectPdfUploadUrl");
            return { success: false, error: "Failed to generate PDF upload URL" };
        }
    }

    async getTopicMediaUploadUrl(topicId: string, fileName: string, fileType: string) {
        try {
            if (fileType !== "application/pdf") {
                return { success: false, error: "Only PDF files are allowed", code: 400 };
            }

            const topicResult = await this.getTopicById(topicId);
            if (!topicResult.success) return topicResult;

            const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
            const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

            const s3Client = new S3Client({
                region: process.env.AWS_S3_REGION || "auto",
                endpoint: process.env.AWS_S3_ENDPOINT || "",
                credentials: {
                    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
                },
                forcePathStyle: true,
            });

            const timestamp = Date.now();
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
            const generatedFileName = `${timestamp}-${sanitizedFileName}`;
            const s3Key = `topics/pdfs/${topicId}/${generatedFileName}`;

            const s3Params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: s3Key,
                ContentType: fileType,
            };

            const command = new PutObjectCommand(s3Params);
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

            return {
                success: true,
                data: {
                    presignedUrl,
                    uploadURL: presignedUrl, // Backwards compat
                    s3Key,
                    pdfKey: s3Key, // alias
                    fileName: sanitizedFileName,
                    generatedFileName
                }
            };
        } catch (error) {
            this.handleError(error, "getTopicMediaUploadUrl");
            return { success: false, error: "Failed to generate topic upload URL" };
        }
    }

    async saveTopicPdfMetadata(topicId: string, data: { s3Key: string, pdfPageStart?: number, pdfPageEnd?: number, chapterNumber?: string }) {
        try {
            if (data.pdfPageStart && data.pdfPageEnd && data.pdfPageStart > data.pdfPageEnd) {
                return { success: false, error: "pdfPageStart must be less than or equal to pdfPageEnd", code: 400 };
            }

            let totalPages: number | null = null;
            try {
                const { getTotalPages } = require("@/lib/utilities/pdfUtility");
                const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";
                const pdfUrl = `${s3Prefix}${data.s3Key}`;

                const response = await fetch(pdfUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const pdfBuffer = Buffer.from(arrayBuffer);
                    totalPages = await getTotalPages(pdfBuffer);
                }
            } catch (pdfError) {
                // Ignore page count error
            }

            const updateData: any = {
                pdfDetails: {
                    s3Key: data.s3Key,
                    pageStart: data.pdfPageStart || null,
                    pageEnd: data.pdfPageEnd || null,
                    totalPages: totalPages,
                    chapterNumber: data.chapterNumber || null,
                },
            };

            const result = await this.updateTopic(topicId, updateData);
            if (!result.success) return result;

            return {
                success: true,
                data: result.data,
                message: "PDF uploaded successfully"
            };
        } catch (error) {
            this.handleError(error, "saveTopicPdfMetadata");
            return { success: false, error: "Failed to save PDF metadata" };
        }
    }

    async analyzeBookTopic(params: { pdfKey: string, subjectId: string, gradeLevel: number }) {
        try {
            const { pdfKey, subjectId, gradeLevel } = params;
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
            const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

            const s3Client = new S3Client({
                region: process.env.AWS_S3_REGION || "auto",
                endpoint: process.env.AWS_S3_ENDPOINT || "",
                credentials: {
                    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
                },
                forcePathStyle: true,
            });

            if (!process.env.GEMINI_API_KEY) {
                return { success: false, error: "AI service not configured", code: 500 };
            }

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

            const bucketName = process.env.AWS_S3_BUCKET_NAME;
            if (!bucketName) throw new Error("AWS S3 bucket name not configured");

            let s3Key = pdfKey;
            const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";
            if (s3Prefix && pdfKey.startsWith(s3Prefix)) {
                s3Key = pdfKey.replace(s3Prefix, "");
            } else if (pdfKey.startsWith("http")) {
                const url = new URL(pdfKey);
                s3Key = url.pathname.substring(1);
            }

            const command = new GetObjectCommand({ Bucket: bucketName, Key: s3Key });
            const s3Response = await s3Client.send(command);
            if (!s3Response.Body) throw new Error("No body returned from S3");

            const reader = s3Response.Body.transformToByteArray();
            const buffer = await reader;
            const pdfBuffer = Buffer.from(buffer);

            const uploadResult = await fileManager.uploadFile(pdfBuffer, {
                mimeType: "application/pdf",
                displayName: pdfKey,
            });

            let file = await fileManager.getFile(uploadResult.file.name);
            while (file.state === FileState.PROCESSING) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                file = await fileManager.getFile(uploadResult.file.name);
            }

            if (file.state === FileState.FAILED) throw new Error("PDF processing failed in Gemini");

            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                systemInstruction: "You are a precise educational content extractor. You must scan the entire document. Accuracy of page numbers is your top priority.",
            });

            const prompt = `Analyze this textbook (Grade ${gradeLevel}, Subject ${subjectId}) and extract ALL topics with their page numbers.

**Response Format (JSON only):**
{
  "topics": [
    {
      "name": "Topic Title",
      "pageStart": 1,
      "pageEnd": 10
    }
  ]
}`;

            const result = await model.generateContent([
                { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
                { text: prompt },
            ]);

            const responseText = result.response.text();

            try { await fileManager.deleteFile(file.name); } catch (e) { }

            const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            const parsedResponse = JSON.parse(jsonMatch ? jsonMatch[1] : responseText);

            const validTopics = parsedResponse.topics
                .filter((t: any) => t.name && typeof t.pageStart === "number" && typeof t.pageEnd === "number")
                .map((t: any) => ({
                    name: t.name.trim(),
                    pageStart: t.pageStart,
                    pageEnd: t.pageEnd,
                }));

            return {
                success: true,
                topics: validTopics,
                totalTopics: validTopics.length
            };
        } catch (error) {
            this.handleError(error, "analyzeBookTopic");
            return { success: false, error: error instanceof Error ? error.message : "Failed to analyze PDF" };
        }
    }

    async getSubjectHeatmap(subjectId: string, providerWorkspaceId: string) {
        try {
            // 1. Get classroom centroid
            const centroid = await this.semanticMastery.getProviderCentroid(providerWorkspaceId);
            if (!centroid) return { success: false, error: "No semantic DNA found for this classroom yet." };

            // 2. Fetch topics for this subject
            const topics = await this.repository.listTopicsBySubject(subjectId);

            // 3. Project Centroid onto Topics (Cosine Similarity)
            const heatmap = topics.map(topic => {
                const vector = (topic as any).knowledgeVector as number[] | undefined;
                if (!vector || !centroid) return { topicId: topic.id, name: topic.name, mastery: 0 };

                // Cosine Similarity = (A . B) / (||A|| * ||B||)
                const dotProduct = vector.reduce((sum: number, v: number, i: number) => sum + v * centroid![i], 0);
                const magA = Math.sqrt(vector.reduce((sum: number, v: number) => sum + v * v, 0));
                const magB = Math.sqrt(centroid.reduce((sum: number, v: number) => sum + v * v, 0));

                const similarity = dotProduct / (magA * magB);

                return {
                    topicId: topic.id,
                    name: topic.name,
                    mastery: Math.max(0, Math.min(100, similarity * 100)) // Scaled to 0-100
                };
            });

            return { success: true, data: heatmap };
        } catch (error) {
            this.handleError(error, "getSubjectHeatmap");
            return { success: false, error: "Failed to generate semantic heatmap" };
        }
    }
}
