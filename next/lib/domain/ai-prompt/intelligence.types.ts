
export enum PromptFlowType {
    QUESTION_EXPLANATION = "QUESTION_EXPLANATION",
    HOMEWORK_EXPLANATION = "HOMEWORK_EXPLANATION",
    QUESTION_GENERATION = "QUESTION_GENERATION",
    TOPIC_EXPLORATION = "TOPIC_EXPLORATION",
    STUDENT_QUIZ_SUMMARY = "STUDENT_QUIZ_SUMMARY",
    STUDENT_PROGRESS_SUMMARY = "STUDENT_PROGRESS_SUMMARY"
}

export interface SystemPrompt {
    id: string;
    createdAt: Date;
    body: string;
    title: string;
    usageFlowType: string;
    isActive: boolean;
}
