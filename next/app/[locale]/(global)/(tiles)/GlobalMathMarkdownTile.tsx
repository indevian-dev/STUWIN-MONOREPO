"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface GlobalMathMarkdownTileProps {
    content: string;
    className?: string;
}

/**
 * A reusable component that renders Markdown with LaTeX math support using KaTeX.
 * Supports inline math ($...$) and block math ($$...$$).
 */
export function GlobalMathMarkdownTile({ content, className = "" }: GlobalMathMarkdownTileProps) {
    if (!content) return null;

    return (
        <div className={`prose prose-sm max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // Prevent extra padding/margins from default p tags if needed
                    p: ({ children }) => <p className="mb-0 last:mb-0 inline-block">{children}</p>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
