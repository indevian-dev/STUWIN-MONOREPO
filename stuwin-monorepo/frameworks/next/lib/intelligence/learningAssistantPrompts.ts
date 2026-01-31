// ═══════════════════════════════════════════════════════════════
// LEARNING ASSISTANT AI PROMPTS
// ═══════════════════════════════════════════════════════════════
// System prompts and prompt templates for AI-powered learning
// Guides AI responses for educational context
// ═══════════════════════════════════════════════════════════════

export const LEARNING_ASSISTANT_SYSTEM_PROMPT = `You are an expert educational AI tutor designed to help students understand concepts deeply.

Your role is to:
1. Identify misconceptions in student answers
2. Provide clear, step-by-step explanations
3. Suggest alternative approaches or learning paths
4. Ask probing questions to deepen understanding
5. Maintain context from previous interactions

Guidelines:
- Be encouraging and supportive
- Break down complex concepts into simpler parts
- Use analogies and real-world examples when helpful
- Focus on "why" not just "what"
- Never simply provide the answer without explanation
- Adapt your explanation style based on student's level
- Remember all previous context in the conversation

Format your response with:
1. Explanation: Why the student's answer might be incorrect or incomplete
2. Key Concept: The core idea they should understand
3. Solution Path: Step-by-step guidance to the right answer
4. Next Steps: Suggestions for further learning or practice`

export const LEARNING_CONVERSATION_PROMPT_TEMPLATE = (context: {
  originalQuestion: string
  studentAnswer?: string
  correctAnswer?: string
  topic: string
  conversationHistory: Array<{ role: 'student' | 'ai'; content: string }>
  newStudentMessage: string
  aiCrib?: string
}) => {
  const history = context.conversationHistory
    .map((msg) => `${msg.role === 'ai' ? 'AI Tutor' : 'Student'}: ${msg.content}`)
    .join('\n\n')

  return `Topic: ${context.topic}

Original Question: ${context.originalQuestion}
${context.studentAnswer ? `Student's Initial Answer: ${context.studentAnswer}` : ''}
${context.correctAnswer ? `Correct Answer: ${context.correctAnswer}` : ''}

CONVERSATION HISTORY:
${history}

STUDENT'S NEW MESSAGE:
${context.newStudentMessage}

${context.aiCrib ? `ADDITIONAL CONTEXT (AI CRIB):
${context.aiCrib}
` : ""}

Please provide a helpful response that:
1. Addresses the student's specific question
2. Maintains context from our previous discussion
3. Provides clear, step-by-step guidance
4. Includes learning tips or suggestions
5. Encourages deeper understanding`
}

export const HOMEWORK_ANALYSIS_PROMPT_TEMPLATE = (context: {
  homeworkTitle: string
  description?: string
  topic?: string
  studentQuestion: string
  aiCrib?: string
}) => {
  return `The student is working on homework: "${context.homeworkTitle}"
${context.description ? `Description: ${context.description}` : ''}
${context.topic ? `Topic: ${context.topic}` : ''}

${context.aiCrib ? `ADDITIONAL CONTEXT (AI CRIB):
${context.aiCrib}
` : ""}

Student's Question: ${context.studentQuestion}

Help the student by:
1. Clarifying any misconceptions
2. Explaining the relevant concepts
3. Guiding them toward the solution method
4. Providing practice tips
5. Suggesting when to ask for further help`
}

export const QUIZ_PREPARATION_PROMPT_TEMPLATE = (context: {
  quizTitle: string
  topic: string
  studentQuestion: string
  difficulty?: string
  aiCrib?: string
}) => {
  return `The student is preparing for a quiz: "${context.quizTitle}"
Topic: ${context.topic}
${context.difficulty ? `Difficulty Level: ${context.difficulty}` : ''}

${context.aiCrib ? `ADDITIONAL CONTEXT (AI CRIB):
${context.aiCrib}
` : ""}

Student's Question: ${context.studentQuestion}

Help them prepare by:
1. Explaining key concepts relevant to their question
2. Providing worked examples
3. Highlighting common mistakes to avoid
4. Suggesting practice strategies
5. Building confidence for the quiz`
}

export interface AIPromptContext {
  originalQuestion: string
  studentAnswer?: string
  correctAnswer?: string
  topic: string
  conversationHistory: Array<{ role: 'student' | 'ai'; content: string }>
  newStudentMessage: string
}

export interface AIResponse {
  content: string
  explanation?: string
  suggestions?: string[]
  learningTips?: string
  tokensUsed: number
  model: string
}

export const LEARNING_MODELS = {
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-5-sonnet-20241022',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4O: 'gpt-4o',
} as const

export const DEFAULT_LEARNING_MODEL = LEARNING_MODELS.CLAUDE_3_SONNET

export const MODEL_TOKEN_LIMITS = {
  [LEARNING_MODELS.CLAUDE_3_OPUS]: 200000,
  [LEARNING_MODELS.CLAUDE_3_SONNET]: 200000,
  [LEARNING_MODELS.GPT_4_TURBO]: 128000,
  [LEARNING_MODELS.GPT_4O]: 128000,
} as const

export const MAX_TOKENS_PER_SESSION = 10000 // ~7,500 words
export const MAX_TOKENS_PER_MESSAGE = 2000
export const MAX_MESSAGES_PER_SESSION = 30

export const PROMPT_CONFIG = {
  temperature: 0.7, // Balanced creativity and consistency
  topP: 0.9, // Nucleus sampling
  frequencyPenalty: 0.5, // Reduce repetition
  presencePenalty: 0.6, // Encourage new topics
} as const
