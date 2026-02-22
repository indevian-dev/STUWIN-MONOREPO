import type { Timestamps } from '../base/Base.types';

// ═══════════════════════════════════════════════════════════════
// TOPIC — Workspace-contextual views
// ═══════════════════════════════════════════════════════════════

export namespace Topic {
    /** What a Provider/Staff sees: full topic with management controls */
    export interface ProviderView extends Timestamps {
        id: string;
        name: string;
        description: string | null;
        gradeLevel: number | null;
        language: string | null;
        providerSubjectId: string;
        aiSummary: string | null;
        isActiveAiGeneration: boolean;
        workspaceId: string;
        aiGuide: string | null;
        pdfDetails: TopicPdfDetails | null;
        questionsStats: TopicQuestionsStats | null;
        parentTopicId: string | null;
        chapterNumber?: string | null;
        topicEstimatedQuestionsCapacity?: number | null;
        pdfPageStart?: number | null;
        pdfPageEnd?: number | null;
        estimatedEducationStartDate?: Date | string | null;

        // Stats
        topicPublishedQuestionsStats?: number;
        topicGeneralQuestionsStats?: number;
        topicQuestionsRemainingToGenerate?: number;
        totalPdfPages?: number;
    }

    /** What a Student sees: learning-relevant info only */
    export interface StudentView {
        id: string;
        name: string;
        description: string | null;
        gradeLevel: number | null;
        providerSubjectId: string;
        pdfDetails: TopicPdfDetails | null;
    }

    /** Lightweight list item for selectors and dropdowns */
    export interface ListItem {
        id: string;
        name: string;
        providerSubjectId: string;
        isActiveAiGeneration: boolean;
    }

    /** Input shape for creating a topic */
    export interface Create {
        providerSubjectId: string;
        name: string;
        description?: string;
        gradeLevel?: number;
        isActiveAiGeneration?: boolean;
        pdfDetails?: TopicPdfDetails;
        questionsStats?: TopicQuestionsStats;
        parentTopicId?: string;
        language?: string;
        aiGuide?: string;
        aiSummary?: string;
    }

    /** Input shape for updating a topic (all fields optional) */
    export interface Update extends Partial<Create> { }

    /** @deprecated Use ProviderView instead */
    export interface PrivateAccess extends ProviderView { }
}

export interface Topic extends Topic.ProviderView { }

// ═══════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════

export interface TopicPdfDetails {
    s3Key?: string;
    pdfUrl?: string;
    pageStart?: number;
    pageEnd?: number;
    totalPages?: number;
    chapterNumber?: string;
    fileName?: string;
    pages?: { start?: number; end?: number };
}

export interface TopicQuestionsStats {
    total?: number;
    remaining?: number;
    capacity?: number;
    published?: number;
}

export interface TopicFilters {
    subjectId?: string;
    gradeLevel?: number;
    searchQuery?: string;
    topicId?: string;
}
