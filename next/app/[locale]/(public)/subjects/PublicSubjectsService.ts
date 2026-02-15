'use client';

import { apiCall } from '@/lib/utils/http/SpaApiClient';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
/**
 * Subjects Public Service
 * Provides client-side functions for fetching subject data from the API
 */

interface Subject {
  id: string;
  title?: string;
  title_ru?: string;
  title_en?: string;
  description?: string;
  parent_id?: string | null;
  is_active?: boolean;
  type?: string;
  children?: Subject[];
}

interface SubjectsResponse {
  subjects: Subject[];
  error: string | null;
}

interface SubjectResponse {
  subject: Subject | null;
  error: string | null;
}

interface SubjectFiltersResponse {
  filters: any[];
  error: string | null;
}

interface SubjectHierarchyResponse {
  hierarchy: Subject[];
  subjects: Subject[];
  error: string | null;
}

/**
 * Fetch all subjects or subjects filtered by parent_id
 */
export async function getSubjects(parentId: string | null = null): Promise<SubjectsResponse> {
  try {
    const params: Record<string, any> = {};
    if (parentId !== null) {
      params.parent_id = parentId;
    }

    const response = await apiCall<any>({
      method: 'GET',
      url: '/api/subjects',
      params,
      body: {}
    });

    // apiCall throws on error — no manual status check needed
    return {
      subjects: response.subjects || [],
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching subjects:', error);
    return {
      subjects: [],
      error: error.message || 'Failed to fetch subjects'
    };
  }
}

/**
 * Fetch a single subject by ID
 */
export async function getSubjectById(subjectId: string): Promise<SubjectResponse> {
  try {
    if (!subjectId) {
      throw new Error('Subject ID is required');
    }

    const response = await apiCall<any>({
      method: 'GET',
      url: `/api/subjects/${subjectId}`,
      params: {},
      body: {}
    });

    // apiCall throws on error — no manual status check needed
    return {
      subject: response.subject || null,
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching subject by ID:', error);
    return {
      subject: null,
      error: error.message || 'Failed to fetch subject'
    };
  }
}

/**
 * Fetch parent subjects (subjects with parent_id = null)
 */
export async function getParentSubjects(): Promise<SubjectsResponse> {
  try {
    const response = await apiCall<any>({
      method: 'GET',
      url: '/api/subjects',
      params: { parent_id: 'null' },
      body: {}
    });

    // apiCall throws on error — no manual status check needed
    return {
      subjects: response.subjects || [],
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching parent subjects:', error);
    return {
      subjects: [],
      error: error.message || 'Failed to fetch parent subjects'
    };
  }
}

/**
 * Fetch subsubjects for a specific parent subject
 */
export async function getSubSubjects(parentId: string): Promise<SubjectsResponse> {
  try {
    if (!parentId) {
      throw new Error('Parent ID is required');
    }

    const response = await apiCall<any>({
      method: 'GET',
      url: '/api/subjects',
      params: { parent_id: parentId },
      body: {}
    });

    // apiCall throws on error — no manual status check needed
    return {
      subjects: response.subjects || [],
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching subsubjects:', error);
    return {
      subjects: [],
      error: error.message || 'Failed to fetch subsubjects'
    };
  }
}

/**
 * Build hierarchical subject structure from flat array
 */
export function buildSubjectHierarchy(subjects: Subject[], parentId: string | null = null): Subject[] {
  if (!Array.isArray(subjects)) {
    return [];
  }

  return subjects
    .filter(subject => subject.parent_id === parentId)
    .map(subject => ({
      ...subject,
      children: buildSubjectHierarchy(subjects, subject.id)
    }))
    .sort((a, b) => {
      // Sort by title, handling null/undefined values
      const titleA = a.title || '';
      const titleB = b.title || '';
      return titleA.localeCompare(titleB);
    });
}

/**
 * Fetch all subjects and organize them into a hierarchy
 */
export async function getSubjectsHierarchy(): Promise<SubjectHierarchyResponse> {
  try {
    const response = await apiCall<any>({
      method: 'GET',
      url: '/api/subjects',
      params: {},
      body: {}
    });

    // apiCall throws on error — no manual status check needed
    const subjects: Subject[] = response.subjects || [];
    const hierarchy = buildSubjectHierarchy(subjects);

    return {
      hierarchy,
      subjects,
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching subjects hierarchy:', error);
    return {
      hierarchy: [],
      subjects: [],
      error: error.message || 'Failed to fetch subjects hierarchy'
    };
  }
}

/**
 * Filter subjects by active status
 */
export function filterActiveSubjects(subjects: Subject[], activeOnly: boolean = true): Subject[] {
  if (!Array.isArray(subjects)) {
    return [];
  }

  if (!activeOnly) {
    return subjects;
  }

  return subjects.filter(subject => subject.is_active === true);
}

/**
 * Get subject path/breadcrumb from root to specified subject
 */
export function getSubjectPath(subjects: Subject[], subjectId: string): Subject[] {
  if (!Array.isArray(subjects) || !subjectId) {
    return [];
  }

  const path: Subject[] = [];
  let currentSubject = subjects.find(subj => subj.id === subjectId);

  while (currentSubject) {
    path.unshift(currentSubject);
    currentSubject = currentSubject.parent_id
      ? subjects.find(subj => subj.id === currentSubject!.parent_id)
      : undefined;
  }

  return path;
}

/**
 * Search subjects by title (supports multiple languages)
 */
export function searchSubjects(subjects: Subject[], searchTerm: string, locale: string = 'en'): Subject[] {
  if (!Array.isArray(subjects) || !searchTerm || searchTerm.trim() === '') {
    return subjects;
  }

  const term = searchTerm.toLowerCase().trim();

  return subjects.filter(subject => {
    // Check default title
    if (subject.title && subject.title.toLowerCase().includes(term)) {
      return true;
    }

    // Check localized titles
    if (locale === 'ru' && subject.title_ru && subject.title_ru.toLowerCase().includes(term)) {
      return true;
    }

    if (locale === 'en' && subject.title_en && subject.title_en.toLowerCase().includes(term)) {
      return true;
    }

    // Check description
    if (subject.description && subject.description.toLowerCase().includes(term)) {
      return true;
    }

    return false;
  });
}

/**
 * Get subjects by type
 */
export function getSubjectsByType(subjects: Subject[], type: string): Subject[] {
  if (!Array.isArray(subjects) || !type) {
    return [];
  }

  return subjects.filter(subject => subject.type === type);
}

/**
 * Get subject filters for specified subject IDs
 */
export async function getSubjectFilters(subjectIds: string | string[]): Promise<SubjectFiltersResponse> {
  try {
    const ids = Array.isArray(subjectIds) ? subjectIds : [subjectIds];

    if (ids.length === 0) {
      return { filters: [], error: null };
    }

    const response = await apiCall<any>({
      method: 'GET',
      url: '/api/subjects/filters',
      params: { subject_id: ids.join(',') },
      body: {}
    });

    // apiCall throws on error — no manual status check needed
    return {
      filters: response.filters || [],
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching subject filters:', error);
    return {
      filters: [],
      error: error.message || 'Failed to fetch subject filters'
    };
  }
}

