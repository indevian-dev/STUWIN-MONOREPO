import type { Timestamps } from '../../../common/base';

export namespace Topic {
    export interface PrivateAccess extends Timestamps {
        id: string;
        name: string;
        description: string | null;
        gradeLevel: number | null;
        language: string | null;
        providerSubjectId: string;
        aiSummary: string | null;
        isActiveAiGeneration: boolean;
        workspaceId: string;
        updatedAt?: string;
        aiAssistantCrib: string | null;
        pdfDetails: any | null;
        questionsStats: any | null;
        parentTopicId: string | null;
        // Keep these for UI compatibility, though they might come from JSON
        chapterNumber?: string | null;
        topicEstimatedQuestionsCapacity?: number | null;
        topicQuestionsRemainingToGenerate?: number | null;
        pdfPageStart?: number | null;
        pdfPageEnd?: number | null;
        totalPdfPages?: number | null;
        estimatedEducationStartDate?: string | null;
        // Legacy properties for backward compatibility during refactor
        isActiveForAi?: boolean;
        topicPublishedQuestionsStats?: number;
        topicGeneralQuestionsStats?: number;
    }

    export interface ListItem {
        id: string;
        name: string;
        providerSubjectId: string;
        isActiveAiGeneration: boolean;
    }
}

export interface Topic extends Topic.PrivateAccess { }

export interface TopicFilters {
    subjectId?: string;
    gradeLevel?: number;
    searchQuery?: string;
    topicId?: string;
}


