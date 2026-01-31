import type { Timestamps } from '../../../common/base';

export type QuestionComplexity = 'easy' | 'medium' | 'hard' | 'expert';
export type QuestionLanguage = 'azerbaijani' | 'russian' | 'english';

export interface QuestionGeneratorFormData {
    subjectId: string | null;
    gradeLevel: number | null;
    complexity: QuestionComplexity | null;
    topic: string;
    count: number;
    language: QuestionLanguage;
}

export interface QuestionGeneratorFormErrors {
    subjectId?: string;
    gradeLevel?: string;
    complexity?: string;
    topic?: string;
    count?: string;
    language?: string;
}

export interface GenerateQuestionsResponse {
    questions: Question.PrivateAccess[];
}

export namespace Question {
    export interface PrivateAccess extends Timestamps {
        id: string;
        question: string;
        answers: string[];
        correctAnswer: string;
        subjectId: string;
        gradeLevel: number;
        complexity: QuestionComplexity;
        topic?: string;
        language: string;
        explanationGuide?: any;
        authorAccountId: string;
        isPublished: boolean;
    }

    export interface CreateInput {
        question: string;
        answers: string[];
        correctAnswer: string;
        subjectId: string;
        gradeLevel: number;
        complexity: QuestionComplexity;
        topic?: string;
        language?: string;
        explanationGuide?: any;
    }

    export interface UpdateInput extends Partial<CreateInput> { }

    export interface QuestionFilters {
        page?: number;
        pageSize?: number;
        topic?: string;
        subjectId?: string;
        complexity?: string;
        gradeLevel?: number;
        [key: string]: any;
    }

    export interface ListQuestionsResponse {
        questions: PrivateAccess[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }
}
