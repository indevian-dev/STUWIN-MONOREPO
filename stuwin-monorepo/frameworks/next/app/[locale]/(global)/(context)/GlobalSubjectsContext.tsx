"use client";

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode
} from 'react';
import {
    getSubjects,
    getSubSubjects,
    getSubjectFilters
} from '@/app/[locale]/(public)/subjects/PublicSubjectsService';

// Type definitions
interface Subject {
    id: string;
    title?: string;
    [key: string]: any;
}

interface SubjectFiltersResult {
    filters?: any[];
    error?: string | null;
}

interface SubSubjectsResult {
    subjects: Subject[];
    error?: string | null;
}

interface GlobalSubjectsContextType {
    subjects: Subject[];
    categoriesHierarchy: Subject[];
    loading: boolean;
    error: string | null;
    getSubSubjects: (subjectId: string) => Promise<SubSubjectsResult>;
    getSubjectFilters: (subjectIds: string | string[]) => Promise<SubjectFiltersResult>;
    refreshSubjects: () => void;
}

const GlobalSubjectsContext = createContext<GlobalSubjectsContextType | null>(null);

interface GlobalSubjectsProviderProps {
    children: ReactNode;
}

export function GlobalSubjectsProvider({ children }: GlobalSubjectsProviderProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all subjects and sort by name on mount
    useEffect(() => {
        let mounted = true;

        const fetchSubjects = async () => {
            try {
                setLoading(true);
                setError(null);
                const { subjects: fetchedSubjects, error: fetchError } = await getSubjects();

                if (!fetchError && mounted) {
                    // Sort subjects by title alphabetically
                    const sortedSubjects = [...fetchedSubjects].sort((a, b) => {
                        const titleA = a.title || '';
                        const titleB = b.title || '';
                        return titleA.localeCompare(titleB);
                    });
                    setSubjects(sortedSubjects);
                } else if (fetchError) {
                    setError(fetchError);
                }
            } catch (error: any) {
                ConsoleLogger.error('Error fetching subjects:', error);
                if (mounted) {
                    setError(error.message || 'Failed to fetch subjects');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchSubjects();

        return () => {
            mounted = false;
        };
    }, []);

    // Memoized function to get subsubjects
    const getSubSubjectsFromContext = useCallback(async (subjectId: string) => {
        try {
            const result = await getSubSubjects(subjectId);
            return result;
        } catch (error: any) {
            ConsoleLogger.error('Error fetching subsubjects:', error);
            return { subjects: [], error: error.message };
        }
    }, []);

    // Memoized function to get subject filters
    const getSubjectFiltersFromContext = useCallback(async (subjectIds: string | string[]) => {
        try {
            const result = await getSubjectFilters(subjectIds);
            return result;
        } catch (error: any) {
            ConsoleLogger.error('Error fetching subject filters:', error);
            return { filters: [], error: error.message };
        }
    }, []);

    const value = {
        subjects,
        // Provide a categories hierarchy alias expected by consumers
        categoriesHierarchy: subjects,
        loading,
        error,
        getSubSubjects: getSubSubjectsFromContext,
        getSubjectFilters: getSubjectFiltersFromContext,
        refreshSubjects: () => {
            // Force re-fetch subjects
            setSubjects([]);
            setLoading(true);
            setError(null);
        }
    };

    return (
        <GlobalSubjectsContext.Provider value={value}>
            {children}
        </GlobalSubjectsContext.Provider>
    );
}

export function useGlobalSubjectsContext(): GlobalSubjectsContextType {
    const context = useContext(GlobalSubjectsContext);
    if (!context) {
        throw new Error('useGlobalSubjectsContext must be used within an GlobalSubjectsProvider');
    }
    return context;
}

// Backward-compatible alias used by some widgets
export function useGlobalCategoryContext(): GlobalSubjectsContextType {
    return useGlobalSubjectsContext();
}