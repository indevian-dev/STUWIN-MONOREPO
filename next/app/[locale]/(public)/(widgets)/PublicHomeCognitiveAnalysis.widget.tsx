"use client";

import { PiBrainDuotone, PiChartLineUpBold, PiPulseFill, PiLightbulbFill } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CardContent, CardHeader, CardTitle, CardDescription } from "../../../primitives/Card.primitive";
import { Section } from "../../../primitives/Section.primitive";

interface FeatureTranslation {
    title: string;
    description: string;
}

interface Feature extends FeatureTranslation {
    icon: React.ReactNode;
}

export function PublicHomeCognitiveAnalysisWidget() {
    const t = useTranslations('PublicHomeCognitiveAnalysisWidget');
    const featuresTranslations = t.raw('features') as FeatureTranslation[];

    const featureIcons = [
        <PiPulseFill key="pulse" className="text-3xl text-app-bright-green" />,
        <PiChartLineUpBold key="chart-up-1" className="text-3xl text-app-bright-green" />,
        <PiLightbulbFill key="lightbulb" className="text-3xl text-app-bright-green" />
    ];

    const features: Feature[] = featuresTranslations.map((f, idx: number) => ({
        ...f,
        icon: featureIcons[idx]
    }));

    return (
        <Section padding="lg" layout="centered" id="cognitive-analysis" className="bg-white dark:bg-app-dark-blue overflow-hidden transition-colors duration-300 rounded-app border border-black/10 dark:border-white/10 shadow-app-widget">

            <div className="relative w-full">
                <div className="flex flex-col gap-16">

                    {/* Top Row: Content + Smaller Visual */}
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-8 space-y-8">
                            <h2 className="text-4xl lg:text-6xl font-black text-app-dark-blue dark:text-white leading-tight tracking-tighter">
                                {t('headline_start')} <span className="text-app-bright-green">{t('headline_end')}</span>
                            </h2>

                            <p className="text-lg text-app-dark-blue/70 dark:text-white/70 leading-relaxed font-medium max-w-3xl">
                                {t('body')}
                            </p>
                        </div>

                        <div className="lg:col-span-4 relative group">
                            <div className="relative rounded-app border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md shadow-app-widget p-6 aspect-square flex flex-col justify-center overflow-hidden">
                                {/* Mock Data Visualization Grid */}
                                <div className="grid grid-cols-8 gap-1 w-full h-full opacity-10">
                                    {Array.from({ length: 32 }).map((_, i) => (
                                        <div key={i} className="rounded-app bg-app-dark-blue dark:bg-white animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
                                    ))}
                                </div>

                                {/* Center Brain/Focus Point */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-app-full blur-[40px] animate-ping" />
                                        <PiBrainDuotone className="text-8xl text-app-dark-blue dark:text-white relative z-10 drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pb-8">
                        {features.map((feature, idx: number) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx}
                                className="group flex flex-col md:flex-row gap-3 rounded-app bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-white dark:bg-app-dark-blue hover:shadow-app-widget hover:-translate-y-1 transition-all duration-300"
                            >
                                <CardHeader className="flex items-center justify-start p-6 pb-2 md:pb-6 md:pr-0">
                                    <div className="p-4 rounded-app bg-white dark:bg-app-dark-blue shadow-sm border border-black/10 dark:border-white/10 group-hover:bg-app-bright-green/10 transition-colors">
                                        {feature.icon}
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6 md:pl-4 flex flex-col justify-center">
                                    <CardTitle className="text-xl font-bold text-app-dark-blue dark:text-white mb-2">{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardContent>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </Section>
    );
}
