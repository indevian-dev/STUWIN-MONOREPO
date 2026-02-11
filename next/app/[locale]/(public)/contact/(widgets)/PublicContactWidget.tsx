'use client';

import { useTranslations } from 'next-intl';
import {
    PiEnvelopeSimpleFill,
    PiMapPinFill,
    PiPhoneFill,
    PiWhatsappLogoFill,
    PiInstagramLogoFill,
    PiFacebookLogoFill
} from 'react-icons/pi';

export default function PublicContactWidget() {
    const t = useTranslations('PublicContactWidget');

    const contactInfo = [
        {
            icon: PiPhoneFill,
            label: t('phone_label'),
            value: '+994 51 201 32 08',
            href: 'tel:+994512013208',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            icon: PiWhatsappLogoFill,
            label: t('whatsapp_label'),
            value: '+994 55 689 15 51',
            href: 'https://wa.me/994556891551',
            color: 'bg-emerald-50 text-emerald-600'
        },
        {
            icon: PiEnvelopeSimpleFill,
            label: t('email_label'),
            value: 'support@stuwin.ai',
            href: 'mailto:support@stuwin.ai',
            color: 'bg-rose-50 text-rose-600'
        },
        {
            icon: PiMapPinFill,
            label: t('address_label'),
            value: t('address_value'),
            href: '#',
            color: 'bg-amber-50 text-amber-600'
        }
    ];

    return (
        <section className="relative w-full bg-white py-24 lg:py-32 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                    {/* Left Side: Contact Info */}
                    <div className="lg:col-span-5 space-y-12">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
                                {t('contact_us_label')}
                            </h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                {t('beta_message')}
                            </p>
                        </div>

                        <div className="grid gap-6">
                            {contactInfo.map((item, idx) => (
                                <a
                                    key={idx}
                                    href={item.href}
                                    className="group flex items-center gap-6 p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-brand/20 hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${item.color} group-hover:scale-110 transition-transform duration-500`}>
                                        <item.icon />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            {item.label}
                                        </p>
                                        <p className="text-lg font-bold text-slate-900">
                                            {item.value}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>

                        {/* Socials */}
                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                                {t('follow_us_label')}
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href="https://instagram.com/stuwin.ai"
                                    className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl text-slate-400 hover:bg-brand hover:text-white hover:border-brand transition-all duration-300"
                                >
                                    <PiInstagramLogoFill />
                                </a>
                                <a
                                    href="https://facebook.com/stuwin.ai"
                                    className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl text-slate-400 hover:bg-brand hover:text-white hover:border-brand transition-all duration-300"
                                >
                                    <PiFacebookLogoFill />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Beta Feature Highlight / Image */}
                    <div className="lg:col-span-7">
                        <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-brand to-brand-secondary">
                            <div className="bg-white rounded-[2.8rem] p-10 md:p-16 text-center space-y-8">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-xs font-bold tracking-widest uppercase text-brand">
                                    <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
                                    {t('beta_title')}
                                </div>

                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                                    Help us build the <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary">
                                        next generation
                                    </span> of education
                                </h2>

                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="p-6 rounded-3xl bg-slate-50 space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl text-brand">
                                            🧩
                                        </div>
                                        <h4 className="font-bold text-slate-900">Report Issues</h4>
                                        <p className="text-xs text-slate-500 font-medium">Found a bug? Let us know!</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl text-brand-secondary">
                                            💡
                                        </div>
                                        <h4 className="font-bold text-slate-900">Share Ideas</h4>
                                        <p className="text-xs text-slate-500 font-medium">We love hearing your feedback.</p>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="w-3/4 h-full bg-gradient-to-r from-brand to-brand-secondary animate-shimmer" />
                                    </div>
                                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Content Production in Progress
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}