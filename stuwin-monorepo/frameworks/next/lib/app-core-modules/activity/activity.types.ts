
import type { Timestamps } from '@/lib/app-core-modules/types';

// ═══════════════════════════════════════════════════════════════
// ACTIVITY MODULE TYPES
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// QUIZZES
// ═══════════════════════════════════════════════════════════════

export type QuizStatus = 'in_progress' | 'completed' | 'abandoned';

export namespace Quiz {
    export interface Entity extends Timestamps {
        id: string;
        studentAccountId: string;
        providerSubjectId: string;
        workspaceId: string;
        questions: any;
        userAnswers?: any;
        score?: number;
        correctAnswers?: number;
        totalQuestions: number;
        status: QuizStatus;
        startedAt: Date;
        completedAt?: Date;
    }
}

// ═══════════════════════════════════════════════════════════════
// HOMEWORKS
// ═══════════════════════════════════════════════════════════════

export type HomeworkStatus = 'pending' | 'in_progress' | 'completed' | 'submitted';

export namespace Homework {
    export interface Entity extends Timestamps {
        id: string;
        studentAccountId: string;
        workspaceId: string;
        topicId?: string;
        title: string;
        description?: string;
        imageUrl?: string;
        status: HomeworkStatus;
        completedAt?: Date;
    }
}

// ═══════════════════════════════════════════════════════════════
// LEARNING SESSIONS
// ═══════════════════════════════════════════════════════════════

export namespace ActivitySession {
    export interface Entity extends Timestamps {
        id: string;
        studentAccountId: string;
        workspaceId: string;
        topicId?: string;
        mode: string;
        status: string;
    }
}
