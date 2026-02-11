import { SystemPrompt, PromptFlowType } from "../../ai-prompt/intelligence.types";

export const STUDENT_QUIZ_SUMMARY_PROMPT: Partial<SystemPrompt> = {
  title: "Default Quiz Summary",
  body: `You are an educational AI tutor analyzing a student's quiz.

QUIZ SUMMARY:
Score: {{score}}%
Correct: {{correctAnswers}}/{{totalQuestions}}

DATA:
{{questionsData}}

Focus on:
1. Concepts understood well.
2. Conceptual gaps.
3. Actionable learning path.
4. Encouraging feedback.

IMPORTANT: Output JSON only:
{
  "reportText": "Markdown report in {{locale}}",
  "learningInsights": {
    "strengths": [],
    "gaps": [],
    "recommendations": []
  }
}`,
  usageFlowType: PromptFlowType.STUDENT_QUIZ_SUMMARY,
  isActive: true
};
