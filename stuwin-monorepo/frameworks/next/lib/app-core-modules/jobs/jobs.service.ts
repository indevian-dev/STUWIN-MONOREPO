
import { JobRepository } from "./jobs.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import {
    getAllJobs,
    pauseSchedule,
    resumeSchedule,
    triggerJob,
} from '@/lib/helpers/qstashScheduleHelper';
import { DbClient } from "@/lib/app-infrastructure/database";
import { qstashClient } from '@/lib/integrations/qstashClient';
import axiomClient, { logScannerBatch, logWorkerProcessing, logTopicWorker, AXIOM_BACKGROUND_JOB_DATASET } from '@/lib/integrations/axiomClient';
import { randomUUID } from 'crypto';
import { genAI } from "@/lib/integrations/geminiClient";
import { ObjectSchema, SchemaType } from "@google/generative-ai";
import type { StudentReportData, TopicWorkerRequest, JobStatsResponse, JobStats, JobStatsOverview } from "./jobs.types";
import { QuestionGenerationService } from '@/lib/app-core-modules/services/QuestionGenerationService';

/**
 * JobService - Manages background jobs via QStash
 */
export class JobService extends BaseService {
    constructor(
        private readonly repository: JobRepository,
        private readonly ctx: AuthContext,
        private readonly db: DbClient
    ) {
        super();
    }

    async listJobs() {
        try {
            // In a real app we might verify staff permissions here
            const jobs = await getAllJobs();
            return { success: true as const, data: jobs };
        } catch (error) {
            this.handleError(error, "listJobs");
            return { success: false as const, error: "Failed to list jobs" };
        }
    }

    async pauseJob(jobId: string) {
        try {
            await pauseSchedule(jobId);
            return { success: true, message: 'Job paused successfully' };
        } catch (error) {
            this.handleError(error, "pauseJob");
            return { success: false, error: "Failed to pause job" };
        }
    }

    async resumeJob(jobId: string) {
        try {
            await resumeSchedule(jobId);
            return { success: true, message: 'Job resumed successfully' };
        } catch (error) {
            this.handleError(error, "resumeJob");
            return { success: false, error: "Failed to resume job" };
        }
    }

    async triggerJob(jobId: string) {
        try {
            const jobs = await getAllJobs();
            const job = jobs.find(j => j.id === jobId);
            if (!job) return { success: false, error: 'Job not found' };

            await triggerJob(job.endpoint);
            return { success: true, message: 'Job triggered successfully' };
        } catch (error) {
            this.handleError(error, "triggerJob");
            return { success: false, error: "Failed to trigger job" };
        }
    }

    async scanStudentsForReports(params: { lastId?: string; correlationId?: string }): Promise<any> {
        const startTime = Date.now();
        const correlationId = params.correlationId || randomUUID();
        const lastId = params.lastId || '';
        const BATCH_SIZE = 1000;

        const RAILWAY_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_APP_URL || 'localhost:3033';
        const WORKER_ENDPOINT = `https://${RAILWAY_DOMAIN}/api/workspaces/jobs/generate-report`;
        const SCANNER_ENDPOINT = `https://${RAILWAY_DOMAIN}/api/workspaces/jobs/mass-report-scanner`;

        try {
            // Log scanner batch started
            await logScannerBatch({
                correlationId,
                status: 'started',
                lastId,
                batchSize: 0,
                hasMore: false,
            });

            // Fetch students using Repository
            const students = await this.repository.getStudentBatch(lastId, BATCH_SIZE);
            const batchSize = students.length;
            const hasMore = batchSize === BATCH_SIZE;

            if (batchSize === 0) {
                await logScannerBatch({
                    correlationId,
                    status: 'completed',
                    lastId,
                    batchSize: 0,
                    hasMore: false,
                });
                return {
                    success: true,
                    message: 'No more students to process',
                    processed: 0,
                    hasMore: false,
                    correlationId
                };
            }

            // Dispatch worker tasks to QStash
            const dispatchPromises = students.map(async (student) => {
                try {
                    await qstashClient.publishJSON({
                        url: WORKER_ENDPOINT,
                        body: { studentId: student.id, correlationId },
                        retries: 3,
                        headers: { 'Content-Type': 'application/json' },
                    });
                } catch (e) {
                    console.warn(`[JobService] Failed to dispatch for student ${student.id}`, e);
                }
            });
            await Promise.all(dispatchPromises);

            // Trigger next batch if hasMore (Recursive Relay)
            const nextLastId = students[students.length - 1].id;
            if (hasMore) {
                try {
                    await qstashClient.publishJSON({
                        url: `${SCANNER_ENDPOINT}?lastId=${nextLastId}`,
                        body: { correlationId },
                        delay: 2,
                        retries: 3,
                        headers: { 'Content-Type': 'application/json' },
                    });
                } catch (e) {
                    console.error(`[JobService] Failed to trigger next batch`, e);
                }
            }

            // Log completion
            const processingTimeMs = Date.now() - startTime;
            await logScannerBatch({
                correlationId,
                status: 'completed',
                lastId,
                batchSize,
                hasMore,
            });

            return {
                success: true,
                message: 'Batch processed successfully',
                processed: batchSize,
                nextLastId,
                hasMore,
                correlationId,
                batchStartId: students[0]?.id || lastId,
                batchEndId: nextLastId,
                processingTimeMs,
            };

        } catch (error) {
            console.error("[JobService] scanStudentsForReports error:", error);
            return { success: false, error: "Failed to process scanner batch" };
        }
    }

    async generateReportForStudent(params: { studentId: string; correlationId: string }): Promise<any> {
        const { studentId, correlationId } = params;
        const processingStartTime = Date.now();
        const GEMINI_TIMEOUT_MS = 30000;

        try {
            // Log worker started
            await logWorkerProcessing({ correlationId, studentId, status: "started" });

            const weekEnd = new Date();
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);

            // Fetch student and account info
            const studentInfo = await this.repository.getStudentWithAccount(studentId);
            if (!studentInfo) {
                await logWorkerProcessing({ correlationId, studentId, status: "failed", error: "Student not found" });
                return { success: false, error: "Student not found", status: 404 };
            }

            const { student, account } = studentInfo;

            // Fetch Activity
            const activity = await this.repository.getStudentActivity(studentId, weekStart, weekEnd);
            const { quizzes: quizzesList, bookmarks: totalBookmarks, notifications: notificationsData } = activity;

            // Process Topics
            const subjectIds = Array.from(new Set(quizzesList.map((q: any) => q.providerSubjectId).filter((id): id is string => !!id)));
            const topicsList = await this.repository.getTopicsBySubjectIds(subjectIds);
            const topicBySubjectId = new Map(topicsList.map(t => [String(t.subjectId), t.name]));

            const completedQuizzes = quizzesList.filter((q: any) => q.status === "completed");
            const totalQuizzes = completedQuizzes.length;
            const averageScore = totalQuizzes > 0 ? completedQuizzes.reduce((sum: number, q: any) => sum + (Number(q.score) || 0), 0) / totalQuizzes : 0;
            const topicsStudied = [...new Set(completedQuizzes.map((q: any) => topicBySubjectId.get(String(q.providerSubjectId))).filter((name): name is string => !!name))];

            const readNotifications = notificationsData.filter((n: any) => n.markAsRead).length;
            const totalNotifications = notificationsData.length;
            const engagementRate = totalNotifications > 0 ? (readNotifications / totalNotifications) * 100 : 0;

            const activitySummary = {
                weekRange: `${weekStart.toLocaleDateString("az-AZ")} - ${weekEnd.toLocaleDateString("az-AZ")}`,
                quizzes: {
                    totalAttempts: totalQuizzes,
                    averageScore: Math.round(averageScore * 100) / 100,
                    topicsStudied: topicsStudied.slice(0, 5),
                    quizDetails: completedQuizzes.slice(0, 10).map((q: any) => ({
                        topicName: topicBySubjectId.get(String(q.providerSubjectId)) || "Unknown",
                        score: q.score || 0
                    }))
                },
                bookmarks: { totalBookmarks },
                notifications: { totalReceived: totalNotifications, totalRead: readNotifications, engagementRate: Math.round(engagementRate) },
                account: { accountAge: account?.createdAt ? Math.floor((Date.now() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0 }
            };

            // No Activity Case
            if (totalQuizzes === 0 && totalBookmarks === 0 && totalNotifications === 0) {
                const noActivityReport: StudentReportData = {
                    score: 0,
                    summary: "Bu həftə heç bir aktivlik qeydə alınmayıb.",
                    recommendations: [
                        "Testləri keçməyə başlayın",
                        "Dərslərə baxın və materialları öyrənin",
                        "Hər gün ən azı 15 dəqiqə təhsil fəaliyyəti həyata keçirin",
                    ],
                };
                const saved = await this.repository.saveStudentReport({
                    studentAccountId: studentId,
                    reportData: noActivityReport,
                    generatedAt: new Date(),
                    weekStart,
                    weekEnd,
                    workspaceId: student.id,
                });

                await logWorkerProcessing({ correlationId, studentId, status: "completed", processingTimeMs: Date.now() - processingStartTime, reportId: saved.id });
                return { success: true, reportId: saved.id, message: "No activity report generated" };
            }

            // Gemini Generation
            const geminiStartTime = Date.now();
            const reportSchema = {
                type: SchemaType.OBJECT,
                properties: {
                    score: { type: SchemaType.NUMBER, description: "Overall performance score from 0 to 100" },
                    summary: { type: SchemaType.STRING, description: "Weekly activity summary in Azerbaijani language" },
                    recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Array of personalized recommendations in Azerbaijani" },
                },
                required: ["score", "summary", "recommendations"],
            };

            const prompt = `Sən bir təhsil platforması üçün tələbələrin həftəlik hesabatlarını yaradan köməkçisən.
Tələbə ID: ${studentId}
Həftə: ${activitySummary.weekRange}
AKTIVLIKLƏR:
- Testlər: ${activitySummary.quizzes.totalAttempts} test keçib
- Orta bal: ${activitySummary.quizzes.averageScore}/100
- Öyrənilən mövzular: ${activitySummary.quizzes.topicsStudied.join(", ") || "Yoxdur"}
- Əlfəcinlər: ${activitySummary.bookmarks.totalBookmarks}
- Bildirişlər: ${activitySummary.notifications.totalReceived} alınıb, ${activitySummary.notifications.totalRead} oxunub
- Hesab yaşı: ${activitySummary.account.accountAge} gün
TEST DETALLLARI:
${activitySummary.quizzes.quizDetails.map((q, i) => `${i + 1}. ${q.topicName}: ${q.score} bal`).join("\n")}
TAPŞIRIQ:
Tələbənin performansını təhlil et və həftəlik hesabat hazırla. Hesabat Azərbaycan dilində olmalıdır.
- "score": 0-100 arası ümumi performans balı (testlərin orta balına, aktivliyə və məşğuliyyətə əsasən)
- "summary": 2-3 cümlədən ibarət qısa xülasə (nələr etdi, nə qədər uğurlu oldu)
- "recommendations": 3-5 şəxsi tövsiyə (nəyi yaxşılaşdırmaq lazımdır, hansı mövzulara diqqət yetirmək lazımdır)
Müsbət və motivasiya edici ton işlət. Tələbənin güclü və zəif tərəflərini qeyd et.`;

            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: { responseMimeType: "application/json", responseSchema: reportSchema as ObjectSchema, temperature: 0.7 },
            });

            const genResult = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), GEMINI_TIMEOUT_MS))
            ]) as any;

            const responseText = genResult.response.text();
            const reportData: StudentReportData = JSON.parse(responseText);

            // Save Report
            const savedReport = await this.repository.saveStudentReport({
                studentAccountId: studentId,
                reportData,
                generatedAt: new Date(),
                weekStart,
                weekEnd,
                workspaceId: student.id,
            });

            const totalProcessingTime = Date.now() - processingStartTime;
            await logWorkerProcessing({
                correlationId,
                studentId,
                status: "completed",
                processingTimeMs: totalProcessingTime,
                geminiResponseTimeMs: Date.now() - geminiStartTime,
                reportId: savedReport.id,
            });

            return { success: true, reportId: savedReport.id };

        } catch (error) {
            console.error("[JobService] generateReportForStudent error:", error);
            await logWorkerProcessing({ correlationId, studentId, status: "failed", error: error instanceof Error ? error.message : "Unknown" });
            return { success: false, error: "Report generation failed" };
        }
    }

    async generateQuestionsForTopic(params: TopicWorkerRequest): Promise<any> {
        const { topicId, correlationId, questionsToGenerate } = params;
        const processingStartTime = Date.now();

        try {
            // Log worker started
            await logTopicWorker({
                correlationId,
                topicId,
                status: "started",
            });

            // Fetch topic data using Repository
            const topic = await this.repository.getTopicById(topicId);

            if (!topic) {
                await logTopicWorker({
                    correlationId,
                    topicId,
                    status: "failed",
                    error: "Topic not found",
                });
                return { success: false, error: "Topic not found", status: 404 };
            }

            // Calculate actual questions to generate
            const currentStats = Number(topic.topicGeneralQuestionsStats || 0);
            const capacity = Number(topic.topicEstimatedQuestionsCapacity || 0);
            const remaining = capacity - currentStats;

            // If already at capacity, skip
            if (remaining <= 0) {
                await logTopicWorker({
                    correlationId,
                    topicId,
                    status: "completed",
                    questionsGenerated: 0,
                    currentStats,
                    capacity,
                });
                return {
                    success: true,
                    questionsGenerated: 0,
                    currentStats,
                    capacity,
                    message: "Topic already at capacity",
                };
            }

            // Don't generate more than remaining capacity
            const toGenerate = Math.min(questionsToGenerate, remaining);

            // NOTE: Original code had generation logic commented out.
            // We preserve the worker structure but keep it as a placeholder.
            const questionsGenerated = 0; // Placeholder
            const newStats = currentStats + questionsGenerated;
            const totalProcessingTime = Date.now() - processingStartTime;

            // Log success
            await logTopicWorker({
                correlationId,
                topicId,
                status: "completed",
                questionsGenerated,
                processingTimeMs: totalProcessingTime,
                currentStats: newStats,
                capacity,
            });

            return {
                success: true,
                questionsGenerated,
                currentStats: newStats,
                capacity,
                message: "Refactored worker placeholder (original logic was disabled)"
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("[JobService] generateQuestionsForTopic error:", error);
            await logTopicWorker({
                correlationId,
                topicId,
                status: "failed",
                error: errorMessage,
            });
            return { success: false, error: `Question generation error: ${errorMessage}` };
        }
    }

    async getWorkerStats(): Promise<JobStatsResponse> {
        // Query for report generation stats
        const reportStatsQuery = `
          ['${AXIOM_BACKGROUND_JOB_DATASET}']
          | where jobType in ('scanner', 'worker')
          | where _time >= ago(30d)
          | summarize
              totalRuns = count(),
              successfulRuns = countif(status == 'completed'),
              failedRuns = countif(status == 'failed'),
              lastRun = max(_time)
        `;

        // Query for question generation stats
        const questionStatsQuery = `
          ['${AXIOM_BACKGROUND_JOB_DATASET}']
          | where jobType in ('topic-scanner', 'topic-worker')
          | where _time >= ago(30d)
          | summarize
              totalRuns = count(),
              successfulRuns = countif(status == 'completed'),
              failedRuns = countif(status == 'failed'),
              lastRun = max(_time)
        `;

        // Query for recent activity
        const recentActivityQuery = `
          ['${AXIOM_BACKGROUND_JOB_DATASET}']
          | where jobType in ('scanner', 'worker', 'topic-scanner', 'topic-worker')
          | where _time >= ago(24h)
          | order by _time desc
          | limit 20
          | project _time, jobType, status
        `;

        try {
            // Execute queries in parallel
            const [reportStatsResult, questionStatsResult, recentActivityResult] = await Promise.all([
                axiomClient.query(reportStatsQuery),
                axiomClient.query(questionStatsQuery),
                axiomClient.query(recentActivityQuery),
            ]);

            // Parse report generation stats
            const reportStats: JobStats = {
                jobType: "Report Generation",
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                successRate: 0,
                avgProcessingTime: 0,
                lastRun: null,
            };

            if (reportStatsResult.matches && reportStatsResult.matches.length > 0) {
                const data = reportStatsResult.matches[0].data as any;
                reportStats.totalRuns = data.totalRuns || 0;
                reportStats.successfulRuns = data.successfulRuns || 0;
                reportStats.failedRuns = data.failedRuns || 0;
                reportStats.successRate = reportStats.totalRuns > 0 ? (reportStats.successfulRuns / reportStats.totalRuns) * 100 : 0;
                reportStats.lastRun = data.lastRun ? new Date(data.lastRun) : null;
            }

            // Parse question generation stats
            const questionStats: JobStats = {
                jobType: "Question Generation",
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                successRate: 0,
                avgProcessingTime: 0,
                lastRun: null,
            };

            if (questionStatsResult.matches && questionStatsResult.matches.length > 0) {
                const data = questionStatsResult.matches[0].data as any;
                questionStats.totalRuns = data.totalRuns || 0;
                questionStats.successfulRuns = data.successfulRuns || 0;
                questionStats.failedRuns = data.failedRuns || 0;
                questionStats.successRate = questionStats.totalRuns > 0 ? (questionStats.successfulRuns / questionStats.totalRuns) * 100 : 0;
                questionStats.lastRun = data.lastRun ? new Date(data.lastRun) : null;
            }

            // Parse recent activity
            const recentActivity: JobStatsResponse["recentActivity"] = [];
            if (recentActivityResult.matches) {
                for (const match of recentActivityResult.matches) {
                    const data = match.data as any;
                    recentActivity.push({
                        timestamp: new Date(data._time),
                        jobType: data.jobType,
                        status: data.status,
                        duration: undefined,
                    });
                }
            }

            // Build overview
            const overview: JobStatsOverview = {
                reportGeneration: reportStats,
                questionGeneration: questionStats,
                totalQueueDepth: 0,
            };

            return {
                overview,
                recentActivity,
            };
        } catch (error) {
            console.error("[JobService] getWorkerStats error:", error);
            throw error;
        }
    }

    async handleQuestionGeneratorWebhook() {
        try {
            // Use system account ID (1) for automated background generation
            const SYSTEM_ACCOUNT_ID = 1;
            return await this.processQuestionQueue(SYSTEM_ACCOUNT_ID);
        } catch (error) {
            this.handleError(error, "handleQuestionGeneratorWebhook");
            return {
                message: "Failed to process question queue webhook",
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }

    async processQuestionQueue(accountId: number): Promise<any> {
        const results = [];
        let totalGenerated = 0;

        try {
            // Fetch topics that need question generation
            const topicsToProcess = await this.repository.getTopicsToProcessForAi(10);

            if (topicsToProcess.length === 0) {
                return {
                    message: "No topics to process",
                    processed: 0,
                };
            }

            // Process each topic
            for (const topic of topicsToProcess) {
                try {
                    const remaining = topic.topicQuestionsRemainingToGenerate || 0;
                    if (remaining <= 0) continue;

                    // Determine batch size (at least 10 questions per batch, or remaining if less)
                    const batchSize = Math.min(remaining, 10);

                    // Fetch subject context
                    const subjectContext = await QuestionGenerationService.fetchSubjectContext(
                        Number(topic.providerSubjectId || 0),
                    );

                    const language = "azerbaijani";
                    // Convert topic to TopicData format
                    const topicData: any = {
                        id: topic.id,
                        name: topic.name,
                        body: topic.description,
                        aiSummary: topic.aiSummary,
                        pdfS3Key: topic.pdfS3Key,
                        pdfPageStart: topic.pdfPageStart as number | null,
                        pdfPageEnd: topic.pdfPageEnd as number | null,
                        subjectId: topic.providerSubjectId as any,
                        gradeLevel: topic.gradeLevel as number | null,
                        topicQuestionsRemainingToGenerate: topic.topicQuestionsRemainingToGenerate as number | null,
                        topicGeneralQuestionsStats: topic.topicGeneralQuestionsStats as number | null,
                    };

                    // Generate questions (medium complexity by default for queue)
                    const generatedQuestions = await QuestionGenerationService.generateQuestionsForTopic({
                        topicData,
                        subjectContext,
                        complexity: "medium",
                        language,
                        count: batchSize,
                        mode: "auto",
                    });

                    // Save questions and update topic stats
                    const saveResult = await QuestionGenerationService.saveQuestions({
                        generatedQuestions: generatedQuestions as any[],
                        accountId,
                        topicName: topic.name ?? "Untitled Topic",
                        topicId: topic.id ?? undefined,
                        subjectId: topic.providerSubjectId ?? undefined,
                        gradeLevel: topic.gradeLevel ?? undefined,
                        complexity: "medium",
                        language,
                        modelName: "gemini-2.0-flash-exp",
                        actionName: "ai_queue_generate_question",
                    });

                    totalGenerated += saveResult.savedQuestions.length;
                    results.push({
                        topicId: topic.id,
                        topicName: topic.name ?? "Untitled Topic",
                        questionsGenerated: saveResult.savedQuestions.length,
                        remaining: (topic.topicQuestionsRemainingToGenerate || 0) - saveResult.savedQuestions.length,
                    });
                } catch (topicError) {
                    results.push({
                        topicId: topic.id,
                        topicName: topic.name,
                        error: "Failed to process topic",
                    });
                }
            }

            return {
                message: "Queue processing completed",
                topicsProcessed: results.length,
                totalQuestionsGenerated: totalGenerated,
                results,
            };
        } catch (error) {
            this.handleError(error, "processQuestionQueue");
            throw error;
        }
    }
}
