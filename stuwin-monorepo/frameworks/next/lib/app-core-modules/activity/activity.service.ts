import { ActivityRepository } from "./activity.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";
import { genAI, GEMINI_MODELS } from "@/lib/integrations/geminiClient";

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

    async startQuiz(accountId: string, data: { subjectId: string; workspaceId: string; questions: any[] }) {
        try {
            return await this.db.transaction(async (tx) => {
                const quiz = await this.repository.createQuiz({
                    studentAccountId: accountId,
                    learningSubjectId: data.subjectId,
                    workspaceId: data.workspaceId,
                    questions: data.questions,
                    status: "in_progress",
                    startedAt: new Date(),
                    totalQuestions: data.questions.length,
                }, tx as any);

                return { success: true, data: quiz };
            });
        } catch (error) {
            this.handleError(error, "startQuiz");
            return { success: false, error: "Failed to start quiz" };
        }
    }

    async submitQuiz(quizId: string, results: { userAnswers: any; score: number; correctAnswers: number }) {
        try {
            return await this.db.transaction(async (tx) => {
                const quiz = await this.repository.updateQuiz(quizId, {
                    userAnswers: results.userAnswers,
                    score: results.score,
                    correctAnswers: results.correctAnswers,
                    status: "completed",
                    completedAt: new Date(),
                }, tx as any);

                return { success: true, data: quiz };
            });
        } catch (error) {
            this.handleError(error, "submitQuiz");
            return { success: false, error: "Failed to submit quiz" };
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
                questions: quiz.questions, // Array of {question, correctAnswer, userAnswers, etc}
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
