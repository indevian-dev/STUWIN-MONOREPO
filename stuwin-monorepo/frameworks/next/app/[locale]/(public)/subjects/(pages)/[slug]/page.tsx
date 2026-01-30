// pages/types/[slug].js

import { PublicSingleSubjectWidget } from '@/app/[locale]/(public)/subjects/(widgets)/PublicSingleSubjectWidget';
import supabase
  from '@/lib/integrations/supabaseServiceRoleClient';
import { Metadata } from 'next';
import { isValidSlimId } from '@/lib/utilities/slimUlidUtility';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface SubjectData {
  id?: string;
  title?: string;
  description?: string;
  image?: string;
}

interface PageProps {
  params: Promise<{
    slug: string;
    locale?: string;
  }>;
}

// Helper function to fetch subject data
const getSubjectData = async (id: string): Promise<SubjectData | null> => {
  try {
    const { data: subject, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      ConsoleLogger.error('Error fetching subject:', error);
      return null;
    }

    return subject;
  } catch (error) {
    ConsoleLogger.error('Error fetching subject:', error);
    return null;
  }
};

// Helper function to extract ID from slug
const extractIdFromSlug = (slug: string): string | null => {
  const parts = slug.split('-');
  const candidate = parts[parts.length - 1];
  return isValidSlimId(candidate) ? candidate : null;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  if (!locale) {
    return {
      title: 'Subject Not Found',
      description: 'The requested subject could not be found.'
    };
  }

  const id = extractIdFromSlug(slug);

  if (!id) {
    return {
      title: 'Subject Not Found',
      description: 'The requested subject could not be found.'
    };
  }

  const subject = await getSubjectData(id);

  if (!subject) {
    return {
      title: 'Subject Not Found',
      description: 'The requested subject could not be found.'
    };
  }

  return {
    title: subject.title
      || 'Subject',
    description: subject.description
      || `Browse items in ${subject.title
      || 'this subject'}`,
    openGraph: {
      title: subject.title
        || 'Subject',
      description: subject.description
        || `Browse items in ${subject.title || 'this subject'}`,
      type: 'website',
      locale: locale,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/subjects/${slug}`,
      ...(subject.image && { images: [{ url: subject.image }] })
    },
  };
}

const PublicSingleSubjectPage = async ({ params }: PageProps) => {
  const { slug } = await params;

  const id = extractIdFromSlug(slug);

  if (!id) {
    return <div>Invalid subject URL</div>;
  }

  const subject = await getSubjectData(id);

  if (!subject) {
    return <div>Subject not found</div>;
  }

  return (
    <PublicSingleSubjectWidget subject={subject} />
  );
}

export default PublicSingleSubjectPage;

