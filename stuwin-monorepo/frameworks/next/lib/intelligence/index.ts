export * from "./types";

import { QUESTION_EXPLANATION_PROMPT } from "./QuestionExplanationPrompt";
import { HOMEWORK_EXPLANATION_PROMPT } from "./HomeworkExplanationPrompt";
import { QUESTION_GENERATION_PROMPT } from "./QuestionGenerationPrompt";
import { TOPIC_EXPLORATION_PROMPT } from "./TopicExplorationPrompt";
import { STUDENT_QUIZ_SUMMARY_PROMPT } from "./StudentQuizSummaryPrompt";
import { STUDENT_PROGRESS_SUMMARY_PROMPT } from "./StudentProgressSummaryPrompt";

import { PromptFlowType, SystemPrompt } from "./types";

export const BASE_PROMPTS: Record<string, Partial<SystemPrompt>> = {
    [PromptFlowType.QUESTION_EXPLANATION]: QUESTION_EXPLANATION_PROMPT,
    [PromptFlowType.HOMEWORK_EXPLANATION]: HOMEWORK_EXPLANATION_PROMPT,
    [PromptFlowType.QUESTION_GENERATION]: QUESTION_GENERATION_PROMPT,
    [PromptFlowType.TOPIC_EXPLORATION]: TOPIC_EXPLORATION_PROMPT,
    [PromptFlowType.STUDENT_QUIZ_SUMMARY]: STUDENT_QUIZ_SUMMARY_PROMPT,
    [PromptFlowType.STUDENT_PROGRESS_SUMMARY]: STUDENT_PROGRESS_SUMMARY_PROMPT
};
