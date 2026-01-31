'use client'

import {
    useState
} from 'react';
import { useTranslations } from 'next-intl';

import { PublicSectionTitleTile } from '@/app/[locale]/(public)/(tiles)/PublicSectionTitleTile';
import { PublicQuestionsListWidget } from '@/app/[locale]/(public)/questions/(widgets)/PublicQuestionsListWidget';
import { PublicCardsSearchWidget } from '@/app/[locale]/(public)/filters/(widgets)/PublicQuestionsSearchWidget';
import { PublicCardsSortWidget } from '@/app/[locale]/(public)/filters/(widgets)/PublicQuestionsSortWidget';
import { PublicCardsFiltersWidget } from '@/app/[locale]/(public)/filters/(widgets)/PublicQuestionsFiltersWidget';

interface Question {
    id?: string;
    body: string;
    answers: Record<string, string> | string;
    correct_answer: string;
    explanation_guide?: string | { text?: string };
    subject_title?: string;
    complexity?: 'easy' | 'medium' | 'hard';
    grade_level?: number;
}

interface Subject {
    id?: string;
    title?: string;
    description?: string;
    image?: string;
    type?: string;
}

interface PublicSubjectQuestionsWidgetProps {
    subject: Subject;
}

export function PublicSubjectQuestionsWidget({ subject }: PublicSubjectQuestionsWidgetProps) {
    const t = useTranslations('PublicSubjectQuestionsWidget');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!subject?.id) {
        return null;
    }

    return (
        <section className='w-full my-8 md:my-12 lg:my-16 max-w-7xl px-4 mx-auto'>
            <PublicSectionTitleTile sectionTitle={t('questions')} />

            <div>
                <div className='w-full grid grid-cols-12 gap-4 gap-y-6 my-4'>
                    <PublicCardsSearchWidget
                        placeholder="Search for questions..."
                        className="col-span-10"
                    />
                    <PublicCardsSortWidget
                        defaultSort="newest"
                        showSortLabel={true}
                        className="col-span-2"
                    />
                </div>
                <div className='w-full grid grid-cols-12 gap-4 gap-y-6'>
                    <PublicCardsFiltersWidget
                        withCategoriesStats={false}
                        showCategoryFilters={false}
                        className="col-span-3"
                    />

                    {/* Questions column shows loading state */}
                    <div className="col-span-9">
                        {error ? (
                            <div className='text-center py-12'>
                                <p className='text-red-500'>{error}</p>
                            </div>
                        ) : loading ? (
                            <div className='flex justify-center items-center py-12'>
                                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                                <span className='ml-3 text-gray-600'>{t('loading')}...</span>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className='text-center py-12'>
                                <p className='text-gray-500'>{t('no_questions_found')}</p>
                            </div>
                        ) : (
                            <PublicQuestionsListWidget questions={questions} className="col-span-9" />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
