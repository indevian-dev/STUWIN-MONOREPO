"use client";

import { PiTerminalFill, PiShieldCheckeredFill, PiFadersFill, PiCodeBlockBold } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { IconType } from "react-icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../primitives/Card.primitive";
import { Section } from "../../../primitives/Section.primitive";

interface FeatureTranslation {
    title: string;
    description: string;
}

interface Feature extends FeatureTranslation {
    Icon: IconType;
}

export function PublicHomeExpertIntelligenceWidget() {
    const t = useTranslations('PublicHomeExpertIntelligenceWidget');
    const featuresTranslations = t.raw('features') as FeatureTranslation[];

    const featureIcons = [
        PiTerminalFill,
        PiFadersFill,
        PiShieldCheckeredFill,
        PiCodeBlockBold,
        PiTerminalFill
    ];

    const features: Feature[] = featuresTranslations.map((f, idx) => ({
        ...f,
        Icon: featureIcons[idx] || PiTerminalFill
    }));

    return (
        <Section padding="lg" layout="centered" id="expert-intelligence" className="bg-white dark:bg-app-dark-blue transition-colors duration-300 rounded-app border border-black/10 dark:border-white/10 shadow-app-widget overflow-hidden">


            <div className="relative w-full z-10">
                <div className="flex flex-col gap-16 text-left items-center">
                    {/* Full Width Header */}
                    <div className="grid grid-cols-1 gap-8">
                        <h2 className="text-4xl lg:text-6xl font-black text-app-dark-blue dark:text-white leading-[0.9] tracking-tighter">
                            {t('headline_start')} <br />
                            <span className="text-app-bright-green">{t('headline_end')}</span>
                        </h2>

                        <p className="text-lg text-app-dark-blue/70 dark:text-white/70 leading-relaxed font-medium w-full">
                            {t('body')}
                        </p>
                    </div>

                    {/* Full Width Visual Representation of the Lab */}
                    <div className="relative w-full aspect-[3/4] sm:aspect-[5/3] md:aspect-[7/3] lg:aspect-[10/3] rounded-app border border-black/10 dark:border-white/10 bg-[#0f172a] overflow-hidden shadow-app-widget">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                        <div className="p-8 h-full flex flex-col text-xs md:text-sm">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-6 mb-6">
                                <div className="w-3 h-3 rounded-app-full bg-rose-500" />
                                <div className="w-3 h-3 rounded-app-full bg-amber-500" />
                                <div className="w-3 h-3 rounded-app-full bg-emerald-500" />
                                <span className="ml-4 text-slate-400">{t('terminal.version')}</span>
                            </div>
                            <div className="space-y-2 text-slate-300">
                                <p>{'>'} {t('terminal.init_flow')}</p>
                                <p>{'>'} {t('terminal.inject_context')}</p>
                                <p>{'>'} {t('terminal.calibrate')}</p>
                                <p className="text-app-bright-green">{'>'} {t('terminal.ready')}</p>
                                <p className="animate-pulse">_</p>
                            </div>

                            {/* Visual Pulse Wave */}
                            <div className="mt-auto h-32 flex items-end gap-1">
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: "10%" }}
                                        animate={{ height: ["20%", "70%", "30%", "60%", "20%"] }}
                                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.05 }}
                                        className="flex-1 bg-app-bright-green/50 rounded-t-app"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 w-full text-left">
                        {features.map((feature, idx: number) => {
                            const Icon = feature.Icon;
                            return (
                                <Card key={idx} className="group flex flex-col items-start transition-all hover:shadow-lg hover:-translate-y-1 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10">
                                    <CardHeader className="pb-4 pt-6">
                                        <div className="p-3 w-fit rounded-app bg-app-bright-green/10 text-app-bright-green shadow-sm mb-2 group-hover:bg-app-bright-green group-hover:text-[#0f172b] transition-colors">
                                            <Icon size={24} />
                                        </div>
                                        <CardTitle className="text-base font-black text-app-dark-blue dark:text-white">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-sm">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                </div>
            </div>
        </Section>
    );
}
