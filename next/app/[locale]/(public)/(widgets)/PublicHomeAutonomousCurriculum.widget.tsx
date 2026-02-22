"use client";


import { PiFilesFill, PiCaretDoubleRightBold, PiDatabaseFill, PiLightningFill } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Section } from "../../../primitives/Section.primitive";

export function PublicHomeAutonomousCurriculumWidget() {
    const t = useTranslations('PublicHomeAutonomousCurriculumWidget');

    return (
        <Section padding="lg" layout="centered" id="curriculum" className="relative bg-white dark:bg-app-dark-blue rounded-app border border-black/10 dark:border-white/10 shadow-app-widget overflow-hidden transition-colors duration-300">
            <div className="relative w-full z-10">
                <div className="flex flex-col items-center text-left gap-16">
                    <div className="space-y-6 w-full text-center">
                        <h2 className="text-4xl lg:text-6xl font-black text-app-dark-blue dark:text-white tracking-tighter w-full">
                            {t('headline_start')} <span className="text-app-bright-green">{t('headline_end')}</span>
                        </h2>

                        <p className="text-lg text-app-dark-blue/70 dark:text-white/70 leading-relaxed font-medium mx-auto max-w-2xl">
                            {t('body')}
                        </p>
                    </div>

                    {/* Full Width Visual: The Knowledge Pipeline */}
                    <div className="relative w-full aspect-[3/1] md:aspect-[5/1] lg:aspect-[6/1] rounded-app border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md overflow-hidden shadow-app-widget flex items-center justify-center group">
                        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 backdrop-blur-md opacity-50" />

                        {/* Animated Pipeline Nodes */}
                        <div className="relative flex items-center justify-between w-full px-4 z-0">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-2 rounded-app text-app-dark-blue/70 dark:text-white/70 group-hover:bg-app-bright-green group-hover:text-white transition-all duration-500">
                                    <PiFilesFill size={32} />
                                </div>
                                <span className="text-[10px] font-bold text-app-dark-blue/70 dark:text-white/70 tracking-widest">{t('pipeline.ingest')}</span>
                            </div>

                            <div className="flex-1 h-px bg-black/10 dark:bg-white/10 relative overflow-hidden">
                                <motion.div
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="absolute inset-0 bg-app-bright-green w-full opacity-50"
                                />
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="p-2 rounded-app bg-app-bright-green text-white shadow-lg shadow-app/20 scale-125">
                                    <PiDatabaseFill size={32} />
                                </div>
                                <span className="text-[10px] font-bold text-app-bright-green tracking-widest">{t('pipeline.structure')}</span>
                            </div>

                            <div className="flex-1 h-px bg-black/10 dark:bg-white/10 relative overflow-hidden">
                                <motion.div
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 0.5 }}
                                    className="absolute inset-0 bg-app-dark-blue dark:bg-white w-full opacity-50"
                                />
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="p-2 rounded-app text-app-dark-blue/70 dark:text-white/70 group-hover:bg-app-dark-blue dark:bg-white group-hover:text-white transition-all duration-500">
                                    <PiLightningFill size={32} />
                                </div>
                                <span className="text-[10px] font-bold text-app-dark-blue/70 dark:text-white/70 tracking-widest">{t('pipeline.synthesize')}</span>
                            </div>
                        </div>


                    </div>

                    <div className="grid md:grid-cols-3 gap-8 w-full text-left">
                        {/* Step 1: Ingest */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="group p-8 rounded-[2.5rem] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-app-widget flex flex-col gap-8 transition-all hover:bg-white dark:hover:bg-app-dark-blue backdrop-blur-md"
                        >
                            <div className="p-4 rounded-app bg-white dark:bg-app-dark-blue text-slate-400 group-hover:bg-app-bright-green/10 group-hover:text-app-bright-green w-fit transition-colors">
                                <PiFilesFill size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-app-dark-blue dark:text-white">{t('steps.ingest.title')}</h3>
                                <p className="text-app-dark-blue/70 dark:text-white/70 text-sm leading-relaxed">
                                    {t('steps.ingest.description')}
                                </p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-black/10 dark:border-white/10">
                                <div className="flex items-center gap-2 text-xs font-bold text-app-dark-blue/50 dark:text-white/50 uppercase tracking-widest">
                                    <span>{t('steps.ingest.phase')}</span>
                                    <PiCaretDoubleRightBold className="text-app-bright-green" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2: Extract */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="group p-8 rounded-[2.5rem] bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 shadow-app-widget flex flex-col gap-8 transition-all backdrop-blur-md hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            <div className="p-4 rounded-app bg-app-bright-green/10 text-app-bright-green w-fit">
                                <PiDatabaseFill size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-app-dark-blue dark:text-white">{t('steps.structure.title')}</h3>
                                <p className="text-app-dark-blue/70 dark:text-white/70 text-sm leading-relaxed">
                                    {t('steps.structure.description')}
                                </p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-black/10 dark:border-white/10">
                                <div className="flex items-center gap-2 text-xs font-bold text-app-dark-blue/50 dark:text-white/50 uppercase tracking-widest">
                                    <span>{t('steps.structure.phase')}</span>
                                    <PiCaretDoubleRightBold className="text-app-bright-green" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3: Synthesis */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="group p-8 rounded-[2.5rem] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-app-widget flex flex-col gap-8 transition-all hover:bg-white dark:hover:bg-app-dark-blue backdrop-blur-md"
                        >
                            <div className="p-4 rounded-app bg-white dark:bg-app-dark-blue text-slate-400 group-hover:bg-app-bright-green/10 group-hover:text-app-bright-green w-fit transition-colors">
                                <PiLightningFill size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-app-dark-blue dark:text-white">{t('steps.synthesize.title')}</h3>
                                <p className="text-app-dark-blue/70 dark:text-white/70 text-sm leading-relaxed">
                                    {t('steps.synthesize.description')}
                                </p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-black/10 dark:border-white/10">
                                <div className="flex items-center gap-2 text-xs font-bold text-app-dark-blue/50 dark:text-white/50 uppercase tracking-widest">
                                    <span>{t('steps.synthesize.phase')}</span>
                                    <div className="w-2 h-2 rounded-app-full bg-app-bright-green animate-pulse" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </Section>
    );
}
