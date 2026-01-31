import { ActivityRepository } from "./activity.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";
import { genAI, GEMINI_MODELS } from "@/lib/integrations/geminiClient";
import { questions as questionsTable, studentQuizzes, studentLearningSessions, learningSubjects } from "@/lib/app-infrastructure/database/schema";
import { inArray, eq, and, sql, desc } from "drizzle-orm";

/**
 * ActivityService - Logic for managing quizzes, homework, and sessions
 */
export class ActivityService extends BaseService {
    constructor(
        private readonly repository: ActivityRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database
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
                conditions.push(eq(questionsTable.learningSubjectId, subjectId));
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
                learningSubjectId: subjectId,
                gradeLevel: gradeLevel ? Number(gradeLevel) : null,
                language: language,
                totalQuestions: selectedQuestions.length,
                status: "in_progress",
                startedAt: new Date(),
                questions: selectedQuestions,
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
                    subject_id: newQuiz.learningSubjectId,
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
                    subjectId: params.subjectId,
                    workspaceId: params.workspaceId,
                    limit: pageSize,
                    offset
                }),
                this.repository.countQuizzes({
                    accountId,
                    status: params.status,
                    subjectId: params.subjectId,
                    workspaceId: params.workspaceId
                })
            ]);

            // Enrich with subject details
            const subjectIds = Array.from(new Set(quizzes.map(q => q.learningSubjectId).filter(id => id))) as string[];
            let subjectsMap = new Map();

            if (subjectIds.length > 0) {
                const subjects = await this.db
                    .select({ id: learningSubjects.id, name: learningSubjects.name, slug: learningSubjects.slug })
                    .from(learningSubjects)
                    .where(inArray(learningSubjects.id, subjectIds));
                subjectsMap = new Map(subjects.map(s => [s.id, s]));
            }

            const enrichedQuizzes = quizzes.map(quiz => ({
                ...quiz,
                subjectTitle: quiz.learningSubjectId ? subjectsMap.get(quiz.learningSubjectId)?.name : null,
                subjectSlug: quiz.learningSubjectId ? subjectsMap.get(quiz.learningSubjectId)?.slug : null,
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

    async submitQuiz(quizId: string, accountId: string, answers: any[]) {
        try {
            const quiz = await this.repository.findQuizById(quizId);
            if (!quiz) return { success: false, error: "Quiz not found" };
            if (quiz.studentAccountId !== accountId) return { success: false, error: "Access denied" };
            if (quiz.status === "completed") return { success: false, error: "Quiz already completed" };

            const questions = (quiz.questions as any[]) || [];
            const questionIds = questions.map((q) => String(q.id));
            if (questionIds.length === 0) return { success: false, error: "No questions found in quiz" };

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
                        explanation: (dbQuestion?.explanationGuide as any)?.body ?? (dbQuestion?.explanationGuide as any) ?? "",
                    });
                } else {
                    detailedResults.push({
                        question_id: question.id,
                        question_body: questionBody,
                        user_answer: null,
                        user_answer_letter: null,
                        correct_answer: correctAnswer,
                        is_correct: false,
                        time_spent: 0,
                        complexity: question.complexity || dbQuestion?.complexity,
                        explanation: (dbQuestion?.explanationGuide as any)?.body ?? (dbQuestion?.explanationGuide as any) ?? "",
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

    async initiateHomeworkSession(homeworkId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const homework = await this.repository.findHomeworkById(homeworkId);
            if (!homework) return { success: false, error: "Homework not found" };

            if (homework.learningConversationId) {
                const session = await this.repository.findSessionById(homework.learningConversationId);
                return { success: true, data: session };
            }

            // Create a new Socratic session
            const systemPrompt = `You are an AI Educational Tutor. 
            Student is working on homework: "${homework.title}".
            Description: ${homework.description || 'N/A'}
            Content: ${homework.textContent || 'N/A'}
            
            RULES:
            1. NEVER give the direct answer.
            2. If student asks for answer, explain why you can't and guide them.
            3. Use Socratic method: ask questions that lead to the solution.
            4. Provide analogies and break down complex concepts.
            5. Validate correct thinking steps.
            
            Current goal: Guide the student to solve this homework by themselves.`;

            const session = await this.repository.createSession({
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
            await this.repository.updateHomework(homework.id, { learningConversationId: session.id });

            return { success: true, data: session };
        } catch (error) {
            this.handleError(error, "initiateHomeworkSession");
            return { success: false, error: "Failed to initiate session" };
        }
    }

    async addMessageToSession(sessionId: string, userMessage: string) {
        try {
            const session = await this.repository.findSessionById(sessionId);
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

            await this.repository.updateSession(sessionId, {
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

            // 2. AI Prompt
            const prompt = `You are an educational AI tutor analyzing a student's full quiz session.
            
            QUIZ SUMMARY:
            Score: ${quizData.score}%
            Correct: ${quizData.correctAnswers}/${quizData.totalQuestions}
            
            DATA:
            ${JSON.stringify(quizData.questions)}
            
            Focus on:
            1. Concepts the student understands well.
            2. Conceptual gaps (topics where mistakes were made).
            3. Actionable learning path recommendation.
            4. Encouraging feedback.
            
            IMPORTANT: Focus on LEARNING, not just correct/incorrect.

            CRITICAL INSTRUCTION:
            You MUST generate the entire output (reportText, strengths, gaps, recommendations) in the following language/locale: ${locale}.
            This is mandatory. Even if the input data is in another language, your final JSON output values must be in ${locale}.
            
            Return ONLY a JSON object with this structure:
            {
              "reportText": "A beautiful markdown formatted report in ${locale}",
              "learningInsights": {
                "strengths": ["topic1", "topic2"],
                "gaps": ["topic3"],
                "recommendations": ["Do more of X", "Read Y"]
              }
            }`;

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

            return { success: true, data: report };
        } catch (error) {
            this.handleError(error, "analyzeQuiz");
            return { success: false, error: "Failed to analyze quiz" };
        }
    }

    async getSession(accountId: string, contextId: string, contextType: 'quiz' | 'homework' | 'topic'): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const session = await this.repository.findActiveSession(accountId, contextId, contextType);
            if (!session) return { success: true, data: null };
            return { success: true, data: session };
        } catch (error) {
            this.handleError(error, "getSession");
            return { success: false, error: "Failed to get session" };
        }
    }

    async listSessions(accountId: string, status: string = 'active') {
        try {
            const sessions = await this.db
                .select()
                .from(studentLearningSessions)
                .where(and(
                    eq(studentLearningSessions.studentAccountId, accountId),
                    eq(studentLearningSessions.status, status)
                ))
                .orderBy(desc(studentLearningSessions.createdAt));
            return { success: true, data: sessions };
        } catch (error) {
            this.handleError(error, "listSessions");
            return { success: false, error: "Failed to list sessions" };
        }
    }

    async getSessionById(sessionId: string) {
        try {
            const session = await this.repository.findSessionById(sessionId);
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
            let session = await this.repository.findActiveSession(accountId, contextId, contextType);

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

                session = await this.repository.createSession(sessionData);
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

            const prompt = `
You are an expert learning assistant for students. We are in an interactive learning session.
The student is exploring the concepts behind a ${contextType}.

${context}

Your Goal:
1. If this is the start (no selectedText), provide a comprehensive but friendly analysis of WHY the correct answer is correct and why the student's answer was incorrect (if it was).
2. If the student selected a specific word or phrase ("SPECIFIC FOCUS"), explain that concept in the context of this question. 
3. Use a friendly, encouraging tone (e.g., "Hello there! Let's dive in.").
4. Format your response in clean Markdown. Use LaTeX for math ($...$ or $$...$$).
5. Keep explanations bite-sized and clear. We want to encourage "discovery" rather than just dumping information.

CRITICAL INSTRUCTION:
You MUST generate the entire output in the following language/locale: ${locale}.
This is mandatory. Even if the input text is in another language, your explanation must be in ${locale}.

Output exactly the explanation in Markdown.
`;

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

            await this.repository.updateSession(session.id, {
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
}
