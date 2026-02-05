"use client";

import { PiTerminalFill, PiShieldCheckeredFill, PiFadersFill, PiCodeBlockBold } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function PublicHomeExpertIntelligenceWidget() {
    const t = useTranslations('PublicHomeExpertIntelligenceWidget');
    const features = t.raw('features');

    return (
        <section id="expert-intelligence" className="relative py-24 lg:py-40 bg-white">

            {/* Structural Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-blue-500/20 via-transparent to-transparent" />
                <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4">
                <div className="flex flex-col gap-16 text-left items-center">
                    <div className="w-full inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/100 border border-brand-secondary/20 text-brand-secondary text-xs font-bold tracking-[0.2em] uppercase">
                        <PiCodeBlockBold />
                        <span>{t('badge')}</span>
                    </div>
                    {/* Full Width Header */}
                    <div className="space-y-8">
                        <h2 className="text-6xl lg:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                            {t('headline_start')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand">{t('headline_end')}</span>
                        </h2>

                        <p className="text-lg text-slate-600 leading-relaxed font-medium w-full">
                            {t('body')}
                        </p>
                    </div>

                    {/* Full Width Visual Representation of the Lab */}
                    <div className="relative w-full aspect-[3/3] sm:aspect-[5/3] md:aspect-[7/3] lg:aspect-[10/3] rounded-3xl border border-slate-200 bg-brand-secondary overflow-hidden shadow-2xl shadow-slate-300/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/10 to-transparent" />
                        <div className="p-8 h-full flex flex-col text-sm">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-6 mb-6">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="ml-4 text-slate-500 tracking-widest uppercase">{t('terminal.version')}</span>
                            </div>
                            <div className="space-y-2 text-white">
                                <p>{'>'} {t('terminal.init_flow')}</p>
                                <p>{'>'} {t('terminal.inject_context')}</p>
                                <p>{'>'} {t('terminal.calibrate')}</p>
                                <p className="text-brand">{'>'} {t('terminal.ready')}</p>
                                <p className="animate-pulse">_</p>
                            </div>

                            {/* Visual Pulse Wave */}
                            <div className="mt-auto h-32 flex items-end gap-1">
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: "10%" }}
                                        animate={{ height: ["20%", "70%", "30%", "60%", "20%"] }}
                                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.05 }}
                                        className="flex-1 bg-brand/5 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3 Features in a Row */}
                    <div className="grid md:grid-cols-3 gap-8 w-full text-left">
                        {features.map((feature: any, idx: number) => {
                            const Icons = [PiTerminalFill, PiFadersFill, PiShieldCheckeredFill];
                            const Icon = Icons[idx];
                            return (
                                <div key={idx} className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-6 items-start transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                                    <div className="p-4 rounded-2xl bg-brand/10 text-brand">
                                        <Icon size={28} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide">{feature.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>
        </section>
    );
}
