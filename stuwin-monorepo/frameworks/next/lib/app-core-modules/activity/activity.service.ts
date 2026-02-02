import { ActivityRepository } from "./activity.repository";
import { SemanticMasteryService } from "../semantic-mastery/SemanticMasteryService";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";
import { genAI, GEMINI_MODELS } from "@/lib/integrations/geminiClient";
import { providerQuestions as questionsTable, studentQuizzes, studentAiSessions, providerSubjects, providerSubjectTopics, studentHomeworks } from "@/lib/app-infrastructure/database/schema";
import { inArray, eq, and, sql, desc, or } from "drizzle-orm";
// import { HOMEWORK_SESSION_SYSTEM_PROMPT, QUIZ_ANALYSIS_PROMPT, LEARNING_CONTEXT_PROMPT } from "@/lib/intelligence/activityPrompts";

import { PromptFlowType } from "@/lib/intelligence/fallbackPrompts";
import { SystemPromptService } from "../intelligence/system-prompt.service";

/**
 * ActivityService - Logic for managing quizzes, homework, and sessions
 */
export class ActivityService extends BaseService {
    constructor(
        private readonly repository: ActivityRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
        private readonly systemPrompts: SystemPromptService,
        private readonly semanticMastery: SemanticMasteryService
    ) {
        super();
    }

    async startQuiz(accountId: string, workspaceId: string, params: {
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

            // Prepare filters
            const conditions = [eq(questionsTable.isPublished, true)];

            if (subjectId) {
                conditions.push(eq(questionsTable.providerSubjectId, subjectId));
            }
            if (gradeLevel) {
                conditions.push(eq(questionsTable.gradeLevel, Number(gradeLevel)));
            }
            if (complexity) {
                conditions.push(eq(questionsTable.complexity, complexity));
            }
            if (language) {
                conditions.push(eq(questionsTable.language, language));
            }

            // Fetch random questions
            const selectedQuestions = await this.db.select()
                .from(questionsTable)
                .where(and(...conditions))
                .orderBy(sql`RANDOM()`)
                .limit(validQuestionCount);

            if (selectedQuestions.length === 0) {
                return { success: false, error: "No questions found matching criteria" };
            }

            // Create quiz
            const newQuiz = await this.repository.createQuiz({
                studentAccountId: accountId,
                workspaceId: workspaceId,
                providerSubjectId: subjectId,
                gradeLevel: gradeLevel ? Number(gradeLevel) : null,
                language: language,
                totalQuestions: selectedQuestions.length,
                status: "in_progress",
                startedAt: new Date(),
                questions: selectedQuestions.map(q => q.id), // Store IDs for legacy
                snapshotQuestions: selectedQuestions, // Immutable full snapshot
                snapshotSubjectTitle: selectedQuestions[0]?.context?.subjectName,
                snapshotTopicTitle: selectedQuestions[0]?.context?.topicName,
            });

            // Prepare questions for user (hide correct answers)
            const questionsForUser = selectedQuestions.map((q: any) => ({
                id: q.id,
                body: q.question,
                answers: q.answers,
                complexity: q.complexity,
                grade_level: q.gradeLevel,
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

    async getQuizDetail(quizId: string) {
        try {
            const quiz = await this.repository.findQuizById(quizId);
            if (!quiz) return { success: false as const, error: "Quiz not found" };
            return { success: true as const, data: quiz };
        } catch (error) {
            this.handleError(error, "getQuizDetail");
            return { success: false as const, error: "Failed to get quiz detail" };
        }
    }

    async listQuizzes(accountId: string, params: { page?: number; pageSize?: number; status?: string; subjectId?: string; workspaceId?: string }) {
        try {
            const page = params.page || 1;
            const pageSize = params.pageSize || 20;
            const offset = (page - 1) * pageSize;

            const [quizzes, total] = await Promise.all([
                this.repository.listQuizzes({
                    accountId,
                    status: params.status,
                    providerSubjectId: params.subjectId,
                    workspaceId: params.workspaceId,
                    limit: pageSize,
                    offset
                }),
                this.repository.countQuizzes({
                    accountId,
                    status: params.status,
                    providerSubjectId: params.subjectId,
                    workspaceId: params.workspaceId
                })
            ]);

            // Enrich with subject details
            const subjectIds = Array.from(new Set(quizzes.map(q => q.providerSubjectId).filter(id => id))) as string[];
            let subjectsMap = new Map();

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

    async submitQuiz(quizId: string, accountId: string, answers: any[], analytics?: any) {
        try {
            const quiz = await this.repository.findQuizById(quizId);
            if (!quiz) return { success: false, error: "Quiz not found" };
            if (quiz.studentAccountId !== accountId) return { success: false, error: "Access denied" };
            if (quiz.status === "completed") return { success: false, error: "Quiz already completed" };

            const rawQuestions = ((quiz as any).snapshotQuestions || quiz.questions || []) as any[];
            const questionIds = rawQuestions.map((q) => typeof q === 'string' ? q : String(q.id || q));
            if (questionIds.length === 0) return { success: false, error: "No questions found in quiz" };

            // Use snapshot questions if available, otherwise we'll use DB questions
            const questions = (quiz as any).snapshotQuestions || [];

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
                questionsFromDb.map((q: any) => [
                    String(q.id),
                    {
                        correctAnswer: q.correctAnswer || "",
                        question: q.question || "",
                        complexity: q.complexity || "",
                        answers: q.answers || [],
                        explanationGuide: q.explanationGuide,
                    },
                ])
            );

            let correctAnswersCount = 0;
            let totalAnswered = 0;
            const detailedResults: any[] = [];
            const answerMap = new Map(answers.map((a: any) => [String(a.questionId), a]));

            const convertLetterToAnswer = (letter: string, answersArray: any): string => {
                if (!letter || !answersArray || !Array.isArray(answersArray)) return letter;
                const index = letter.charCodeAt(0) - "A".charCodeAt(0);
                if (index < 0 || index >= answersArray.length) return letter;
                return answersArray[index] || letter;
            };

            questions.forEach((question: any) => {
                const questionKey = String(question.id);
                const dbQuestion = correctAnswerMap.get(questionKey);
                const correctAnswer = dbQuestion?.correctAnswer || "";
                const questionBody = question.body || dbQuestion?.question || "";
                const answersArray = (dbQuestion?.answers as string[]) || [];
                const userAnswer = answerMap.get(questionKey);

                if (userAnswer) {
                    totalAnswered++;
                    const userAnswerText = convertLetterToAnswer(userAnswer.selectedAnswer, answersArray);
                    const isCorrect = userAnswerText === correctAnswer;
                    if (isCorrect) correctAnswersCount++;
                    detailedResults.push({
                        question_id: question.id,
                        question_body: questionBody,
                        user_answer: userAnswerText,
                        user_answer_letter: userAnswer.selectedAnswer,
                        correct_answer: correctAnswer,
                        is_correct: isCorrect,
                        time_spent: userAnswer.timeSpent || 0,
                        complexity: question.complexity || dbQuestion?.complexity,
                        explanation: (dbQuestion?.explanationGuide as any)?.body ?? (dbQuestion?.explanationGuide as any)?.text ?? (dbQuestion?.explanationGuide as any) ?? "",
                    });
                } else {
                    detailedResults.push({
                        question_id: question.id,
                        question_body: questionBody,
                        user_answer: null,
                        user_answer_letter: null,
                        correct_answer: correctAnswer,
                    });
                }
            });

            const totalQuestions = Number(quiz.totalQuestions) || questions.length;
            const score = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;
            const totalTimeSpent = answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

            const resultData = {
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

            const result = await this.repository.updateQuiz(quizId, {
                status: "completed",
                completedAt: new Date(),
                score: score,
                correctAnswers: correctAnswersCount,
                userAnswers: answers,
                result: resultData,
                performanceAnalytics: analytics,
            });

            // Trigger Mastery Tracking (Asynchronous in background)
            this.updateStudentMastery(accountId, quiz.workspaceId, resultData, rawQuestions).catch(err => {
                this.handleError(err, "submitQuiz.triggerMastery");
            });

            return { success: true, data: result };
        } catch (error) {
            this.handleError(error, "submitQuiz");
            return { success: false, error: "Failed to submit quiz" };
        }
    }

    async deleteQuiz(quizId: string, accountId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const success = await this.repository.deleteQuiz(quizId, accountId);
            if (!success) return { success: false, error: "Quiz not found or access denied" };
            return { success: true };
        } catch (error) {
            this.handleError(error, "deleteQuiz");
            return { success: false, error: "Failed to delete quiz" };
        }
    }

    async submitHomework(accountId: string, data: { title: string; workspaceId: string; topicId?: string; description?: string; textContent?: string; media?: any[] }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            return await this.db.transaction(async (tx) => {
                const homework = await this.repository.createHomework({
                    studentAccountId: accountId,
                    title: data.title,
                    workspaceId: data.workspaceId,
                    topicId: data.topicId,
                    description: data.description,
                    textContent: data.textContent,
                    media: data.media || [],
                    status: "pending",
                }, tx as any);

                // Trigger Semantic Processing for Homework (Initial context)
                if (data.textContent || data.description) {
                    this.semanticMastery.processActivityProgress({
                        studentAccountId: accountId,
                        workspaceId: data.workspaceId,
                        providerWorkspaceId: data.workspaceId,
                        textContent: `${data.title}: ${data.description || ''} ${data.textContent || ''}`
                    }).catch(err => this.handleError(err, "submitHomework.semanticMastery"));
                }

                return { success: true, data: homework };
            });
        } catch (error) {
            this.handleError(error, "submitHomework");
            return { success: false, error: "Failed to submit homework" };
        }
    }

    async listHomeworks(accountId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const homeworks = await this.repository.listHomeworksByAccount(accountId);
            return { success: true, data: homeworks };
        } catch (error) {
            this.handleError(error, "listHomeworks");
            return { success: false, error: "Failed to list homeworks" };
        }
    }

    async getHomeworkDetail(homeworkId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const homework = await this.repository.findHomeworkById(homeworkId);
            if (!homework) return { success: false, error: "Homework not found" };
            return { success: true, data: homework };
        } catch (error) {
            this.handleError(error, "getHomeworkDetail");
            return { success: false, error: "Failed to get homework detail" };
        }
    }

    async initiateHomeworkAiSession(homeworkId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const homework = await this.repository.findHomeworkById(homeworkId);
            if (!homework) return { success: false, error: "Homework not found" };

            if (homework.aiSessionId) {
                const session = await this.repository.findAiSessionById(homework.aiSessionId);
                return { success: true, data: session };
            }

            // Fetch effective crib
            const aiCrib = await this.getEffectiveCrib({
                homeworkId: homework.id,
                topicId: homework.topicId || undefined,
            });

            const systemPrompt = await this.systemPrompts.getEffectivePromptResult(PromptFlowType.HOMEWORK_EXPLANATION, {

                homeworkTitle: homework.title,
                description: homework.description,
                textContent: homework.textContent,
                aiCrib
            });

            const session = await this.repository.createAiSession({
                workspaceId: homework.workspaceId,
                studentAccountId: homework.studentAccountId,
                homeworkId: homework.id,
                rootQuestion: `Working on: ${homework.title}`,
                digests: {
                    nodes: [
                        { role: 'system', content: systemPrompt },
                        { role: 'assistant', content: `Hello! I see you're working on "${homework.title}". How can I help you get started or which part is challenging for you right now?` }
                    ]
                },
                status: 'active',
                branchCount: 1,
                messageCount: 1,
            });

            // Link session to homework
            await this.repository.updateHomework(homework.id, { aiSessionId: session.id });

            return { success: true, data: session };
        } catch (error) {
            this.handleError(error, "initiateHomeworkSession");
            return { success: false, error: "Failed to initiate session" };
        }
    }

    async addMessageToAiSession(sessionId: string, userMessage: string) {
        try {
            const session = await this.repository.findAiSessionById(sessionId);
            if (!session) return { success: false, error: "Session not found" };

            const messages = (session.digests as any).nodes || [];

            // 1. Prepare history for Gemini
            const history = messages.map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : m.role,
                parts: [{ text: m.content }]
            }));

            // 2. Setup Gemini
            const model = genAI.getGenerativeModel({
                model: GEMINI_MODELS.FLASH_1_5,
                systemInstruction: messages.find((m: any) => m.role === 'system')?.content
            });

            const chat = model.startChat({
                history: history.filter((m: any) => m.role !== 'system'),
            });

            // 3. Generate response
            const result = await chat.sendMessage(userMessage);
            const aiResponse = result.response.text();

            // 4. Update session messages
            const updatedMessages = [
                ...messages,
                { role: 'user', content: userMessage, createdAt: new Date().toISOString() },
                { role: 'assistant', content: aiResponse, createdAt: new Date().toISOString() }
            ];

            await this.repository.updateAiSession(sessionId, {
                digests: { nodes: updatedMessages },
                messageCount: updatedMessages.length,
                totalTokensUsed: (session.totalTokensUsed || 0) + (result.response.usageMetadata?.totalTokenCount || 0)
            });

            return {
                success: true,
                data: {
                    answer: aiResponse,
                    sessionId
                }
            };
        } catch (error) {
            this.handleError(error, "addMessageToSession");
            return { success: false, error: "Failed to process chat message" };
        }
    }

    async analyzeQuiz(quizId: string, locale: string = 'en'): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const quiz = await this.repository.findQuizById(quizId);
            if (!quiz) return { success: false, error: "Quiz not found" };
            if (quiz.status !== 'completed') return { success: false, error: "Quiz is not completed yet" };

            // 1. Prepare data for AI
            const quizData = {
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                correctAnswers: quiz.correctAnswers,
                questions: quiz.questions,
                userAnswers: quiz.userAnswers,
            };

            // Fetch effective crib
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

            let reportData;
            try {
                // Clean markdown if AI wrapped it
                const cleaned = response.replace(/```json\n?/, '').replace(/```/, '').trim();
                reportData = JSON.parse(cleaned);
            } catch (e) {
                reportData = { reportText: response, learningInsights: { strengths: [], gaps: [], recommendations: [] } };
            }

            // 3. Save to DB
            const report = await this.repository.createQuizReport({
                quizId,
                studentAccountId: quiz.studentAccountId,
                workspaceId: quiz.workspaceId,
                reportText: reportData.reportText,
                learningInsights: reportData.learningInsights,
            });

            // 4. Update the Quiz itself with the report snapshot for semantic processing
            await this.repository.updateQuiz(quizId, {
                aiReport: reportData
            });

            // 5. Trigger Semantic DNA Synthesis
            this.semanticMastery.processActivityProgress({
                studentAccountId: quiz.studentAccountId!,
                workspaceId: quiz.workspaceId,
                providerWorkspaceId: quiz.workspaceId, // Assuming workspaceId is the provider for now, adjust if needed
                textContent: reportData.reportText || response
            }).catch(err => this.handleError(err, "analyzeQuiz.semanticMastery"));

            return { success: true, data: report };
        } catch (error) {
            this.handleError(error, "analyzeQuiz");
            return { success: false, error: "Failed to analyze quiz" };
        }
    }

    async getAiSession(accountId: string, contextId: string, contextType: 'quiz' | 'homework' | 'topic'): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const session = await this.repository.findActiveAiSession(accountId, contextId, contextType);
            if (!session) return { success: true, data: null };
            return { success: true, data: session };
        } catch (error) {
            this.handleError(error, "getSession");
            return { success: false, error: "Failed to get session" };
        }
    }

    async listAiSessions(accountId: string, status: string = 'active') {
        try {
            const sessions = await this.db
                .select()
                .from(studentAiSessions)
                .where(and(
                    eq(studentAiSessions.studentAccountId, accountId),
                    eq(studentAiSessions.status, status)
                ))
                .orderBy(desc(studentAiSessions.createdAt));
            return { success: true, data: sessions };
        } catch (error) {
            this.handleError(error, "listSessions");
            return { success: false, error: "Failed to list sessions" };
        }
    }

    async getAiSessionById(sessionId: string) {
        try {
            const session = await this.repository.findAiSessionById(sessionId);
            if (!session) return { success: false, error: "Session not found" };
            return { success: true, data: session };
        } catch (error) {
            this.handleError(error, "getSessionById");
            return { success: false, error: "Failed to get session by ID" };
        }
    }

    async analyzeLearningContext(data: {
        workspaceId: string;
        accountId: string;
        contextType: 'quiz' | 'homework' | 'topic';
        contextId: string;
        question: string;
        correctAnswer: string;
        userAnswer: string;
        subjectTitle?: string;
        complexity?: string;
        selectedText?: string;
        digests?: any[];
        parentDigestId?: string;
        regenerateDigestId?: string;
        locale?: string;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const {
                workspaceId, accountId, contextType, contextId,
                question, correctAnswer, userAnswer,
                subjectTitle, complexity, selectedText,
                digests = [], parentDigestId, regenerateDigestId, locale = 'en'
            } = data;

            // 1. Find or create session
            let session = await this.repository.findActiveAiSession(accountId, contextId, contextType);

            if (!session) {
                const sessionData: any = {
                    workspaceId,
                    studentAccountId: accountId,
                    rootQuestion: question,
                    digests: { nodes: [] },
                    status: 'active',
                    branchCount: 0,
                    messageCount: 0,
                };

                // polymorphic mapping
                if (contextType === 'quiz') sessionData.quizId = contextId;
                else if (contextType === 'homework') sessionData.homeworkId = contextId;
                else if (contextType === 'topic') sessionData.topicId = contextId;

                session = await this.repository.createAiSession(sessionData);
            }

            // 2. Prepare Context & Prompt
            let context = `
Topic: ${subjectTitle || 'General Mathematics'}
Complexity: ${complexity || 'Standard'}
Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
CONTEXT: This is a ${contextType} session.
`;

            if (selectedText) {
                context += `\nSPECIFIC FOCUS: The student wants to understand this specific part better: "${selectedText}"\n`;
            }

            // Add history from provided digests if any
            if (digests.length > 0) {
                const historyText = digests.map((d: any) => `Node [${d.id.slice(0, 4)}]: ${d.type.toUpperCase()} -> ${d.content}\nAI: ${d.aiResponse.slice(0, 200)}...`).join('\n---\n');
                context += `\n\nPrevious Discovery Paths (Summary):\n${historyText}\n`;
            }

            // Fetch effective crib
            const aiCrib = await this.getEffectiveCrib({
                questionId: contextId && contextType === 'topic' ? undefined : contextId, // ContextId might be question id in many cases
                subjectId: session.topicId ? (await this.db.select({ sid: providerSubjectTopics.providerSubjectId }).from(providerSubjectTopics).where(eq(providerSubjectTopics.id, session.topicId)).limit(1))[0]?.sid || undefined : undefined,
                topicId: session.topicId || undefined,
            });

            // Map contextType to fallback prompt flow type
            let flowType = PromptFlowType.QUESTION_EXPLANATION;
            if (contextType === 'topic') flowType = PromptFlowType.TOPIC_EXPLORATION;

            const prompt = await this.systemPrompts.getEffectivePromptResult(flowType, {

                contextType,
                subjectTitle: subjectTitle || 'General Mathematics',
                complexity: complexity || 'Standard',
                question,
                correctAnswer,
                userAnswer,
                selectedText: selectedText || undefined,
                historyText: digests.length > 0 ? context : undefined,
                locale,
                aiCrib
            });

            const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.FLASH_1_5 });
            const aiResult = await model.generateContent([{ text: prompt }]);
            const response = await aiResult.response.text();

            // 3. Create new digest node
            const newDigest = {
                id: regenerateDigestId || crypto.randomUUID(),
                parentId: parentDigestId || null,
                type: selectedText ? 'term' : 'analysis',
                content: selectedText || 'Full Analysis',
                aiResponse: response,
                createdAt: new Date().toISOString()
            };

            // 4. Update Session & Purge if regenerating
            let currentDigests = (session.digests as any)?.nodes || [];

            if (regenerateDigestId) {
                // BFS/DFS to find all descendants of the node being regenerated
                const toRemove = new Set<string>();
                const queue = [regenerateDigestId];

                while (queue.length > 0) {
                    const pid = queue.shift();
                    currentDigests.forEach((d: any) => {
                        if (d.parentId === pid) {
                            toRemove.add(d.id);
                            queue.push(d.id);
                        }
                    });
                }

                // Filter out descendants and the old version of the node itself
                currentDigests = currentDigests.filter((d: any) => d.id !== regenerateDigestId && !toRemove.has(d.id));
            }

            const updatedDigests = [...currentDigests, newDigest];

            await this.repository.updateAiSession(session.id, {
                digests: { nodes: updatedDigests },
                messageCount: (session.messageCount || 0) + 1,
                totalTokensUsed: (session.totalTokensUsed || 0) + (aiResult.response.usageMetadata?.totalTokenCount || 0)
            });

            return {
                success: true,
                data: {
                    explanation: response,
                    digest: newDigest,
                    session: {
                        ...session,
                        digests: { nodes: updatedDigests }
                    }
                }
            };
        } catch (error) {
            this.handleError(error, "analyzeQuizQuestion");
            return { success: false, error: "Failed to analyze question" };
        }
    }


    private async getEffectiveCrib(params: {
        questionId?: string;
        topicId?: string;
        subjectId?: string;
        homeworkId?: string;
    }) {
        const cribs: string[] = [];

        // 1. Question Crib
        if (params.questionId) {
            const q = await this.db.select({ crib: questionsTable.aiAssistantCrib }).from(questionsTable).where(eq(questionsTable.id, params.questionId)).limit(1);
            if (q[0]?.crib) cribs.push(q[0].crib);
        }

        // 2. Homework Crib
        if (params.homeworkId) {
            const h = await this.db.select({ crib: studentHomeworks.aiAssistantCrib }).from(studentHomeworks).where(eq(studentHomeworks.id, params.homeworkId)).limit(1);
            if (h[0]?.crib) cribs.push(h[0].crib);
        }

        // 3. Topic Crib (If only questionId provided, we should probably fetch its topic and subject too)
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
            const t = await this.db.select({ crib: providerSubjectTopics.aiAssistantCrib, sid: providerSubjectTopics.providerSubjectId }).from(providerSubjectTopics).where(eq(providerSubjectTopics.id, topicId)).limit(1);
            if (t[0]?.crib) cribs.push(t[0].crib);
            if (!subjectId) subjectId = t[0]?.sid || undefined;
        }

        // 4. Subject Crib
        if (subjectId) {
            const s = await this.db.select({ crib: providerSubjects.aiAssistantCrib }).from(providerSubjects).where(eq(providerSubjects.id, subjectId)).limit(1);
            if (s[0]?.crib) cribs.push(s[0].crib);
        }

        return cribs.length > 0 ? cribs.join("\n\n---\n\n") : undefined;
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

    private async updateStudentMastery(accountId: string, workspaceId: string, resultData: any, snapshotQuestions: any[]) {
        try {
            // Group performance by topic
            const topicPerformance: Record<string, { subjectId: string | null, correct: number, total: number, timeSpent: number }> = {};

            snapshotQuestions.forEach(q => {
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

                const answer = resultData.details.find((d: any) => d.question_id === q.id);
                topicPerformance[topicId].total++;
                if (answer?.is_correct) topicPerformance[topicId].correct++;
                topicPerformance[topicId].timeSpent += (answer?.time_spent || 0);
            });

            // Update each topic mastery record
            for (const [topicId, stats] of Object.entries(topicPerformance)) {
                let mastery = await this.repository.findMastery(accountId, topicId);

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

                    // Simple moving average for mastery score (30% weight to new attempt)
                    const newMasteryScore = ((mastery.masteryScore || 0) * 0.7) + (currentScore * 0.3);

                    const trend = ((mastery.masteryTrend as any[]) || []).slice(-9);
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
            console.error("[ActivityService] Error updating mastery:", err);
        }
    }
}
