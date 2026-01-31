import type { Timestamps } from '../../../common/base';

export namespace Topic {
    export interface PrivateAccess extends Timestamps {
        id: string;
        name: string;
        description: string | null;
        gradeLevel: number | null;
        language: string | null;
        subjectId: string;
        aiSummary: string | null;
        topicPublishedQuestionsStats: number;
        topicGeneralQuestionsStats: number;
        isActiveForAi: boolean;
        topicEstimatedQuestionsCapacity: number | null;
        topicQuestionsRemainingToGenerate: number | null;
        pdfS3Key: string | null;
        pdfPageStart: number | null;
        pdfPageEnd: number | null;
        totalPdfPages: number | null;
        chapterNumber: string | null;
        parentTopicId: string | null;
        subjectPdfId?: string | null;
        estimatedEducationStartDate: string | null;
        aiAssistantCrib: string | null;
    }

    export interface ListItem {
        id: string;
        name: string;
        subjectId: string;
        isActiveForAi: boolean;
    }
}

export interface Topic extends Topic.PrivateAccess { }

export interface TopicFilters {
    subjectId?: string;
    gradeLevel?: number;
    searchQuery?: string;
    topicId?: string;
}


