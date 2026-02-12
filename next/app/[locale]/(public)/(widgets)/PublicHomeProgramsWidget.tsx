"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { FiMapPin, FiCheckCircle, FiDollarSign } from 'react-icons/fi';
import { Program, fetchProgramsClient, getProgramLogoUrl } from '../programs/PublicProgramsService';

export function PublicHomeProgramsWidget() {
    const t = useTranslations('PublicHomeProgramsWidget');
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPrograms() {
            const response = await fetchProgramsClient({ pageSize: 3 });
            if (response.success) {
                setPrograms(response.programs);
            }
            setLoading(loading => !loading);
        }
        loadPrograms();
    }, []);

    if (loading) {
        return (
            <section id="programs" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16 animate-pulse">
                        <div className="h-12 w-64 bg-slate-100 mx-auto rounded-xl mb-4" />
                        <div className="h-6 w-96 bg-slate-50 mx-auto rounded-lg" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-96 w-full md:w-[calc(33.333%-1.5rem)] max-w-sm bg-slate-50 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (programs.length === 0) return null;

    return (
        <section id="programs" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">{t('header')}</h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">{t('subheader')}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-8">
                    {programs.map((program) => {
                        const logoUrl = getProgramLogoUrl(program);
                        const profile = program.profile || {};
                        const price = profile.providerSubscriptionPrice || profile.monthlyPrice;
                        const period = profile.providerSubscriptionPeriod || 'month';
                        const currency = profile.currency || 'AZN';

                        return (
                            <Link
                                key={program.id}
                                href={`/programs/${program.id}`}
                                className="group relative bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden flex flex-col h-full w-full md:w-[calc(33.333%-1.5rem)] max-w-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/50"
                            >
                                {/* Logo/Image Container */}
                                <div className="relative w-full aspect-[16/10] bg-slate-50 overflow-hidden">
                                    <Image
                                        src={logoUrl}
                                        alt={program.title || 'Educational Program'}
                                        fill
                                        className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {program.isActive && (
                                        <div className="absolute top-4 right-4 bg-brand text-white px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold shadow-lg">
                                            <FiCheckCircle size={14} />
                                            {t('active')}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-8 flex flex-col flex-1">
                                    <h3 className="font-black text-xl text-slate-900 mb-3 line-clamp-2 group-hover:text-brand transition-colors">
                                        {program.title}
                                    </h3>

                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6 flex-grow">
                                        {profile.providerProgramDescription || t('no_description')}
                                    </p>

                                    {/* Footer */}
                                    <div className="pt-6 border-t border-slate-50 space-y-4">
                                        {profile.location && (
                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                                <FiMapPin size={14} className="text-brand" />
                                                <span className="line-clamp-1">
                                                    {profile.location.address || profile.location.city}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-lg font-black text-slate-900">
                                                {price ? (
                                                    <>
                                                        <FiDollarSign size={20} className="text-brand" />
                                                        <span>
                                                            {price} <span className="text-sm font-bold text-slate-400">{currency} / {period}</span>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400 text-sm font-bold">{t('no_price')}</span>
                                                )}
                                            </div>

                                            <span className="text-sm font-black text-brand">
                                                {t('more_details')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-16 text-center">
                    <Link
                        href="/programs"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black transition-all hover:bg-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                    >
                        {t('cta')}
                    </Link>
                </div>
            </div>
        </section>
    );
}
