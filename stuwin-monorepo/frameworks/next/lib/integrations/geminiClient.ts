import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold
} from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

// Initialize Gemini API
let _genAI: GoogleGenerativeAI;
let _fileManager: GoogleAIFileManager;

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return key;
};

const getGenAI = () => {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(getApiKey());
  }
  return _genAI;
};

const getFileManager = () => {
  if (!_fileManager) {
    _fileManager = new GoogleAIFileManager(getApiKey());
  }
  return _fileManager;
};

export const genAI = new Proxy({} as GoogleGenerativeAI, {
  get: (_target, prop) => {
    const instance = getGenAI();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const fileManager = new Proxy({} as GoogleAIFileManager, {
  get: (_target, prop) => {
    const instance = getFileManager();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

// Safety settings (relaxed for educational content)
export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  }
];

// Model configurations
export const GEMINI_MODELS = {
  FLASH_3: 'gemini-3-flash-preview',
  FLASH_2: 'gemini-3-flash-preview',
  FLASH_1_5: 'gemini-3-flash-preview',
  PRO_1_5: 'gemini-3-flash-preview',
  PRO_002: 'gemini-3-flash-preview'
} as const;

// Default generation config
export const defaultGenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json'
};

