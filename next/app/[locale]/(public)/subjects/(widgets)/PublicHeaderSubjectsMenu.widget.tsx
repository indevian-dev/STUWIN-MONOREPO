


'use client'

import { useRouter } from 'next/navigation';

import Image from 'next/image';

interface PublicHeaderSubjectsMenuWidgetProps {
    onMenuClose?: () => void;
}

export function PublicHeaderSubjectsMenuWidget({ onMenuClose }: PublicHeaderSubjectsMenuWidgetProps) {
    const router = useRouter();
    const subjects: any[] = [];
    const loading = false;
    const error = null;

    const handleSubjectClick = (subjectId: number | string, slug: string) => {
        router.push(`/subjects/${slug}-${subjectId}`);
        // Close the menu after navigating
        if (onMenuClose) {
            onMenuClose();
        }
    };

    // Handle loading state
    if (loading) {
        return (
            <section className='relative m-auto max-w-screen-xl grid gap-3 grid-cols-1 lg:grid-cols-3 justify-center px-4'>
                <div className="text-center col-span-1 lg:col-span-3 p-4">
                    <div className="animate-pulse text-gray-500">Loading subjects...</div>
                </div>
            </section>
        );
    }

    // Handle error state
    if (error) {
        return (
            <section className='relative m-auto max-w-screen-xl grid gap-3 grid-cols-1 lg:grid-cols-3 justify-center px-4'>
                <div className="text-center col-span-1 lg:col-span-3 p-4">
                    <div className="text-red-500">Error loading subjects: {error}</div>
                </div>
            </section>
        );
    }

    if (!subjects || subjects.length === 0) {
        return (
            <section className='relative m-auto max-w-screen-xl grid gap-3 grid-cols-1 lg:grid-cols-3 justify-center px-4'>
                <div className="text-center col-span-1 lg:col-span-3 p-4 text-gray-500">
                    No subjects found.
                </div>
            </section>
        );
    }

    return (
        <section className='relative m-auto max-w-screen-xl grid gap-3 grid-cols-1 lg:grid-cols-3 justify-center px-4 py-20 '>
            {subjects.map((subject) => (
                <div
                    key={subject.id}
                    className='w-full cursor-pointer hover:bg-gray-100 rounded-app transition-colors duration-200 relative aspect-[5/2]'
                    onClick={() => handleSubjectClick(subject.id, subject.slug)}
                >
                    <Image src={`${process.env.NEXT_PUBLIC_S3_PREFIX || ''}/subjects/${subject.cover}`} alt={subject.title || 'Subject'} fill objectFit='cover' className='rounded-app object-cover opacity-80' />
                    <h2 className=' absolute bottom-8 left-8 right-8 text-4xl font-black p-2 line-clamp-1 text-app-dark-blue dark:text-white'>{subject.title || 'Subject'}</h2>
                </div>
            ))}
        </section>
    );
}