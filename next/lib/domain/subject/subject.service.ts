import { SubjectRepository } from "./subject.repository";
import { SemanticMasteryService } from "../semantic-mastery/semantic-mastery.service";
import { BaseService } from "../base/base.service";
import { AuthContext } from "@/lib/domain/base/types";
import { Database } from "@/lib/database";
import slugify from 'slugify';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { SubjectFileView } from "../learning/learning.views";
import type { SubjectCreateInput } from "../learning/learning.inputs";
import { v4 as uuidv4 } from 'uuid';

/**
 * SubjectService - Manages educational subjects (CRUD, PDFs, S3 uploads, heatmap)
 */
export class SubjectService extends BaseService {
    constructor(
        private readonly repository: SubjectRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
        private readonly semanticMastery: SemanticMasteryService
    ) {
        super();
    }

    async getById(subjectId: string) {
        try {
            const subject = await this.repository.findById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            const processed = { ...subject, title: subject.name || '', displayTitle: subject.name || '' };
            return { success: true, data: processed };
        } catch (error) {
            this.handleError(error, "getById");
            return { success: false, error: "Failed to load subject" };
        }
    }

    async getOverview(subjectId: string) {
        try {
            const subject = await this.repository.findById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            // Import topic repo lazily to avoid circular deps
            const { TopicRepository } = await import("../topic/topic.repository");
            const topicRepo = new TopicRepository(this.db);
            const topics = await topicRepo.listBySubject(subjectId, { excludeVector: true });
            const pdfs = (subject.files as unknown as SubjectFileView[]) || [];
            return {
                success: true,
                data: { ...subject, title: subject.name || '', displayTitle: subject.name || '', topics, pdfs },
            };
        } catch (error) {
            this.handleError(error, "getOverview");
            return { success: false, error: "Failed to load subject overview" };
        }
    }

    async getWorkspaceSubjects(workspaceId: string) {
        try {
            const subjects = await this.repository.list({ workspaceId });
            const processed = subjects.map(s => ({ ...s, title: s.name || '', displayTitle: s.name || '' }));
            return { success: true, data: processed };
        } catch (error) {
            this.handleError(error, "getWorkspaceSubjects");
            return { success: false, error: "Failed to load subjects" };
        }
    }

    async getPublicSubjects() {
        try {
            const subjects = await this.repository.list({ onlyActive: true });
            const processed = subjects.map(s => ({ ...s, title: s.name || '', displayTitle: s.name || '' }));
            return { success: true, data: processed };
        } catch (error) {
            this.handleError(error, "getPublicSubjects");
            return { success: false, error: "Failed to load subjects" };
        }
    }

    async getPdfs(subjectId: string) {
        try {
            const subject = await this.repository.findById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            const pdfs = (subject.files as unknown as SubjectFileView[]) || [];
            const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";
            const processedPdfs = pdfs.map(pdf => ({
                ...pdf,
                pdfUrl: pdf.pdfUrl && !pdf.pdfUrl.startsWith('http')
                    ? `${s3Prefix}subjects/pdfs/${subjectId}/${pdf.pdfUrl}`
                    : pdf.pdfUrl
            }));
            return { success: true, data: processedPdfs };
        } catch (error) {
            this.handleError(error, "getPdfs");
            return { success: false, error: "Failed to load subject PDFs" };
        }
    }

    async savePdf(params: { subjectId: string; pdfFileName: string; uploadAccountId: string; workspaceId: string; name?: string; language?: string; }) {
        try {
            const subject = await this.repository.findById(params.subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            const currentFiles = (subject.files as unknown as SubjectFileView[]) || [];
            const newFile = { id: uuidv4(), pdfUrl: params.pdfFileName, name: params.name || params.pdfFileName, language: params.language, createdAt: new Date(), isActive: true };
            const updatedFiles = [...currentFiles, newFile];
            await this.repository.update(params.subjectId, { files: updatedFiles });
            return { success: true, data: newFile };
        } catch (error) {
            this.handleError(error, "savePdf");
            return { success: false, error: "Failed to save PDF metadata" };
        }
    }

    async create(data: { title: string; description: string; language: string; gradeLevel: number; aiLabel?: string; isGlobal?: boolean; organizationId?: string; workspaceId?: string; aiGuide?: string; }) {
        try {
            const slug = slugify(data.title, { lower: true, strict: true });
            const newSubject = await this.repository.create({
                name: data.title, description: data.description, language: data.language, gradeLevel: data.gradeLevel,
                slug, aiLabel: data.aiLabel, workspaceId: data.workspaceId, aiGuide: data.aiGuide,
                createdAt: new Date(), isActive: true
            });
            return { success: true, data: newSubject };
        } catch (error) {
            this.handleError(error, "create");
            return { success: false, error: "Failed to create subject" };
        }
    }

    async update(id: string, data: Partial<SubjectCreateInput> & { is_active?: boolean; gradeLevel?: number; language?: string; }) {
        try {
            const updateData: Record<string, unknown> = { ...data };
            const subjectName = data.title || (data as { name?: string }).name;
            if (subjectName) {
                updateData.name = subjectName;
                updateData.slug = slugify(subjectName, { lower: true, strict: true });
                if (updateData.title) delete updateData.title;
            }
            if (data.language) updateData.language = data.language;
            if (data.gradeLevel) updateData.gradeLevel = data.gradeLevel;
            if (data.is_active !== undefined) { updateData.isActive = data.is_active; delete updateData.is_active; }
            const updated = await this.repository.update(id, updateData);
            if (!updated) return { success: false, error: "Subject not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "update");
            return { success: false, error: "Failed to update subject" };
        }
    }

    async delete(id: string) {
        try {
            const deleted = await this.repository.delete(id);
            if (!deleted) return { success: false, error: "Subject not found" };
            return { success: true, data: deleted };
        } catch (error) {
            this.handleError(error, "delete");
            return { success: false, error: "Failed to delete subject" };
        }
    }

    async getPdfById(subjectId: string, pdfId: string) {
        try {
            const subject = await this.repository.findById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            const pdfs = (subject.files as unknown as SubjectFileView[]) || [];
            const pdf = pdfs.find(p => p.id === pdfId);
            if (!pdf) return { success: false, error: "PDF not found" };
            return { success: true, data: pdf };
        } catch (error) {
            this.handleError(error, "getPdfById");
            return { success: false, error: "Failed to load PDF" };
        }
    }

    async reorderPdfs(subjectId: string, orderedPdfIds: string[]) {
        try {
            const subject = await this.repository.findById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            const pdfs = (subject.files as unknown as SubjectFileView[]) || [];
            const sortedPdfs = orderedPdfIds.map(id => pdfs.find(p => p.id === id)).filter((p): p is SubjectFileView => !!p);
            await this.repository.update(subjectId, { files: sortedPdfs });
            return { success: true, data: sortedPdfs };
        } catch (error) {
            this.handleError(error, "reorderPdfs");
            return { success: false, error: "Failed to reorder PDFs" };
        }
    }

    async getCoverUploadUrlLegacy(subjectId: string) {
        try {
            const subject = await this.repository.findById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
            const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
            if (!accessKeyId || !secretAccessKey) return { success: false, error: "S3 credentials not configured" };
            const fileName = uuidv4();
            const s3Client = new S3Client({ region: process.env.AWS_REGION || 'global', endpoint: process.env.AWS_S3_ENDPOINT, credentials: { accessKeyId, secretAccessKey } });
            const s3Params = { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: `categories/${subjectId}/${fileName}.webp` };
            const command = new PutObjectCommand(s3Params);
            const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });
            return { success: true, data: { uploadURL, fileName: `${fileName}.webp`, categoryId: subjectId } };
        } catch (error) {
            this.handleError(error, "getCoverUploadUrlLegacy");
            return { success: false, error: "Error generating presigned URL" };
        }
    }

    async deleteMedia(subjectId: string, fileName: string) {
        try {
            const subject = await this.repository.findById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };
            const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
            const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
            if (!accessKeyId || !secretAccessKey) return { success: false, error: "S3 credentials not configured" };
            const s3Client = new S3Client({ region: process.env.AWS_REGION || 'global', endpoint: process.env.AWS_S3_ENDPOINT, credentials: { accessKeyId, secretAccessKey } });
            const deleteParams = { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: `categories/${subjectId}/${fileName}` };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3Client.send(deleteCommand);
            return { success: true };
        } catch (error) {
            this.handleError(error, "deleteMedia");
            return { success: false, error: "Error deleting media" };
        }
    }

    async getCoverUploadUrl(subjectId: string, fileType: string, workspaceId: string) {
        try {
            if (!fileType.startsWith("image/")) return { success: false, error: "Only image files are allowed", code: 400 };
            const s3Client = new S3Client({ region: process.env.AWS_S3_REGION || "", endpoint: process.env.AWS_S3_ENDPOINT || "", credentials: { accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "", secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "" } });
            // Deterministic path: {workspaceId}/subjects/{subjectId}/covers/cover.webp
            const coverKey = `${workspaceId}/subjects/${subjectId}/covers/cover.webp`;
            const command = new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: coverKey, ContentType: fileType });
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
            return { success: true, data: { presignedUrl } };
        } catch (error) {
            this.handleError(error, "getCoverUploadUrl");
            return { success: false, error: "Failed to generate cover upload URL" };
        }
    }

    async getPdfUploadUrl(subjectId: string, fileName: string, fileType: string) {
        try {
            if (fileType !== "application/pdf") return { success: false, error: "Only PDF files are allowed", code: 400 };
            const s3Client = new S3Client({ region: process.env.AWS_S3_REGION || "auto", endpoint: process.env.AWS_S3_ENDPOINT || "", credentials: { accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "", secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "" }, forcePathStyle: true });
            const timestamp = Date.now();
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
            const generatedFileName = `${timestamp}-${sanitizedFileName}`;
            const pdfKey = `subjects/pdfs/${subjectId}/${generatedFileName}`;
            const command = new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: pdfKey, ContentType: fileType });
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
            return { success: true, data: { presignedUrl, pdfKey, fileName: sanitizedFileName, generatedFileName } };
        } catch (error) {
            this.handleError(error, "getPdfUploadUrl");
            return { success: false, error: "Failed to generate PDF upload URL" };
        }
    }

    async getHeatmap(subjectId: string, providerWorkspaceId: string) {
        try {
            const centroid = await this.semanticMastery.getProviderCentroid(providerWorkspaceId);
            if (!centroid) return { success: false, error: "No semantic DNA found for this classroom yet." };
            const { TopicRepository } = await import("../topic/topic.repository");
            const topicRepo = new TopicRepository(this.db);
            const topics = await topicRepo.listBySubject(subjectId);
            const heatmap = topics.map(topic => {
                const vector = (topic as unknown as { knowledgeVector: number[] }).knowledgeVector;
                if (!vector || !centroid) return { topicId: topic.id, name: topic.name, mastery: 0 };
                const dotProduct = vector.reduce((sum: number, v: number, i: number) => sum + v * centroid![i], 0);
                const magA = Math.sqrt(vector.reduce((sum: number, v: number) => sum + v * v, 0));
                const magB = Math.sqrt(centroid.reduce((sum: number, v: number) => sum + v * v, 0));
                const similarity = dotProduct / (magA * magB);
                return { topicId: topic.id, name: topic.name, mastery: Math.max(0, Math.min(100, similarity * 100)) };
            });
            return { success: true, data: heatmap };
        } catch (error) {
            this.handleError(error, "getHeatmap");
            return { success: false, error: "Failed to generate semantic heatmap" };
        }
    }
}
