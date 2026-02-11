'use client'
import { getS3Url } from '@/lib/utils/upload/S3Util';

import React, {
  useEffect,
  useState
} from 'react';
import Link
  from 'next/link';
import { useTranslations } from 'next-intl';


import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
interface Subject {
  id: string;
  title?: string;
  title_ru?: string;
  title_en?: string;
  description?: string;
  parent_id?: string | null;
  is_active?: boolean;
  type?: string;
  slug?: string;
  icon?: string;
  children?: Subject[];
}

interface PublicSubjectsFastNavigationWidgetProps {
  subject?: Subject;
}

export function PublicSubjectsFastNavigationWidget({ subject }: PublicSubjectsFastNavigationWidgetProps) {

  const [fastNavigationSubjects, setFastNavigationSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('Global');

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);

        if (subject && subject.id) {
          // TODO: If needed, implement a direct API call here instead of context
          // For now, we return empty to avoid errors
          setFastNavigationSubjects([]);
        } else {
          setFastNavigationSubjects([]);
        }
      } catch (error) {
        ConsoleLogger.error('Error loading subsubjects:', error);
        setFastNavigationSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [subject]);

  if (loading) {
    return <div className="flex justify-center items-center h-full  p-8"><div className="loader h-8 w-8"></div></div>;
  }

  if (!fastNavigationSubjects || fastNavigationSubjects.length === 0) {
    return null; // Don't render anything if conditions aren't met
  }

  return (
    <section className="max-w-screen-xl m-auto px-4 my-4 md:my-6 lg:my-8">
      <div className='grid grid-rows-2 grid-flow-col gap-3 overflow-x-scroll py-2 pb-4 text-sm'>
        <Link key={'map'} href={`/map`} passHref className={`col-span-6 lg:col-span-8 px-2 pt-2 pb-10 rounded flex items-center  relative bg-brand text-light`} >
          <span className="absolute top-2 font-semibold line-clamp-2">Map</span>
        </Link>
        {fastNavigationSubjects && fastNavigationSubjects.length > 0 && fastNavigationSubjects.map((subject, index) => {
          return (
            <Link key={subject.id} href={`/subjects/${subject.slug}-${subject.id}`} passHref className={`col-span-12 px-2 pt-2 pb-4 rounded flex items-start  relative overflow-hidden ${subject.type === 'digital' ? 'bg-dark/10 text-dark' : 'bg-brand/5 text-dark'}`} >
              {subject.icon ? (
                <img src={getS3Url(`subjects/${subject.id}/${subject.icon}`)} alt={subject.title} className="h-2/3 lg:h-2/3 absolute bottom-0 right-0 opacity-100" />
              ) : (
                <div className="h-12 w-12  flex items-center justify-center absolute bottom-0 right-0">
                </div>
              )}
              <span className='absolute w-full h-full top-0 bottom-0 left-0 right-0'></span>
              <span className="font-semibold line-clamp-3 w-full">{subject.title}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}