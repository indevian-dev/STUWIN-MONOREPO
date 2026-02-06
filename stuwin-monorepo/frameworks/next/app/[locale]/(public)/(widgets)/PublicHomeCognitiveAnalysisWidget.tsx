"use client";

import { PiBrainDuotone, PiChartLineUpBold, PiPulseFill, PiLightbulbFill } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// Features will be mapped from translations inside the component

export function PublicHomeCognitiveAnalysisWidget() {
    const t = useTranslations('PublicHomeCognitiveAnalysisWidget');
    const featuresTranslations = t.raw('features');

    const featureIcons = [
        <PiPulseFill className="text-3xl text-brand" />,
        <PiChartLineUpBold className="text-3xl text-brand" />,
        <PiLightbulbFill className="text-3xl text-brand" />,
        <PiChartLineUpBold className="text-3xl text-brand" />
    ];

    const features = featuresTranslations.map((f: any, idx: number) => ({
        ...f,
        icon: featureIcons[idx]
    }));

    return (
        <section id="cognitive-analysis" className="relative py-24 lg:py-32 bg-white overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl px-4 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4">
                <div className="flex flex-col gap-16">

                    {/* Top Row: Content + Smaller Visual */}
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-8 space-y-8">
                            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tighter">
                                {t('headline_start')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary">{t('headline_end')}</span>
                            </h2>

                            <p className="text-lg text-slate-600 leading-relaxed font-medium max-w-3xl">
                                {t('body')}
                            </p>
                        </div>

                        {/* Smaller Visual Side */}
                        <div className="lg:col-span-4 relative group">
                            <div className="absolute  bg-gradient-to-tr from-emerald-500/10 to-blue-600/10 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50" />
                            <div className="relative rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50 p-6 aspect-square flex flex-col justify-center overflow-hidden">
                                {/* Mock Data Visualization Grid */}
                                <div className="grid grid-cols-8 gap-1 w-full h-full opacity-10">
                                    {Array.from({ length: 32 }).map((_, i) => (
                                        <div key={i} className="rounded-sm bg-slate-400 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
                                    ))}
                                </div>

                                {/* Center Brain/Focus Point */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[40px] animate-ping" />
                                        <PiBrainDuotone className="text-8xl text-slate-900 relative z-10 drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pb-8">
                        {features.map((feature: any, idx: number) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx}
                                className="flex flex-col md:flex-row gap-6 p-4 rounded bg-slate-100 border border-slate-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                            >
                                <div className="flex items-center justify-start">
                                    <div className=" p-4 rounded-2xl bg-white shadow-sm h-fit">
                                        {feature.icon}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
