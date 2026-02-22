import {
  genAI,
  fileManager,
  safetySettings,
  defaultGenerationConfig,
  GEMINI_MODELS
} from '@/lib/integrations/google/Gemini.client';
import fs from 'fs/promises';
import path from 'path';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
interface GeminiQuestionResult {
  questions: Array<{
    question: string;
    answers: string[];
    correct_answer: string;
    complexity?: "easy" | "medium" | "hard";
  }>;
}

interface GenerateQuestionsOptions {
  topic: string;
  subject: string;
  gradeLevel: string;
  complexity: string;
  language: string;
  count: number;
  pageStart: number;
  pageEnd: number;
  comment?: string;
  assistantCrib?: string;
  existingQuestions?: string[];
}

export interface MultiComplexityGenerateOptions {
  topic: string;
  subject: string;
  gradeLevel: string;
  language: string;
  counts: { easy: number; medium: number; hard: number };
  pageStart?: number;
  pageEnd?: number;
  comment?: string;
  assistantCrib?: string;
  existingQuestions?: string[];
}

/**
 * Upload PDF to Gemini File API
 * Files are cached for 48 hours
 */
export async function uploadPdfToGemini(
  pdfBuffer: Buffer,
  displayName: string
): Promise<string> {
  // Save to temp file (File API requires file path)
  const tempDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  const tempPdfPath = path.join(tempDir, `${Date.now()}-${displayName}.pdf`);

  try {
    await fs.writeFile(tempPdfPath, pdfBuffer);

    ConsoleLogger.log(('📤 Uploading PDF to Gemini...'));

    const uploadResult = await fileManager.uploadFile(tempPdfPath, {
      mimeType: 'application/pdf',
      displayName
    });

    ConsoleLogger.log((`✅ PDF uploaded: ${uploadResult.file.uri}`));
    ConsoleLogger.log((`⏰ Cached until: ${uploadResult.file.expirationTime}`));

    return uploadResult.file.uri;

  } finally {
    // Cleanup temp file
    try {
      await fs.unlink(tempPdfPath);
    } catch (e) {
      ConsoleLogger.error('Failed to cleanup temp file:', e);
    }
  }
}

/**
 * Generate questions from PDF using Gemini 2.0 Flash
 */
export async function generateQuestionsWithGemini(
  pdfFileUri: string,
  options: GenerateQuestionsOptions
): Promise<GeminiQuestionResult> {

  const languageMap: Record<string, string> = {
    'azerbaijani': 'Azerbaijani',
    'russian': 'Russian',
    'english': 'English'
  };
  const languageName = languageMap[options.language] || 'Azerbaijani';

  const userComment = options.comment ? `\n\nIMPORTANT NOTES FROM INSTRUCTOR:\n${options.comment}\n` : '';
  const cribSection = options.assistantCrib ? `\n\nAI ASSISTANT INSTRUCTIONS (from provider):\n${options.assistantCrib}\n` : '';

  // Build dedup section from existing questions
  let dedupSection = '';
  if (options.existingQuestions && options.existingQuestions.length > 0) {
    const questionsList = options.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    dedupSection = `\n\nALREADY GENERATED QUESTIONS (DO NOT DUPLICATE OR REPHRASE THESE):\n${questionsList}\n`;
  }

  const prompt = `You are analyzing a PDF educational textbook. Focus ONLY on pages ${options.pageStart} to ${options.pageEnd}.

TOPIC: "${options.topic}"
SUBJECT: "${options.subject}"
GRADE LEVEL: ${options.gradeLevel}
COMPLEXITY: ${options.complexity}
LANGUAGE: ${languageName}${userComment}${cribSection}${dedupSection}

TASK:
Generate EXACTLY ${options.count} multiple-choice questions based on the content from pages ${options.pageStart} to ${options.pageEnd}.

INSTRUCTIONS:
- Carefully read and analyze ONLY pages ${options.pageStart}-${options.pageEnd} of the PDF
- Examine both text content and visual elements (diagrams, charts, illustrations, formulas)
- Generate diverse questions that cover different concepts and difficulty levels
- Questions can reference visual elements (e.g., "Based on the diagram shown...", "According to the chart...")
- Each question MUST be written in ${languageName} language
- Each question MUST have EXACTLY 4 answer options
- Only ONE answer must be correct and must match exactly one of the options
- Make questions educational, meaningful, and appropriate for grade ${options.gradeLevel}
- Ensure ${options.complexity} difficulty level is maintained
- Do NOT generate questions that are the same or very similar to the ones listed in the ALREADY GENERATED QUESTIONS section above

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text in ${languageName}",
      "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Exact match to one of the four options"
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations
- The correct_answer MUST be exactly one of the strings in the answers array
- All text must be in ${languageName} language`;

  ConsoleLogger.log((`🤖 Generating ${options.count} questions with Gemini 3 Flash...`));

  // Use latest Gemini 3 Flash (Dec 17, 2025 - 3x faster!)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODELS.FLASH_3,
    safetySettings,
    generationConfig: {
      ...defaultGenerationConfig,
      temperature: 0.7, // Balanced creativity
    }
  });

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: 'application/pdf',
        fileUri: pdfFileUri
      }
    },
    { text: prompt }
  ]);

  const response = result.response.text();
  ConsoleLogger.log((`📄 Raw response length: ${response.length} chars`));

  // Parse JSON response
  let cleaned = response.trim();

  // Remove markdown code blocks if present
  if (cleaned.includes('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  try {
    const parsed: GeminiQuestionResult = JSON.parse(cleaned);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }

    ConsoleLogger.log((`✅ Generated ${parsed.questions.length} questions`));

    return parsed;

  } catch {
    ConsoleLogger.error(('❌ Failed to parse Gemini response:'), response);
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

/**
 * Delete uploaded file from Gemini
 */
export async function deleteGeminiFile(fileUri: string): Promise<void> {
  try {
    const fileName = fileUri.split('/').pop();
    if (fileName) {
      await fileManager.deleteFile(fileName);
      ConsoleLogger.log((`🗑️ Deleted file: ${fileName}`));
    }
  } catch (error) {
    ConsoleLogger.error('Failed to delete Gemini file:', error);
  }
}

/**
 * Generate questions from text content using Gemini 3 Flash
 * For topics without PDF
 */
export async function generateQuestionsWithGeminiText(
  textContent: string,
  options: Omit<GenerateQuestionsOptions, 'pageStart' | 'pageEnd'>
): Promise<GeminiQuestionResult> {

  const languageMap: Record<string, string> = {
    'azerbaijani': 'Azerbaijani',
    'russian': 'Russian',
    'english': 'English'
  };
  const languageName = languageMap[options.language] || 'Azerbaijani';

  const userComment = options.comment ? `\n\nIMPORTANT NOTES FROM INSTRUCTOR:\n${options.comment}\n` : '';
  const cribSection = options.assistantCrib ? `\n\nAI ASSISTANT INSTRUCTIONS (from provider):\n${options.assistantCrib}\n` : '';

  // Build dedup section from existing questions
  let dedupSection = '';
  if (options.existingQuestions && options.existingQuestions.length > 0) {
    const questionsList = options.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    dedupSection = `\n\nALREADY GENERATED QUESTIONS (DO NOT DUPLICATE OR REPHRASE THESE):\n${questionsList}\n`;
  }

  const prompt = `Generate EXACTLY ${options.count} multiple-choice questions based on the following educational content.

TOPIC: "${options.topic}"
SUBJECT: "${options.subject}"
GRADE LEVEL: ${options.gradeLevel}
COMPLEXITY: ${options.complexity}
LANGUAGE: ${languageName}${userComment}${cribSection}${dedupSection}

CONTENT TO BASE QUESTIONS ON:
${textContent}

INSTRUCTIONS:
- Read and understand the content above thoroughly
- Generate ${options.count} diverse questions that test comprehension of this content
- Questions should cover different aspects and difficulty levels of the content
- Each question MUST be written in ${languageName} language
- Each question MUST have EXACTLY 4 answer options
- Only ONE answer must be correct and must match exactly one of the options
- Make questions educational, meaningful, and appropriate for grade ${options.gradeLevel}
- Ensure ${options.complexity} difficulty level is maintained
- Do NOT generate questions that are the same or very similar to the ones listed in the ALREADY GENERATED QUESTIONS section above

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text in ${languageName}",
      "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Exact match to one of the four options"
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations
- The correct_answer MUST be exactly one of the strings in the answers array
- All text must be in ${languageName} language`;

  ConsoleLogger.log((`🤖 Generating ${options.count} questions with Gemini 3 Flash (text mode)...`));

  // Use latest Gemini 3 Flash
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODELS.FLASH_3,
    safetySettings,
    generationConfig: {
      ...defaultGenerationConfig,
      temperature: 0.7,
    }
  });

  const result = await model.generateContent([{ text: prompt }]);

  const response = result.response.text();
  ConsoleLogger.log((`📄 Raw response length: ${response.length} chars`));

  // Parse JSON response
  let cleaned = response.trim();

  if (cleaned.includes('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  try {
    const parsed: GeminiQuestionResult = JSON.parse(cleaned);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }

    ConsoleLogger.log((`✅ Generated ${parsed.questions.length} questions`));

    return parsed;

  } catch {
    ConsoleLogger.error(('❌ Failed to parse Gemini response:'), response);
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

/**
 * Build a multi-complexity prompt section
 */
function buildMultiComplexityPromptSection(counts: { easy: number; medium: number; hard: number }): string {
  const total = counts.easy + counts.medium + counts.hard;
  const parts: string[] = [];
  if (counts.easy > 0) parts.push(`- ${counts.easy} EASY questions`);
  if (counts.medium > 0) parts.push(`- ${counts.medium} MEDIUM questions`);
  if (counts.hard > 0) parts.push(`- ${counts.hard} HARD questions`);

  return `Generate EXACTLY ${total} multiple-choice questions with the following complexity distribution:
${parts.join('\n')}

Each question object MUST include a "complexity" field set to "easy", "medium", or "hard" matching the assigned difficulty.`;
}

/**
 * Generate questions from PDF with mixed complexities in a single API call
 */
export async function generateQuestionsWithGeminiMultiComplexity(
  pdfFileUri: string,
  options: MultiComplexityGenerateOptions
): Promise<GeminiQuestionResult> {
  const languageMap: Record<string, string> = {
    'azerbaijani': 'Azerbaijani',
    'russian': 'Russian',
    'english': 'English'
  };
  const languageName = languageMap[options.language] || 'Azerbaijani';
  const total = options.counts.easy + options.counts.medium + options.counts.hard;

  const userComment = options.comment ? `\n\nIMPORTANT NOTES FROM INSTRUCTOR:\n${options.comment}\n` : '';
  const cribSection = options.assistantCrib ? `\n\nAI ASSISTANT INSTRUCTIONS (from provider):\n${options.assistantCrib}\n` : '';

  let dedupSection = '';
  if (options.existingQuestions && options.existingQuestions.length > 0) {
    const questionsList = options.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    dedupSection = `\n\nALREADY GENERATED QUESTIONS (DO NOT DUPLICATE OR REPHRASE THESE):\n${questionsList}\n`;
  }

  const complexitySection = buildMultiComplexityPromptSection(options.counts);

  const prompt = `You are analyzing a PDF educational textbook. Focus ONLY on pages ${options.pageStart} to ${options.pageEnd}.

TOPIC: "${options.topic}"
SUBJECT: "${options.subject}"
GRADE LEVEL: ${options.gradeLevel}
LANGUAGE: ${languageName}${userComment}${cribSection}${dedupSection}

TASK:
${complexitySection}

INSTRUCTIONS:
- Carefully read and analyze ONLY pages ${options.pageStart}-${options.pageEnd} of the PDF
- Examine both text content and visual elements (diagrams, charts, illustrations, formulas)
- Generate diverse questions that cover different concepts
- Questions can reference visual elements (e.g., "Based on the diagram shown...", "According to the chart...")
- Each question MUST be written in ${languageName} language
- Each question MUST have EXACTLY 4 answer options
- Only ONE answer must be correct and must match exactly one of the options
- Make questions educational, meaningful, and appropriate for grade ${options.gradeLevel}
- EASY questions test basic recall and understanding
- MEDIUM questions test application and analysis
- HARD questions test synthesis, evaluation, and deep reasoning
- Do NOT generate questions that are the same or very similar to the ones listed in the ALREADY GENERATED QUESTIONS section above

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text in ${languageName}",
      "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Exact match to one of the four options",
      "complexity": "easy | medium | hard"
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations
- The correct_answer MUST be exactly one of the strings in the answers array
- The complexity MUST be exactly "easy", "medium", or "hard"
- All text must be in ${languageName} language`;

  ConsoleLogger.log(`🤖 Generating ${total} questions with Gemini 3 Flash (multi-complexity)...`);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODELS.FLASH_3,
    safetySettings,
    generationConfig: {
      ...defaultGenerationConfig,
      temperature: 0.7,
    }
  });

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: 'application/pdf',
        fileUri: pdfFileUri
      }
    },
    { text: prompt }
  ]);

  const response = result.response.text();
  ConsoleLogger.log(`📄 Raw response length: ${response.length} chars`);

  let cleaned = response.trim();
  if (cleaned.includes('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  try {
    const parsed: GeminiQuestionResult = JSON.parse(cleaned);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }
    ConsoleLogger.log(`✅ Generated ${parsed.questions.length} questions`);
    return parsed;
  } catch {
    ConsoleLogger.error('❌ Failed to parse Gemini response:', response);
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

/**
 * Generate questions from text content with mixed complexities in a single API call
 */
export async function generateQuestionsWithGeminiTextMultiComplexity(
  textContent: string,
  options: Omit<MultiComplexityGenerateOptions, 'pageStart' | 'pageEnd'>
): Promise<GeminiQuestionResult> {
  const languageMap: Record<string, string> = {
    'azerbaijani': 'Azerbaijani',
    'russian': 'Russian',
    'english': 'English'
  };
  const languageName = languageMap[options.language] || 'Azerbaijani';
  const total = options.counts.easy + options.counts.medium + options.counts.hard;

  const userComment = options.comment ? `\n\nIMPORTANT NOTES FROM INSTRUCTOR:\n${options.comment}\n` : '';
  const cribSection = options.assistantCrib ? `\n\nAI ASSISTANT INSTRUCTIONS (from provider):\n${options.assistantCrib}\n` : '';

  let dedupSection = '';
  if (options.existingQuestions && options.existingQuestions.length > 0) {
    const questionsList = options.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    dedupSection = `\n\nALREADY GENERATED QUESTIONS (DO NOT DUPLICATE OR REPHRASE THESE):\n${questionsList}\n`;
  }

  const complexitySection = buildMultiComplexityPromptSection(options.counts);

  const prompt = `${complexitySection}

Based on the following educational content.

TOPIC: "${options.topic}"
SUBJECT: "${options.subject}"
GRADE LEVEL: ${options.gradeLevel}
LANGUAGE: ${languageName}${userComment}${cribSection}${dedupSection}

CONTENT TO BASE QUESTIONS ON:
${textContent}

INSTRUCTIONS:
- Read and understand the content above thoroughly
- Generate diverse questions that test comprehension of this content
- Questions should cover different aspects of the content
- Each question MUST be written in ${languageName} language
- Each question MUST have EXACTLY 4 answer options
- Only ONE answer must be correct and must match exactly one of the options
- Make questions educational, meaningful, and appropriate for grade ${options.gradeLevel}
- EASY questions test basic recall and understanding
- MEDIUM questions test application and analysis
- HARD questions test synthesis, evaluation, and deep reasoning
- Do NOT generate questions that are the same or very similar to the ones listed in the ALREADY GENERATED QUESTIONS section above

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text in ${languageName}",
      "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Exact match to one of the four options",
      "complexity": "easy | medium | hard"
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations
- The correct_answer MUST be exactly one of the strings in the answers array
- The complexity MUST be exactly "easy", "medium", or "hard"
- All text must be in ${languageName} language`;

  ConsoleLogger.log(`🤖 Generating ${total} questions with Gemini 3 Flash (text mode, multi-complexity)...`);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODELS.FLASH_3,
    safetySettings,
    generationConfig: {
      ...defaultGenerationConfig,
      temperature: 0.7,
    }
  });

  const result = await model.generateContent([{ text: prompt }]);

  const response = result.response.text();
  ConsoleLogger.log(`📄 Raw response length: ${response.length} chars`);

  let cleaned = response.trim();
  if (cleaned.includes('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  try {
    const parsed: GeminiQuestionResult = JSON.parse(cleaned);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }
    ConsoleLogger.log(`✅ Generated ${parsed.questions.length} questions`);
    return parsed;
  } catch {
    ConsoleLogger.error('❌ Failed to parse Gemini response:', response);
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

/**
 * List all uploaded files
 */
export async function listGeminiFiles(): Promise<void> {
  const files = await fileManager.listFiles();
  ConsoleLogger.log(('📁 Uploaded files:'));
  for (const file of files.files) {
    ConsoleLogger.log(`  - ${file.displayName} (${file.uri})`);
    ConsoleLogger.log(`    Expires: ${file.expirationTime}`);
  }
}

