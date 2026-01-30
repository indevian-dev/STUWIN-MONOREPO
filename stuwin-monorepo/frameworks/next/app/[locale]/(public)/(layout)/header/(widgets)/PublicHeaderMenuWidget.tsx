import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    PiMoonLight,
    PiSunLight
} from 'react-icons/pi';

export function PublicHeaderMenuWidget({ toggleMenu }: { toggleMenu: () => void }) {
    const router = useRouter();
    const t = useTranslations('Global');
    const [theme, setTheme] = useState('light');

    const topMenuItems = [
        { id: 1, title: t('blog'), slug: 'blogs' },
        { id: 2, title: t('pricing'), slug: 'docs/pricing' },
        { id: 3, title: t('about'), slug: 'docs/about' },
        { id: 4, title: t('register'), slug: 'auth/register' },
        { id: 5, title: t('login'), slug: 'auth/login' },
        { id: 6, title: t('register as store'), slug: 'register-store' },
    ];

    const bottomMenuItems = {
        terms: {
            title: t('terms'),
            items: [
                { id: 7, title: t('terms of use'), slug: 'docs/terms' },
                { id: 8, title: t('privacy policy'), slug: 'docs/policy' },
                { id: 9, title: t('refund policy'), slug: 'docs/refund' },
            ]
        },
        support: {
            title: t('support & help'),
            items: [
                { id: 10, title: t('open support ticket'), slug: 'docs/contact' },
                { id: 11, title: t('terms of use'), slug: 'docs/terms' },
                { id: 12, title: t('about'), slug: 'docs/about' },
            ]
        }
    };

    const handleItemClick = (slug: string) => {
        router.push(`/${slug}`);
        toggleMenu();
    };

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const switchLanguage = (locale: string) => {
        router.push(`/${locale}`);
    };

    return (
        <section className={`relative m-auto max-w-7xl px-4 ${theme}`}>
            {/* Language and Theme Controls */}
            <div className='flex gap-2 py-2 w-full justify-between bg-white'>
                <div className='flex gap-2'>
                    <button onClick={() => switchLanguage('en')} className='p-2 hover:text-brand'>EN</button>
                    <button onClick={() => switchLanguage('es')} className='p-2 hover:text-brand'>ES</button>
                </div>
                <button onClick={toggleTheme} className='p-2 hover:text-brand flex gap-2 items-center'>
                    {theme === 'light' ? <span className='flex gap-2 items-center'><PiMoonLight />{t('dark mode')}</span> : <span className='flex gap-2 items-center'><PiSunLight />{t('light mode')}</span>}
                </button>
            </div>
            {/* Top Menu Items */}
            <div className="mb-6">
                {topMenuItems.map((item) => (
                    <div key={item.id} className='w-full py-2' onClick={() => handleItemClick(item.slug)}>
                        <h2 className='text-lg font-bold cursor-pointer p-2 text-dark hover:text-brand'>
                            {item.title}
                        </h2>
                    </div>
                ))}


            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gray-200 my-4"></div>

            {/* Bottom Menu Items */}
            <div className="mt-6 mb-24 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(bottomMenuItems).map(([key, section]) => (
                    <div key={key} className="mb-6 ">
                        <h3 className="text-md font-bold text-dark mb-3">{section.title}</h3>
                        {section.items.map((item) => (
                            <div key={item.id} className='w-full py-1' onClick={() => handleItemClick(item.slug)}>
                                <h2 className='text-md cursor-pointer p-2 text-dark hover:text-brand'>
                                    {item.title}
                                </h2>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
}