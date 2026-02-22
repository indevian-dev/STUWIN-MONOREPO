
import React from 'react';
import { Metadata } from 'next';
import { PublicProgramsListWidget } from '@/app/[locale]/(public)/programs/(widgets)/PublicProgramsList.widget';
import { PublicBreadCrumbsTile } from '@/app/[locale]/(public)/(tiles)/PublicBreadCrumbs.tile';

interface PageParams {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{
        page?: string;
    }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: locale === 'az' ? 'Təhsil Proqramları' : locale === 'ru' ? 'Образовательные программы' : 'Educational Programs',
        description: 'Explore programs and organizations on STUWIN.AI',
    };
}

export default async function PublicProgramsPage({ params, searchParams }: PageParams) {
    const { locale } = await params;
    const sParams = await searchParams;
    const page = parseInt(sParams?.page || '1', 10);

    const breadcrumbs = [
        { label: locale === 'az' ? 'Ana səhifə' : 'Home', href: '/' },
        { label: locale === 'az' ? 'Proqramlar' : 'Programs', href: '/programs' }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <PublicBreadCrumbsTile breadcrumbs={breadcrumbs} />
                <PublicProgramsListWidget
                    initialPage={page}
                    pageSize={24}
                />
            </div>
        </div>
    );
}
