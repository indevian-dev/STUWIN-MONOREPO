import {
  genAI,
  fileManager,
  safetySettings,
  defaultGenerationConfig,
  GEMINI_MODELS
} from '@/lib/integrations/geminiClient';
import fs from 'fs/promises';
import path from 'path';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface GeminiQuestionResult {
  questions: Array<{
    question: string;
    answers: string[];
    correct_answer: string;
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
  comment?: string; // Optional user comment for AI
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

  const prompt = `You are analyzing a PDF educational textbook. Focus ONLY on pages ${options.pageStart} to ${options.pageEnd}.

TOPIC: "${options.topic}"
SUBJECT: "${options.subject}"
GRADE LEVEL: ${options.gradeLevel}
COMPLEXITY: ${options.complexity}
LANGUAGE: ${languageName}${userComment}

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

  } catch (parseError) {
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

  const prompt = `Generate EXACTLY ${options.count} multiple-choice questions based on the following educational content.

TOPIC: "${options.topic}"
SUBJECT: "${options.subject}"
GRADE LEVEL: ${options.gradeLevel}
COMPLEXITY: ${options.complexity}
LANGUAGE: ${languageName}${userComment}

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

  } catch (parseError) {
    ConsoleLogger.error(('❌ Failed to parse Gemini response:'), response);
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

