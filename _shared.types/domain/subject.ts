import type { Timestamps } from '../common/base';

// ═══════════════════════════════════════════════════════════════
// SUBJECT — Workspace-contextual views
// ═══════════════════════════════════════════════════════════════

export namespace Subject {
    /** What a Provider/Staff sees: full management access */
    export interface ProviderView extends Timestamps {
        id: string;
        title: string;
        displayTitle: string;
        description?: string;
        cover?: string;
        slug?: string;
        isActive: boolean;
        aiLabel?: string;
        aiGuide?: string;
        language?: string;
        gradeLevel?: number;
        totalQuestions: number;
        totalTopics: number;
        canManageTopics: boolean;
        files?: SubjectFileView[];
    }

    /** What a Student sees: consumption + progress */
    export interface StudentView extends Timestamps {
        id: string;
        title: string;
        displayTitle: string;
        description?: string;
        cover?: string;
        slug?: string;
        isActive: boolean;
        totalQuestions: number;
        totalTopics: number;
        availableQuizzes: number;
        progress: {
            completedQuizzes: number;
            totalQuizzes: number;
            averageScore: number;
            timeSpent: number;
        };
    }

    /** What the public sees: minimal, safe to expose */
    export interface PublicView {
        id: string;
        title: string;
        description?: string;
        cover?: string;
        slug?: string;
        language?: string;
        gradeLevel?: number;
    }

    /** Input shape for creating a subject */
    export interface Create {
        title: string;
        description?: string;
        cover?: string;
        slug: string;
        isActive?: boolean;
        aiLabel?: string;
        language?: string;
        gradeLevel?: number;
    }

    /** Input shape for updating a subject (all fields optional) */
    export interface Update extends Partial<Create> { }

    /** @deprecated Use ProviderView instead */
    export interface PrivateAccess extends ProviderView { }
}

export interface SubjectFileView extends Timestamps {
    id: string;
    pdfUrl: string;
    name: string;
    language?: string;
    isActive: boolean;
}
