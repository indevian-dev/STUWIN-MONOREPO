
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { PiCheckCircleFill, PiCrownBold, PiLightningBold, PiStarBold } from 'react-icons/pi';
import { Link } from '@/i18n/routing';

const tiers = [
    {
        name: 'free',
        price: '0',
        icon: PiStarBold,
        highlight: false,
        features: ['features.limited_ai', 'features.basic_quizzes', 'features.public_resources']
    },
    {
        name: 'pro',
        price: '9.99',
        icon: PiCrownBold,
        highlight: true,
        features: ['features.unlimited_ai', 'features.deep_dive', 'features.custom_quizzes', 'features.priority_support']
    },
    {
        name: 'workspace',
        price: '29.99',
        icon: PiLightningBold,
        highlight: false,
        features: ['features.team_management', 'features.shared_content', 'features.detailed_reports', 'features.bulk_discounts']
    }
];

export function PublicHomePricingWidget() {
    const t = useTranslations('PublicHomePricingWidget');

    return (
        <section id="pricing" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('header')}</h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t('subheader')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative p-8 rounded-[2.5rem] flex flex-col h-full transition-all duration-300 hover:-translate-y-2 ${tier.highlight
                                    ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10'
                                    : 'bg-white text-slate-900 border border-slate-200'
                                }`}
                        >
                            {tier.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-primary text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                                    {t('most_popular')}
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-2xl ${tier.highlight ? 'bg-white/10' : 'bg-slate-100'}`}>
                                    <tier.icon className={`text-3xl ${tier.highlight ? 'text-brand-primary' : 'text-slate-900'}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">{t(`tiers.${tier.name}.title`)}</h3>
                                    <p className={`${tier.highlight ? 'text-slate-400' : 'text-slate-500'} text-xs font-bold uppercase tracking-widest`}>
                                        {t(`tiers.${tier.name}.subtitle`)}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black">{tier.price}</span>
                                    <span className={`text-sm font-bold ${tier.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{t('per_month')}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-12 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <PiCheckCircleFill className={`mt-1 text-lg flex-shrink-0 ${tier.highlight ? 'text-brand-primary' : 'text-slate-900'}`} />
                                        <span className={`text-sm font-medium ${tier.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {t(feature)}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/signup"
                                className={`w-full py-4 rounded-2xl font-black text-center transition-all duration-300 ${tier.highlight
                                        ? 'bg-brand-primary text-slate-900 hover:bg-white'
                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                            >
                                {t('cta')}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
