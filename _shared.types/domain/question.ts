import type { Timestamps } from '../common/base';

// ═══════════════════════════════════════════════════════════════
// QUESTION — Workspace-contextual views
// ═══════════════════════════════════════════════════════════════

export type QuestionComplexity = 'easy' | 'medium' | 'hard' | 'expert';
export type QuestionLanguage = 'azerbaijani' | 'russian' | 'english';

export namespace Question {
    /** What a Provider/Staff sees: full question for management */
    export interface ProviderView extends Timestamps {
        id: string;
        question: string;
        answers: string[];
        correctAnswer: string;
        subjectId: string;
        gradeLevel: number;
        complexity: QuestionComplexity;
        topic?: string;
        language: string;
        explanationGuide?: ExplanationGuide;
        authorAccountId: string;
        isPublished: boolean;
        aiAssistantCrib?: string;
    }

    /** What a Student sees during a quiz: no correct answer exposed */
    export interface StudentView {
        id: string;
        question: string;
        answers: string[];
        complexity: QuestionComplexity;
        gradeLevel: number;
        language: string;
    }

    /** Inputs for creating a question */
    export interface CreateInput {
        question: string;
        answers: string[];
        correctAnswer: string;
        subjectId: string;
        gradeLevel: number;
        complexity: QuestionComplexity;
        topic?: string;
        language?: string;
        explanationGuide?: ExplanationGuide;
        aiAssistantCrib?: string;
    }

    export interface UpdateInput extends Partial<CreateInput> { }

    export interface QuestionFilters {
        page?: number;
        pageSize?: number;
        topic?: string;
        subjectId?: string;
        complexity?: string;
        gradeLevel?: number;
        searchQuery?: string;
        createdBy?: string;
    }

    export interface ListQuestionsResponse {
        questions: ProviderView[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }

    /** @deprecated Use ProviderView instead */
    export interface PrivateAccess extends ProviderView { }
}

// ═══════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════

export interface ExplanationGuide {
    correct: string;
    incorrect: string;
    hints?: string[];
}

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
    questions: Question.ProviderView[];
}
