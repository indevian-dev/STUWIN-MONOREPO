
import type { Timestamps } from '../../../types/base';

// ═══════════════════════════════════════════════════════════════
// CONTENT MODULE TYPES (CMS)
// ═══════════════════════════════════════════════════════════════

export type BlogId = string & { readonly __brand: 'BlogId' };
export type PageId = string & { readonly __brand: 'PageId' };
export type PromptId = string & { readonly __brand: 'PromptId' };

// ═══════════════════════════════════════════════════════════════
// BLOGS
// ═══════════════════════════════════════════════════════════════

export namespace Blog {
    export interface Entity extends Timestamps {
        id: string;
        titleAz?: string;
        titleEn?: string;
        metaTitleAz?: string;
        metaTitleEn?: string;
        metaDescriptionAz?: string;
        metaDescriptionEn?: string;
        contentAz?: string;
        contentEn?: string;
        slug: string;
        isActive: boolean;
        isFeatured: boolean;
        cover?: string;
        createdBy?: number;
    }

    export interface CreateInput {
        titleAz?: string;
        titleEn?: string;
        contentAz?: string;
        contentEn?: string;
        slug: string;
        isActive?: boolean;
        isFeatured?: boolean;
        cover?: string;
    }
}

// ═══════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════

export namespace Page {
    export interface Entity extends Timestamps {
        id: string;
        type: string;
        titleAz?: string;
        titleEn?: string;
        contentAz?: string;
        contentEn?: string;
        metadata?: any;
        isActive: boolean;
    }
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════

export namespace Prompt {
    export interface Entity extends Timestamps {
        id: string;
        name: string;
        prompt: string;
        version: number;
        description?: string;
    }
}
