import { QuizRepository } from "./quiz.repository";
import {
    type QuestionEntity,
    type UserAnswer,
    type QuizResult,
    type QuizResultDetail,
    type QuizAiReport,
    type QuizPerformanceAnalytics,
} from "../activity/activity.types";
import { BaseService } from "../base/base.service";
import { AuthContext } from "@/lib/domain/base/types";
import { Database } from "@/lib/database";
import { genAI, GEMINI_MODELS } from "@/lib/integrations/google/gemini.client";
import { providerQuestions as questionsTable, providerSubjects, providerSubjectTopics, studentQuizReports } from "@/lib/database/schema";
import { inArray, eq, and, sql } from "drizzle-orm";
import { PromptFlowType } from "@/lib/domain/ai-prompt/intelligence.types";
import { SystemPromptService } from "../ai-prompt/system-prompt.service";
import { SemanticMasteryService } from "../semantic-mastery/semantic-mastery.service";
import { SearchService } from "../search/search.service";

/**
 * QuizService - Manages quiz lifecycle, scoring, analysis, and mastery tracking
 */
export class QuizService extends BaseService {
    constructor(
        private readonly repository: QuizRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
        private readonly systemPrompts: SystemPromptService,
        private readonly semanticMastery: SemanticMasteryService,
        private readonly searchService?: SearchService,
    ) {
        super();
    }

    async start(accountId: string, workspaceId: string, params: {
        subjectId?: string | null;
        gradeLevel?: string | number | null;
        complexity?: string | null;
        language?: string | null;
        questionCount?: number | string;
    }) {
        try {
            const {
                subjectId = null,
                gradeLevel = null,
                complexity = null,
                language = null,
                questionCount = 25,
            } = params;

            const validQuestionCount = Math.min(
                Math.max(Number(questionCount) || 25, 1),
                25,
            );

            // Try ParadeDB (Neon) first, fall back to Supabase
            let selectedQuestions: Record<string, unknown>[] = [];

            if (this.searchService) {
                selectedQuestions = await this.searchService.getQuestionsForQuiz({
                    workspaceId,
                    limit: validQuestionCount,
                    subjectId,
                    gradeLevel: gradeLevel ? Number(gradeLevel) : null,
                    complexity,
                    language,
                });
            }

            // Fallback to Supabase if ParadeDB returned nothing
            if (selectedQuestions.length === 0) {
                const conditions = [eq(questionsTable.isPublished, true)];
                if (subjectId) conditions.push(eq(questionsTable.providerSubjectId, subjectId));
                if (gradeLevel) conditions.push(eq(questionsTable.gradeLevel, Number(gradeLevel)));
                if (complexity) conditions.push(eq(questionsTable.complexity, complexity));
                if (language) conditions.push(eq(questionsTable.language, language));

                selectedQuestions = await this.db.select()
                    .from(questionsTable)
                    .where(and(...conditions))
                    .orderBy(sql`RANDOM()`)
                    .limit(validQuestionCount);
            }

            if (selectedQuestions.length === 0) {
                return { success: false, error: "No questions found matching criteria" };
            }

            const newQuiz = await this.repository.create({
                studentAccountId: accountId,
                workspaceId: workspaceId,
                providerSubjectId: subjectId,
                gradeLevel: gradeLevel ? Number(gradeLevel) : null,
                language: language,
                totalQuestions: selectedQuestions.length,
                status: "in_progress",
                startedAt: new Date(),
                questions: selectedQuestions.map(q => q.id as string),
                snapshotQuestions: selectedQuestions,
                snapshotSubjectTitle: null, // Context removed from DB
                snapshotTopicTitle: null, // Context removed from DB
            });

            const questionsForUser = selectedQuestions.map((q) => ({
                id: q.id as string,
                body: (q.question as string) || null,
                answers: q.answers,
                complexity: (q.complexity as string) || null,
                grade_level: (q.gradeLevel as number) || null,
            }));

            return {
                success: true as const,
                data: {
                    id: newQuiz.id,
                    provider_subject_id: newQuiz.providerSubjectId,
                    grade_level: newQuiz.gradeLevel,
                    language: newQuiz.language,
                    total_questions: selectedQuestions.length,
                    questions: questionsForUser,
                }
            };
        } catch (error) {
            this.handleError(error, "startQuiz");
            return { success: false as const, error: "Failed to start quiz" };
        }
    }

    async getDetail(quizId: string) {
        try {
            const quiz = await this.repository.findById(quizId);
            if (!quiz) return { success: false as const, error: "Quiz not found" };
            return { success: true as const, data: quiz };
        } catch (error) {
            this.handleError(error, "getQuizDetail");
            return { success: false as const, error: "Failed to get quiz detail" };
        }
    }

    async list(accountId: string, params: { page?: number; pageSize?: number; status?: string; subjectId?: string; workspaceId?: string }) {
        try {
            const page = params.page || 1;
            const pageSize = params.pageSize || 20;
            const offset = (page - 1) * pageSize;

            const [quizzes, total] = await Promise.all([
                this.repository.list({
                    accountId,
                    status: params.status,
                    providerSubjectId: params.subjectId,
                    workspaceId: params.workspaceId,
                    limit: pageSize,
                    offset
                }),
                this.repository.count({
                    accountId,
                    status: params.status,
                    providerSubjectId: params.subjectId,
                    workspaceId: params.workspaceId
                })
            ]);

            const subjectIds = Array.from(new Set(quizzes.map(q => q.providerSubjectId).filter(id => id))) as string[];
            let subjectsMap = new Map<string, { id: string, name: string | null, slug: string | null }>();

            if (subjectIds.length > 0) {
                const subjects = await this.db
                    .select({ id: providerSubjects.id, name: providerSubjects.name, slug: providerSubjects.slug })
                    .from(providerSubjects)
                    .where(inArray(providerSubjects.id, subjectIds));
                subjectsMap = new Map(subjects.map(s => [s.id, s]));
            }

            const enrichedQuizzes = quizzes.map(quiz => ({
                ...quiz,
                subjectTitle: quiz.providerSubjectId ? subjectsMap.get(quiz.providerSubjectId)?.name : null,
                subjectSlug: quiz.providerSubjectId ? subjectsMap.get(quiz.providerSubjectId)?.slug : null,
            }));

            return {
                success: true,
                data: {
                    quizzes: enrichedQuizzes,
                    pagination: {
                        page,
                        pageSize,
                        total,
                        totalPages: Math.ceil(total / pageSize)
                    }
                }
            };
        } catch (error) {
            this.handleError(error, "listQuizzes");
            return { success: false, error: "Failed to list quizzes" };
        }
    }

    async submit(quizId: string, accountId: string, answers: UserAnswer[], analytics?: QuizPerformanceAnalytics) {
        try {
            const quiz = await this.repository.findById(quizId);
            if (!quiz) return { success: false, error: "Quiz not found" };
            if (quiz.studentAccountId !== accountId) return { success: false, error: "Access denied" };
            if (quiz.status === "completed") return { success: false, error: "Quiz already completed" };

            const snapshotQuestions = (quiz.snapshotQuestions || []) as QuestionEntity[];
            const legacyQuestions = (quiz.questions || []) as (string | QuestionEntity)[];
            const rawQuestions = snapshotQuestions.length > 0 ? snapshotQuestions : legacyQuestions;
            const questionIds = rawQuestions.map((q) => typeof q === 'string' ? q : String(q.id));
            if (questionIds.length === 0) return { success: false, error: "No questions found in quiz" };

            const questions = snapshotQuestions.length > 0 ? snapshotQuestions : [];
            const questionsFromDb = await this.db
                .select({
                    id: questionsTable.id,
                    question: questionsTable.question,
                    correctAnswer: questionsTable.correctAnswer,
                    complexity: questionsTable.complexity,
                    answers: questionsTable.answers,
                    explanationGuide: questionsTable.explanationGuide
                })
                .from(questionsTable)
                .where(inArray(questionsTable.id, questionIds));

            const correctAnswerMap = new Map(
                questionsFromDb.map((q) => [
                    String(q.id),
                    {
                        correctAnswer: q.correctAnswer || "",
                        question: q.question || "",
                        complexity: q.complexity || "",
                        answers: (q.answers as string[]) || [],
                        explanationGuide: q.explanationGuide,
                    },
                ])
            );

            let correctAnswersCount = 0;
            let totalAnswered = 0;
            const detailedResults: QuizResultDetail[] = [];
            const answerMap = new Map(answers.map((a) => [String(a.questionId), a]));

            const convertLetterToAnswer = (letter: string, answersArray: unknown): string => {
                if (!letter || !answersArray || !Array.isArray(answersArray)) return letter;
                const index = letter.charCodeAt(0) - "A".charCodeAt(0);
                if (index < 0 || index >= answersArray.length) return letter;
                return (answersArray[index] as string) || letter;
            };

            const iteratorIds = questions.length > 0 ? questions.map(q => q.id) : questionIds;

            iteratorIds.forEach((qId) => {
                const questionKey = String(qId);
                const dbQuestion = correctAnswerMap.get(questionKey);
                const snapshotQ = questions.find(q => q.id === qId);
                const correctAnswer = dbQuestion?.correctAnswer || "";
                const questionBody = snapshotQ?.question || dbQuestion?.question || "";
                const answersArray = (dbQuestion?.answers) || [];
                const userAnswer = answerMap.get(questionKey);

                if (userAnswer) {
                    totalAnswered++;
                    const userAnswerText = convertLetterToAnswer(userAnswer.selectedAnswer, answersArray);
                    const isCorrect = userAnswerText === correctAnswer;
                    if (isCorrect) correctAnswersCount++;

                    detailedResults.push({
                        question_id: qId,
                        question_body: questionBody,
                        user_answer: userAnswerText,
                        user_answer_letter: userAnswer.selectedAnswer,
                        correct_answer: correctAnswer,
                        is_correct: isCorrect,
                        time_spent: userAnswer.timeSpent || 0,
                        complexity: snapshotQ?.complexity || dbQuestion?.complexity,
                        explanation: (dbQuestion?.explanationGuide as { body?: string; text?: string })?.body ?? (dbQuestion?.explanationGuide as { body?: string; text?: string })?.text ?? (dbQuestion?.explanationGuide as string) ?? "",
                    });
                } else {
                    detailedResults.push({
                        question_id: qId,
                        question_body: questionBody,
                        user_answer: null,
                        user_answer_letter: null,
                        correct_answer: correctAnswer,
                    });
                }
            });

            const totalQuestions = Number(quiz.totalQuestions) || iteratorIds.length;
            const score = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;
            const totalTimeSpent = answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

            const resultData: QuizResult = {
                score,
                correct_answers: correctAnswersCount,
                total_questions: totalQuestions,
                total_answered: totalAnswered,
                unanswered: totalQuestions - totalAnswered,
                total_time_spent: totalTimeSpent,
                average_time_per_question: totalAnswered > 0 ? totalTimeSpent / totalAnswered : 0,
                completed_at: new Date().toISOString(),
                details: detailedResults,
            };

            const result = await this.repository.update(quizId, {
                status: "completed",
                completedAt: new Date(),
                score: score,
                correctAnswers: correctAnswersCount,
                userAnswers: answers,
                result: resultData,
                performanceAnalytics: analytics,
            });

            this.updateStudentMastery(accountId, quiz.workspaceId, resultData, rawQuestions).catch(err => {
                this.handleError(err, "submitQuiz.triggerMastery");
            });

            return { success: true, data: result };
        } catch (error) {
            this.handleError(error, "submitQuiz");
            return { success: false, error: "Failed to submit quiz" };
        }
    }

    async delete(quizId: string, accountId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const success = await this.repository.delete(quizId, accountId);
            if (!success) return { success: false, error: "Quiz not found or access denied" };
            return { success: true };
        } catch (error) {
            this.handleError(error, "deleteQuiz");
            return { success: false, error: "Failed to delete quiz" };
        }
    }

    async analyze(quizId: string, locale: string = 'en'): Promise<{ success: boolean; data?: typeof studentQuizReports.$inferSelect; error?: string }> {
        try {
            const quiz = await this.repository.findById(quizId);
            if (!quiz) return { success: false, error: "Quiz not found" };
            if (quiz.status !== 'completed') return { success: false, error: "Quiz is not completed yet" };

            const quizData = {
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                correctAnswers: quiz.correctAnswers,
                questions: quiz.questions,
                userAnswers: quiz.userAnswers,
            };

            const aiCrib = await this.getEffectiveCrib({
                subjectId: quiz.providerSubjectId || undefined,
            });

            const prompt = await this.systemPrompts.getEffectivePromptResult(PromptFlowType.STUDENT_QUIZ_SUMMARY, {
                score: quizData.score || 0,
                correctAnswers: quizData.correctAnswers || 0,
                totalQuestions: quizData.totalQuestions || 0,
                questionsData: JSON.stringify(quizData.questions),
                locale,
                aiCrib
            });

            const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.PRO_002 });
            const aiResult = await model.generateContent([{ text: prompt }]);
            const response = await aiResult.response.text();

            let reportData: QuizAiReport;
            try {
                const cleaned = response.replace(/```json\n?/, '').replace(/```/, '').trim();
                reportData = JSON.parse(cleaned) as QuizAiReport;
            } catch {
                reportData = { reportText: response, learningInsights: { strengths: [], gaps: [], recommendations: [] } };
            }

            const report = await this.repository.createReport({
                quizId,
                studentAccountId: quiz.studentAccountId,
                workspaceId: quiz.workspaceId,
                reportText: reportData.reportText,
                learningInsights: reportData.learningInsights,
            });

            await this.repository.update(quizId, {
                aiReport: reportData
            });

            this.semanticMastery.processActivityProgress({
                studentAccountId: quiz.studentAccountId!,
                workspaceId: quiz.workspaceId,
                providerWorkspaceId: quiz.workspaceId,
                textContent: reportData.reportText || response
            }).catch(err => this.handleError(err, "analyzeQuiz.semanticMastery"));

            return { success: true, data: report };
        } catch (error) {
            this.handleError(error, "analyzeQuiz");
            return { success: false, error: "Failed to analyze quiz" };
        }
    }

    async getStudentProgress(accountId: string, subjectId?: string) {
        try {
            const masteryRecords = subjectId
                ? await this.repository.findMasteryBySubject(accountId, subjectId)
                : [];
            return { success: true, data: masteryRecords };
        } catch (error) {
            this.handleError(error, "getStudentProgress");
            return { success: false, error: "Failed to fetch progress" };
        }
    }

    private async getEffectiveCrib(params: {
        questionId?: string;
        topicId?: string;
        subjectId?: string;
        homeworkId?: string;
    }) {
        const cribs: string[] = [];

        if (params.questionId) {
            const q = await this.db.select({ crib: questionsTable.aiGuide }).from(questionsTable).where(eq(questionsTable.id, params.questionId)).limit(1);
            if (q[0]?.crib) cribs.push(q[0].crib);
        }

        let topicId = params.topicId;
        let subjectId = params.subjectId;

        if (params.questionId && !topicId) {
            const qData = await this.db.select({ tid: questionsTable.providerSubjectTopicId, sid: questionsTable.providerSubjectId }).from(questionsTable).where(eq(questionsTable.id, params.questionId)).limit(1);
            if (qData[0]) {
                topicId = qData[0].tid || undefined;
                subjectId = qData[0].sid || undefined;
            }
        }

        if (topicId) {
            const t = await this.db.select({ crib: providerSubjectTopics.aiGuide, sid: providerSubjectTopics.providerSubjectId }).from(providerSubjectTopics).where(eq(providerSubjectTopics.id, topicId)).limit(1);
            if (t[0]?.crib) cribs.push(t[0].crib);
            if (!subjectId) subjectId = t[0]?.sid || undefined;
        }

        if (subjectId) {
            const s = await this.db.select({ crib: providerSubjects.aiGuide }).from(providerSubjects).where(eq(providerSubjects.id, subjectId)).limit(1);
            if (s[0]?.crib) cribs.push(s[0].crib);
        }

        return cribs.length > 0 ? cribs.join("\n\n---\n\n") : undefined;
    }

    private async updateStudentMastery(accountId: string, workspaceId: string, resultData: QuizResult, snapshotQuestions: (QuestionEntity | string)[]) {
        try {
            const topicPerformance: Record<string, { subjectId: string | null, correct: number, total: number, timeSpent: number }> = {};

            snapshotQuestions.forEach((rawQ) => {
                if (typeof rawQ === 'string') return;
                const q = rawQ as QuestionEntity & {
                    learningSubjectTopicId?: string;
                    topicId?: string;
                    learningSubjectId?: string;
                    subjectId?: string;
                };

                const topicId = q.providerSubjectTopicId || q.learningSubjectTopicId || q.topicId;
                if (!topicId) return;

                if (!topicPerformance[topicId]) {
                    topicPerformance[topicId] = {
                        subjectId: q.providerSubjectId || q.learningSubjectId || q.subjectId || null,
                        correct: 0,
                        total: 0,
                        timeSpent: 0
                    };
                }

                const details = resultData.details as { question_id: string; is_correct: boolean; time_spent: number }[];
                const answer = details.find((d) => d.question_id === q.id);
                if (answer) {
                    topicPerformance[topicId].total++;
                    if (answer.is_correct) topicPerformance[topicId].correct++;
                    topicPerformance[topicId].timeSpent += (answer.time_spent || 0);
                }
            });

            for (const [topicId, stats] of Object.entries(topicPerformance)) {
                const mastery = await this.repository.findMastery(accountId, topicId);
                const currentScore = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

                if (!mastery) {
                    await this.repository.createMastery({
                        studentAccountId: accountId,
                        workspaceId,
                        topicId,
                        providerSubjectId: stats.subjectId,
                        masteryScore: currentScore,
                        totalQuizzesTaken: 1,
                        questionsAttempted: stats.total,
                        questionsCorrect: stats.correct,
                        averageTimePerQuestion: stats.total > 0 ? stats.timeSpent / stats.total : 0,
                        lastAttemptAt: new Date(),
                        masteryTrend: [{ score: currentScore, date: new Date().toISOString() }]
                    });
                } else {
                    const totalAttempted = (mastery.questionsAttempted || 0) + stats.total;
                    const totalCorrect = (mastery.questionsCorrect || 0) + stats.correct;
                    const newQuizzesTaken = (mastery.totalQuizzesTaken || 0) + 1;
                    const newMasteryScore = ((mastery.masteryScore || 0) * 0.7) + (currentScore * 0.3);

                    const trend = ((mastery.masteryTrend as { score: number; date: string }[]) || []).slice(-9);
                    trend.push({ score: currentScore, date: new Date().toISOString() });

                    await this.repository.updateMastery(mastery.id, {
                        masteryScore: newMasteryScore,
                        totalQuizzesTaken: newQuizzesTaken,
                        questionsAttempted: totalAttempted,
                        questionsCorrect: totalCorrect,
                        lastAttemptAt: new Date(),
                        masteryTrend: trend,
                        updatedAt: new Date()
                    });
                }
            }
        } catch (err) {
            console.error("[QuizService] Error updating mastery:", err);
        }
    }
}
