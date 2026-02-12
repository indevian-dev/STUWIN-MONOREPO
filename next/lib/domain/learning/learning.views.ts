
import type { TopicEntity } from './learning.entity';
import type { Timestamps } from '@/lib/domain/base/types';

// ═══════════════════════════════════════════════════════════════
// SUBJECT VIEWS — Context-specific projections
// ═══════════════════════════════════════════════════════════════

/** File attached to a subject (PDF resource) */
export interface SubjectFileView extends Timestamps {
    id: string;
    pdfUrl: string;
    name: string;
    language?: string;
    isActive: boolean;
}

/** What a Provider sees: full control + management capabilities */
export interface SubjectProviderView {
    id: string;
    title: string;
    displayTitle: string;
    description: string | null;
    cover: string | null;
    slug: string | null;
    isActive: boolean | null;
    aiLabel: string | null;
    aiAssistantCrib: string | null;
    language: string | null;
    gradeLevel: number | null;
    totalQuestions: number;
    totalTopics: number;
    canManageTopics: boolean;
    files?: SubjectFileView[];
    createdAt: Date | null;
}

/** What a Student sees: consumption + progress tracking */
export interface SubjectStudentView {
    id: string;
    title: string;
    displayTitle: string;
    description: string | null;
    cover: string | null;
    slug: string | null;
    isActive: boolean | null;
    totalQuestions: number;
    totalTopics: number;
    availableQuizzes: number;
    progress: SubjectProgress;
    createdAt: Date | null;
}

/** What the public sees: minimal, no internal fields */
export interface SubjectPublicView {
    id: string;
    title: string;
    description: string | null;
    cover: string | null;
    slug: string | null;
    language: string | null;
    gradeLevel: number | null;
}

/** What Staff sees: everything + workspace ownership context */
export interface SubjectStaffView {
    id: string;
    title: string;
    displayTitle: string;
    description: string | null;
    cover: string | null;
    slug: string | null;
    isActive: boolean | null;
    aiLabel: string | null;
    aiAssistantCrib: string | null;
    language: string | null;
    gradeLevel: number | null;
    workspaceId: string | null;
    totalQuestions: number;
    totalTopics: number;
    files?: SubjectFileView[];
    createdAt: Date | null;
}

/** Student progress within a subject */
export interface SubjectProgress {
    completedQuizzes: number;
    totalQuizzes: number;
    averageScore: number;
    timeSpent: number;
}

// ═══════════════════════════════════════════════════════════════
// TOPIC VIEWS
// ═══════════════════════════════════════════════════════════════

/** What a Provider sees: full topic with management details */
export interface TopicProviderView {
    id: string;
    name: string | null;
    description: string | null;
    gradeLevel: number | null;
    language: string | null;
    providerSubjectId: string | null;
    aiSummary: string | null;
    isActiveAiGeneration: boolean | null;
    workspaceId: string;
    aiAssistantCrib: string | null;
    pdfDetails: TopicEntity['pdfDetails'];
    questionsStats: TopicEntity['questionsStats'];

    createdAt: Date;
    updatedAt: Date | null;
}

/** What a Student sees: just the learning-relevant info */
export interface TopicStudentView {
    id: string;
    name: string | null;
    description: string | null;
    gradeLevel: number | null;
    providerSubjectId: string | null;
    pdfDetails: TopicEntity['pdfDetails'];
}

/** List item for dropdowns, selectors */
export interface TopicListItem {
    id: string;
    name: string | null;
    providerSubjectId: string | null;
    isActiveAiGeneration: boolean | null;
}

// ═══════════════════════════════════════════════════════════════
// QUESTION VIEWS
// ═══════════════════════════════════════════════════════════════

/** What a Provider sees: full question for management */
export interface QuestionProviderView {
    id: string;
    question: string | null;
    authorAccountId: string | null;
    answers: unknown;
    correctAnswer: string | null;
    providerSubjectId: string | null;
    complexity: string | null;
    gradeLevel: number | null;
    explanationGuide: unknown;
    language: string | null;
    providerSubjectTopicId: string | null;
    isPublished: boolean | null;
    aiAssistantCrib: string | null;
    createdAt: Date;
    updatedAt: Date | null;
}

/** What the public/student sees: no correct answer until submitted */
export interface QuestionPublicView {
    id: string;
    question: string | null;
    answers: unknown;
    complexity: string | null;
    gradeLevel: number | null;
    language: string | null;
}

// ═══════════════════════════════════════════════════════════════
// QUIZ VIEWS
// ═══════════════════════════════════════════════════════════════

export type LearningQuizStatus = 'in_progress' | 'completed' | 'abandoned';

export interface QuizStudentView {
    id: string;
    studentAccountId: string;
    score: number | null;
    questions: unknown;
    subjectId: string | null;
    gradeLevel: number | null;
    status: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
}
