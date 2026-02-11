import { PromptFlowType, SystemPrompt } from "./intelligence.types";

import { QUESTION_EXPLANATION_PROMPT } from "@/lib/domain/learning/prompts/QuestionExplanationPrompt";
import { HOMEWORK_EXPLANATION_PROMPT } from "@/lib/domain/learning/prompts/HomeworkExplanationPrompt";
import { QUESTION_GENERATION_PROMPT } from "@/lib/domain/learning/prompts/QuestionGenerationPrompt";
import { TOPIC_EXPLORATION_PROMPT } from "@/lib/domain/learning/prompts/TopicExplorationPrompt";
import { STUDENT_QUIZ_SUMMARY_PROMPT } from "@/lib/domain/activity/prompts/StudentQuizSummaryPrompt";
import { STUDENT_PROGRESS_SUMMARY_PROMPT } from "@/lib/domain/activity/prompts/StudentProgressSummaryPrompt";

export const BASE_PROMPTS: Record<string, Partial<SystemPrompt>> = {
    [PromptFlowType.QUESTION_EXPLANATION]: QUESTION_EXPLANATION_PROMPT,
    [PromptFlowType.HOMEWORK_EXPLANATION]: HOMEWORK_EXPLANATION_PROMPT,
    [PromptFlowType.QUESTION_GENERATION]: QUESTION_GENERATION_PROMPT,
    [PromptFlowType.TOPIC_EXPLORATION]: TOPIC_EXPLORATION_PROMPT,
    [PromptFlowType.STUDENT_QUIZ_SUMMARY]: STUDENT_QUIZ_SUMMARY_PROMPT,
    [PromptFlowType.STUDENT_PROGRESS_SUMMARY]: STUDENT_PROGRESS_SUMMARY_PROMPT
};
