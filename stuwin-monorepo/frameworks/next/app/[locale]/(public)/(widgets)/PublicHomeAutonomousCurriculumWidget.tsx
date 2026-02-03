"use client";

import { useState, useEffect } from "react";
import { PiFilesFill, PiCaretDoubleRightBold, PiDatabaseFill, PiLightningFill } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function PublicHomeAutonomousCurriculumWidget() {
    const t = useTranslations('PublicHomeAutonomousCurriculumWidget');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <section id="curriculum" className="relative py-24 lg:py-32 bg-slate-50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center text-center gap-16">
                    <div className="w-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold tracking-[0.2em] uppercase">
                        <PiLightningFill />
                        <span>{t('badge')}</span>
                    </div>
                    <div className="space-y-6 max-w-4xl">


                        <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter max-w-4xl">
                            {t('headline_start')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary">{t('headline_end')}</span>
                        </h2>

                        <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto">
                            {t('body')}
                        </p>
                    </div>

                    {/* Full Width Visual: The Knowledge Pipeline */}
                    <div className="relative w-full aspect-[12/2] rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl shadow-slate-200/50 flex items-center justify-center group">
                        <div className="absolute inset-0 bg-slate-50 opacity-50" />

                        {/* Animated Pipeline Nodes */}
                        <div className="relative flex items-center justify-between w-full max-w-5xl px-12 z-10">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-500">
                                    <PiFilesFill size={32} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('pipeline.ingest')}</span>
                            </div>

                            <div className="flex-1 h-px bg-slate-200 mx-4 relative overflow-hidden">
                                <motion.div
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-brand to-transparent w-full"
                                />
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 rounded-2xl bg-brand text-white shadow-lg shadow-brand/20 scale-125">
                                    <PiDatabaseFill size={32} />
                                </div>
                                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">{t('pipeline.structure')}</span>
                            </div>

                            <div className="flex-1 h-px bg-slate-200 mx-4 relative overflow-hidden">
                                <motion.div
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 0.5 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-secondary to-transparent w-full"
                                />
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-brand-secondary group-hover:text-white transition-all duration-500">
                                    <PiLightningFill size={32} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('pipeline.synthesize')}</span>
                            </div>
                        </div>

                        {/* Floating Data Particles */}
                        <div className="absolute inset-0 pointer-events-none">
                            {isMounted && Array.from({ length: 20 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: Math.random() * 1000, y: Math.random() * 200 }}
                                    animate={{ opacity: [0, 0.2, 0], x: i % 2 === 0 ? "+=200" : "-=200" }}
                                    transition={{ repeat: Infinity, duration: 3 + Math.random() * 2, delay: Math.random() * 2 }}
                                    className="absolute w-1 h-1 bg-blue-400 rounded-full"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 w-full text-left">
                        {/* Step 1: Ingest */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col gap-8 transition-all hover:bg-slate-50"
                        >
                            <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-brand/10 group-hover:text-brand w-fit transition-colors">
                                <PiFilesFill size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-slate-900">{t('steps.ingest.title')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {t('steps.ingest.description')}
                                </p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span>{t('steps.ingest.phase')}</span>
                                    <PiCaretDoubleRightBold />
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2: Extract */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="group p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-indigo-500/10 flex flex-col gap-8 transition-all"
                        >
                            <div className="p-4 rounded-2xl bg-brand/10 text-brand w-fit">
                                <PiDatabaseFill size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black">{t('steps.structure.title')}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {t('steps.structure.description')}
                                </p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                                    <span>{t('steps.structure.phase')}</span>
                                    <PiCaretDoubleRightBold />
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3: Synthesis */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col gap-8 transition-all hover:bg-brand/5"
                        >
                            <div className="p-4 rounded-2xl bg-brand/10 text-brand w-fit transition-colors">
                                <PiLightningFill size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-slate-900">{t('steps.synthesize.title')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {t('steps.synthesize.description')}
                                </p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span>{t('steps.synthesize.phase')}</span>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
