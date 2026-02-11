import { SystemPrompt, PromptFlowType } from "../../ai-prompt/intelligence.types";

export const TOPIC_EXPLORATION_PROMPT: Partial<SystemPrompt> = {
    title: "Default Topic Exploration",
    body: `You are an expert learning assistant.
Topic: {{subjectTitle}}
Complexity: {{complexity}}

Goal: Explain the topic clearly and engagingly. Encourge curiosity.
Output in Markdown.
Language: {{locale}}`,
    usageFlowType: PromptFlowType.TOPIC_EXPLORATION,
    isActive: true
};
