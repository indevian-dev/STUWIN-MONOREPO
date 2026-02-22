"use client";

import React, {
    useState
} from 'react';
import { PublicSubjectQuestionsWidget } from '@/app/[locale]/(public)/subjects/(widgets)/PublicSubjectQuestions.widget';

interface Subject {
    id?: string;
    title?: string;
    description?: string;
    image?: string;
    type?: string;
}

interface PublicSingleSubjectWidgetProps {
    subject: Subject;
}

export function PublicSingleSubjectWidget({ subject }: PublicSingleSubjectWidgetProps) {
    const [search, setSearch] = useState('');

    const handleCharacterRemove = (index: number) => {
        setSearch(prev => prev.slice(0, index) + prev.slice(index + 1));
    };

    return (
        <div className="bg-white rounded-app p-4 max-w-7xl mx-auto">
            <h1 className="text-lg font-semibold text-app-dark-blue dark:text-white my-2">{subject.title}</h1>

            {subject.type === 'digital' && (
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="+994 *5* 4548"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-app bg-app-bright-green-dark text-white mb-2"
                    />
                    <div className="flex flex-wrap">
                        {search.split('').map((char, index) => (
                            <button
                                key={index}
                                onClick={() => handleCharacterRemove(index)}
                                className="bg-app-bright-green-dark hover:bg-app-bright-green text-white font-bold py-1 px-2 m-1 rounded"
                            >
                                {char}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <PublicSubjectQuestionsWidget subject={subject} />
        </div>
    );
}
