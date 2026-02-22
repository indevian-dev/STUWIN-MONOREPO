"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { Program, fetchProgramsClient, getProgramLogoUrl } from '../programs/PublicProgramsService';
import { buttonVariants } from '../../../primitives/Button.primitive';
import { Section } from "../../../primitives/Section.primitive";

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
            <Section padding="hero" layout="centered" id="programs" className="bg-white dark:bg-app-dark-blue transition-colors duration-300 rounded-app border border-black/10 dark:border-white/10 shadow-app-widget mb-6">
                <div className="w-full relative text-center">
                    <div className="text-center mb-16 animate-pulse">
                        <div className="h-12 w-64 bg-black/5 dark:bg-white/5 backdrop-blur-md mx-auto rounded-app mb-4" />
                        <div className="h-6 w-96 bg-black/5 dark:bg-white/5 backdrop-blur-md mx-auto rounded-app" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-96 w-full md:w-[calc(33.333%-1.5rem)] max-w-sm bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-app animate-pulse" />
                        ))}
                    </div>
                </div>
            </Section>
        );
    }

    if (programs.length === 0) return null;

    return (
        <Section padding="lg" layout="centered" id="programs" className="bg-white dark:bg-app-dark-blue transition-colors duration-300 rounded-app border border-black/10 dark:border-white/10 shadow-app-widget mb-6">
            <div className="w-full relative">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-5xl md:text-6xl font-black text-app-dark-blue dark:text-white tracking-tight">{t('header')}</h2>
                    <p className="text-xl text-app-dark-blue/70 dark:text-white/70 max-w-2xl mx-auto font-medium">{t('subheader')}</p>
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
                                className="group relative bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-app overflow-hidden flex flex-col h-full w-full md:w-[calc(33.333%-1.5rem)] max-w-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-app-widget hover:bg-black/5 dark:bg-white/5 shadow-sm"
                            >
                                {/* Logo/Image Container */}
                                <div className="relative w-full aspect-[16/10] bg-white dark:bg-app-dark-blue overflow-hidden">
                                    <Image
                                        src={logoUrl}
                                        alt={program.title || 'Educational Program'}
                                        fill
                                        className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {program.isActive && (
                                        <div className="absolute top-4 right-4 bg-app-bright-green text-white px-4 py-1.5 rounded-app-full flex items-center gap-2 text-xs font-bold shadow-lg">
                                            <FiCheckCircle size={14} />
                                            {t('active')}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-8 flex flex-col flex-1">
                                    <h3 className="font-black text-xl text-app-dark-blue dark:text-white mb-3 line-clamp-2 group-hover:text-app-bright-green transition-colors">
                                        {program.title}
                                    </h3>

                                    <p className="text-app-dark-blue/70 dark:text-white/70 text-sm leading-relaxed line-clamp-2 mb-6 flex-grow">
                                        {profile.providerProgramDescription || t('no_description')}
                                    </p>

                                    {/* Footer */}
                                    <div className="pt-6 border-t border-black/10 dark:border-white/10 space-y-4">
                                        {profile.location && (
                                            <div className="flex items-center gap-2 text-xs font-semibold text-app-dark-blue/70 dark:text-white/70">
                                                <FiMapPin size={14} className="text-app-bright-green" />
                                                <span className="line-clamp-1">
                                                    {profile.location.address || profile.location.city}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-lg font-black text-app-dark-blue dark:text-white">
                                                {price ? (
                                                    <>
                                                        <span className="text-app-bright-green text-xl">₼</span>
                                                        <span>
                                                            {price} <span className="text-sm font-bold text-app-dark-blue/70 dark:text-white/70">{currency} / {period}</span>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-app-dark-blue/70 dark:text-white/70 text-sm font-bold">{t('no_price')}</span>
                                                )}
                                            </div>

                                            <span className="text-sm font-black text-app-bright-green">
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
                        className={[buttonVariants({ variant: "default", size: "xl" }), "text-[#0f172b]"].filter(Boolean).join(" ")}
                    >
                        {t('cta')}
                    </Link>
                </div>
            </div>
        </Section>
    );
}
