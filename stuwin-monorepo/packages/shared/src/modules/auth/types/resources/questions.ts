
import type { Timestamps } from '../../../common/base';

export namespace Question {
    export interface PrivateAccess extends Timestamps {
        id: string;
        question: string;
        answers: string[];
        correctAnswer: string;
        subjectId: string;
        gradeLevel: number;
        complexity: 'easy' | 'medium' | 'hard' | 'expert';
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
        complexity: 'easy' | 'medium' | 'hard' | 'expert';
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
