'use client'

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

import React, {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle
} from 'react';

/**
 * Note about TypeScript types:
 * EditorJS plugins (@editorjs/header, @editorjs/table, etc.) DO have TypeScript definitions.
 * However, there's a type incompatibility between the plugin constructors and EditorJS's
 * ToolConstructable interface. The plugins require 'config' to be present, but EditorJS
 * makes it optional. Using 'as any' is the recommended workaround for this known issue.
 * See: https://github.com/codex-team/editor.js/issues/1734
 */

// Type definitions for EditorJS
interface EditorJSBlock {
    type: string;
    data: any;
}

interface EditorJSData {
    blocks: EditorJSBlock[];
}

interface EditorJSInstance {
    save: () => Promise<EditorJSData>;
    render: (data: EditorJSData) => Promise<void>;
    destroy: () => void | Promise<void>;
}

export interface EditorProps {
    onChange?: (content: string) => void;
    initialContent?: string;
    placeholder?: string;
    height?: string;
    [key: string]: any;
}

export interface EditorRef {
    getEditor: () => EditorJSInstance | undefined;
    getContent: () => Promise<string>;
    setContent: (newContent: string) => Promise<void>;
    getJSON: () => Promise<EditorJSData>;
    setJSON: (data: EditorJSData) => Promise<void>;
}

const Editor = forwardRef<EditorRef, EditorProps>(({ onChange, initialContent, placeholder, height = '400px', ...props }, ref) => {
    const editorInstanceRef = useRef<EditorJSInstance | undefined>(undefined);
    const [content, setContent] = useState('');
    const [isClient, setIsClient] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editorId] = useState(() => `editor-${Math.random().toString(36).substr(2, 9)}`);
    const [isUpdatingContent, setIsUpdatingContent] = useState(false);
    const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialContentLoadedRef = useRef(false);
    const lastContentRef = useRef('');

    useImperativeHandle(ref, () => ({
        getEditor: () => editorInstanceRef.current,
        getContent: async () => {
            if (editorInstanceRef.current) {
                try {
                    const outputData = await editorInstanceRef.current.save();
                    return convertEditorJSToHTML(outputData);
                } catch (error) {
                    ConsoleLogger.error('Error getting content:', error);
                    return content;
                }
            }
            return content;
        },
        setContent: async (newContent: string) => {
            if (editorInstanceRef.current && isReady && !isUpdatingContent) {
                try {
                    setIsUpdatingContent(true);
                    const blocks = convertHTMLToEditorJS(newContent);
                    await editorInstanceRef.current.render({ blocks });
                    lastContentRef.current = newContent;
                } catch (error) {
                    ConsoleLogger.error('Error setting content:', error);
                } finally {
                    setIsUpdatingContent(false);
                }
            }
        },
        getJSON: async () => {
            if (editorInstanceRef.current) {
                try {
                    return await editorInstanceRef.current.save();
                } catch (error) {
                    ConsoleLogger.error('Error getting JSON:', error);
                    return { blocks: [] };
                }
            }
            return { blocks: [] };
        },
        setJSON: async (data: EditorJSData) => {
            if (editorInstanceRef.current && isReady && !isUpdatingContent) {
                try {
                    setIsUpdatingContent(true);
                    await editorInstanceRef.current.render(data);
                } catch (error) {
                    ConsoleLogger.error('Error setting JSON:', error);
                } finally {
                    setIsUpdatingContent(false);
                }
            }
        }
    }));

    // Improved HTML to Editor.js blocks conversion
    const convertHTMLToEditorJS = (html: string): EditorJSBlock[] => {
        if (!html || typeof html !== 'string') {
            ConsoleLogger.log('No valid HTML content provided');
            return [];
        }

        ConsoleLogger.log('Converting HTML to EditorJS blocks:', html);

        const blocks: EditorJSBlock[] = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html.trim();

        // Function to process text nodes and inline elements
        const processTextContent = (element: HTMLElement): string | null => {
            // If element has only text content or simple inline elements, treat as paragraph
            const hasBlockElements = element.querySelector('h1,h2,h3,h4,h5,h6,ul,ol,blockquote,pre,hr,table,div');
            if (!hasBlockElements && element.textContent?.trim()) {
                return element.innerHTML.trim();
            }
            return null;
        };

        // Process each child node
        const processNode = (node: Node): void => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim() || '';
                if (text) {
                    blocks.push({
                        type: 'paragraph',
                        data: { text: text }
                    });
                }
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return;

            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();

            switch (tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    blocks.push({
                        type: 'header',
                        data: {
                            text: element.textContent?.trim() || '',
                            level: parseInt(tagName.charAt(1))
                        }
                    });
                    break;
                case 'ul':
                case 'ol':
                    const items = Array.from(element.querySelectorAll('li')).map((li) => li.textContent?.trim() || '').filter(text => text);
                    if (items.length > 0) {
                        blocks.push({
                            type: 'list',
                            data: {
                                style: tagName === 'ul' ? 'unordered' : 'ordered',
                                items: items
                            }
                        });
                    }
                    break;
                case 'blockquote':
                    blocks.push({
                        type: 'quote',
                        data: {
                            text: element.textContent?.trim() || '',
                            caption: ''
                        }
                    });
                    break;
                case 'pre':
                    const code = element.querySelector('code');
                    blocks.push({
                        type: 'code',
                        data: { code: code ? code.textContent || '' : element.textContent || '' }
                    });
                    break;
                case 'hr':
                    blocks.push({
                        type: 'delimiter',
                        data: {}
                    });
                    break;
                case 'table':
                    const rows = Array.from(element.querySelectorAll('tr'));
                    const content = rows.map((row) =>
                        Array.from(row.querySelectorAll('td, th')).map((cell) => cell.textContent?.trim() || '')
                    ).filter(row => row.length > 0);
                    if (content.length > 0) {
                        blocks.push({
                            type: 'table',
                            data: { content }
                        });
                    }
                    break;
                case 'p':
                    const pText = element.innerHTML.trim();
                    if (pText) {
                        blocks.push({
                            type: 'paragraph',
                            data: { text: pText }
                        });
                    }
                    break;
                case 'div':
                    const textContent = processTextContent(element);
                    if (textContent) {
                        blocks.push({
                            type: 'paragraph',
                            data: { text: textContent }
                        });
                    } else {
                        // Process children if this is a container
                        Array.from(element.childNodes).forEach(processNode);
                    }
                    break;
                default:
                    // For other elements, try to extract text content
                    const text = element.textContent?.trim() || '';
                    if (text) {
                        blocks.push({
                            type: 'paragraph',
                            data: { text: element.innerHTML.trim() }
                        });
                    }
            }
        };

        // Process all child nodes
        Array.from(tempDiv.childNodes).forEach(processNode);

        // If no blocks were created but there's content, create a default paragraph
        if (blocks.length === 0 && tempDiv.textContent.trim()) {
            blocks.push({
                type: 'paragraph',
                data: { text: tempDiv.innerHTML.trim() }
            });
        }

        ConsoleLogger.log('Converted blocks:', blocks);
        return blocks;
    };

    // Convert Editor.js blocks to HTML with better list handling
    const convertEditorJSToHTML = (data: EditorJSData): string => {
        if (!data || !data.blocks) return '';

        return data.blocks.map((block: EditorJSBlock) => {
            switch (block.type) {
                case 'paragraph':
                    return `<p>${block.data.text || ''}</p>`;
                case 'header':
                    return `<h${block.data.level || 2}>${block.data.text || ''}</h${block.data.level || 2}>`;
                case 'list':
                    const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
                    const items = (block.data.items || []).map((item: any) => {
                        ConsoleLogger.log('List item structure:', item, typeof item); // Debug log

                        // Handle different possible structures for list items
                        let itemText = '';

                        if (typeof item === 'string') {
                            itemText = item;
                        } else if (typeof item === 'object' && item !== null) {
                            // Try different possible properties
                            itemText = item.content || item.text || item.value || item.innerHTML ||
                                (item.data ? item.data.text : '') ||
                                JSON.stringify(item); // fallback to show structure
                        } else {
                            itemText = String(item || '');
                        }

                        return `<li>${itemText}</li>`;
                    }).join('');
                    return `<${tag}>${items}</${tag}>`;
                case 'quote':
                    const caption = block.data.caption ? `<cite>${block.data.caption}</cite>` : '';
                    return `<blockquote>${block.data.text || ''}${caption}</blockquote>`;
                case 'code':
                    return `<pre><code>${block.data.code || ''}</code></pre>`;
                case 'delimiter':
                    return '<hr>';
                case 'table':
                    if (block.data.content) {
                        const rows = block.data.content.map((row: any[]) =>
                            `<tr>${row.map((cell: any) => `<td>${cell}</td>`).join('')}</tr>`
                        ).join('');
                        return `<table class="border-collapse border border-gray-300"><tbody>${rows}</tbody></table>`;
                    }
                    return '';
                case 'linkTool':
                    return `<a href="${block.data.link}" target="_blank" rel="noopener">${block.data.meta?.title || block.data.link}</a>`;
                case 'image':
                    return `<img src="${block.data.file?.url}" alt="${block.data.caption || ''}" />`;
                case 'embed':
                    return `<div class="embed-container">${block.data.embed || ''}</div>`;
                case 'checklist':
                    const checkItems = (block.data.items || []).map((item: any) =>
                        `<li><input type="checkbox" ${item.checked ? 'checked' : ''} disabled> ${item.text}</li>`
                    ).join('');
                    return `<ul class="checklist">${checkItems}</ul>`;
                case 'raw':
                    return block.data.html || '';
                default:
                    return `<p>${block.data.text || ''}</p>`;
            }
        }).join('');
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Separate effect for handling initial content - only runs ONCE
    useEffect(() => {
        const setInitialContentOnce = async () => {
            if (isReady && initialContent && editorInstanceRef.current && !isUpdatingContent && !initialContentLoadedRef.current) {
                try {
                    ConsoleLogger.log('🔄 Setting initial content after editor ready (ONCE):', initialContent);
                    setIsUpdatingContent(true);
                    initialContentLoadedRef.current = true;

                    const blocks = convertHTMLToEditorJS(initialContent);
                    ConsoleLogger.log('📄 Converted initial blocks:', blocks);

                    if (blocks.length > 0) {
                        await editorInstanceRef.current.render({ blocks });
                        lastContentRef.current = initialContent;
                        ConsoleLogger.log('✅ Initial content set successfully');
                    }
                } catch (error) {
                    ConsoleLogger.error('❌ Error setting initial content:', error);
                    initialContentLoadedRef.current = false;
                } finally {
                    setIsUpdatingContent(false);
                }
            }
        };

        if (isReady && initialContent && !initialContentLoadedRef.current) {
            setTimeout(setInitialContentOnce, 100);
        }
    }, [isReady, initialContent]);

    useEffect(() => {
        if (!isClient) return;

        let mounted = true;

        const loadAndInitializeEditor = async () => {
            try {
                setError(null);
                setIsLoading(true);
                ConsoleLogger.log('🔄 Loading Editor.js and tools...');

                // Dynamic import of EditorJS and all tools
                const [
                    { default: EditorJS },
                    { default: Header },
                    { default: List },
                    { default: Quote },
                    { default: Code },
                    { default: Delimiter },
                    { default: Table },
                    { default: LinkTool },
                    { default: SimpleImage },
                    { default: Embed },
                    { default: Checklist },
                    { default: RawTool }
                ] = await Promise.all([
                    import('@editorjs/editorjs'),
                    import('@editorjs/header'),
                    import('@editorjs/list'),
                    import('@editorjs/quote'),
                    import('@editorjs/code'),
                    import('@editorjs/delimiter'),
                    import('@editorjs/table'),
                    import('@editorjs/link'),
                    import('@editorjs/simple-image'),
                    import('@editorjs/embed'),
                    import('@editorjs/checklist'),
                    import('@editorjs/raw')
                ]);

                ConsoleLogger.log('✅ All tools loaded successfully');

                if (!mounted) return;

                // Wait for DOM to be ready
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!mounted) return;

                ConsoleLogger.log('🔄 Creating Editor.js instance with holder:', editorId);

                // Check if the element exists
                const holderElement = document.getElementById(editorId);
                if (!holderElement) {
                    throw new Error(`Holder element with id "${editorId}" not found`);
                }

                ConsoleLogger.log('✅ Holder element found:', holderElement);

                // Destroy existing editor if any
                if (editorInstanceRef.current) {
                    try {
                        await editorInstanceRef.current.destroy();
                        ConsoleLogger.log('🗑️ Previous editor destroyed');
                    } catch (e) {
                        ConsoleLogger.warn('Warning destroying previous editor:', e);
                    }
                }

                initialContentLoadedRef.current = false;

                // Start with empty data - initial content will be loaded separately
                const initialData = { blocks: [] };

                // Create editor instance with all tools
                const editor = new EditorJS({
                    holder: editorId,
                    placeholder: placeholder || 'Start writing your content...',
                    autofocus: false,
                    tools: {
                        header: {
                            class: Header as any,
                            config: {
                                placeholder: 'Enter a header',
                                levels: [1, 2, 3, 4, 5, 6],
                                defaultLevel: 2
                            },
                            shortcut: 'CMD+SHIFT+H'
                        },
                        list: {
                            class: List,
                            inlineToolbar: true,
                            config: {
                                defaultStyle: 'unordered'
                            },
                            shortcut: 'CMD+SHIFT+L'
                        },
                        quote: {
                            class: Quote,
                            inlineToolbar: true,
                            config: {
                                quotePlaceholder: 'Enter a quote',
                                captionPlaceholder: 'Quote\'s author',
                            },
                            shortcut: 'CMD+SHIFT+O'
                        },
                        code: {
                            class: Code,
                            config: {
                                placeholder: 'Enter code'
                            },
                            shortcut: 'CMD+SHIFT+C'
                        },
                        delimiter: {
                            class: Delimiter,
                            shortcut: 'CMD+SHIFT+D'
                        },
                        table: {
                            class: Table as any,
                            inlineToolbar: true,
                            config: {
                                rows: 2,
                                cols: 3,
                            },
                            shortcut: 'CMD+ALT+T'
                        },
                        linkTool: {
                            class: LinkTool,
                            config: {
                                endpoint: '/api/workspaces/staff/editor/fetch-url',
                            }
                        },
                        image: {
                            class: SimpleImage,
                            inlineToolbar: true,
                        },
                        embed: {
                            class: Embed,
                            config: {
                                services: {
                                    youtube: true,
                                    coub: true,
                                    codepen: {
                                        regex: /https?:\/\/codepen.io\/([^\/\?\&]*)\/pen\/([^\/\?\&]*)/,
                                        embedUrl: 'https://codepen.io/<%= remote_id %>?height=300&theme-id=0&default-tab=css,result&embed-version=2',
                                        html: "<iframe height='300' scrolling='no' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe>",
                                        height: 300,
                                        width: 600,
                                        id: (groups: string[]) => groups.join('/embed/')
                                    }
                                }
                            }
                        },
                        checklist: {
                            class: Checklist,
                            inlineToolbar: true,
                        },
                        raw: {
                            class: RawTool,
                            config: {
                                placeholder: 'Enter raw HTML'
                            }
                        }
                    },
                    data: initialData,
                    onChange: async (api, event) => {
                        if (isUpdatingContent) return;

                        if (changeTimeoutRef.current) {
                            clearTimeout(changeTimeoutRef.current);
                        }

                        changeTimeoutRef.current = setTimeout(async () => {
                            try {
                                const data = await api.saver.save();
                                const htmlContent = convertEditorJSToHTML(data);

                                if (htmlContent !== lastContentRef.current) {
                                    ConsoleLogger.log('Content changed, updating...');
                                    lastContentRef.current = htmlContent;
                                    setContent(htmlContent);
                                    if (onChange) {
                                        onChange(htmlContent);
                                    }
                                } else {
                                    ConsoleLogger.log('Content unchanged, skipping update');
                                }
                            } catch (error) {
                                ConsoleLogger.error('Error on change:', error);
                            }
                        }, 300);
                    },
                    onReady: () => {
                        ConsoleLogger.log('🎉 Editor.js is ready to work with all tools!');
                        if (mounted) {
                            setIsReady(true);
                            setIsLoading(false);
                        }
                    }
                });

                if (mounted) {
                    editorInstanceRef.current = editor;
                    ConsoleLogger.log('✅ Editor instance stored in ref');
                }

            } catch (error) {
                ConsoleLogger.error('❌ Error loading/initializing editor:', error);
                if (mounted) {
                    setError(error instanceof Error ? error.message : 'Unknown error occurred');
                    setIsLoading(false);
                }
            }
        };

        const timer = setTimeout(() => {
            if (mounted) {
                loadAndInitializeEditor();
            }
        }, 200);

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (changeTimeoutRef.current) {
                clearTimeout(changeTimeoutRef.current);
            }
            if (editorInstanceRef.current) {
                try {
                    editorInstanceRef.current.destroy();
                } catch (e) {
                    ConsoleLogger.warn('Error destroying editor on cleanup:', e);
                }
                editorInstanceRef.current = undefined;
            }
        };
    }, [isClient, editorId, placeholder]);

    if (!isClient) {
        return (
            <div className="border border-gray-300 rounded-md bg-white p-4 min-h-[400px] flex items-center justify-center">
                <div className="text-gray-500">Loading editor...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-red-300 rounded-md bg-red-50 p-4 min-h-[400px] flex flex-col items-center justify-center">
                <div className="text-red-600 mb-2">Error loading editor:</div>
                <div className="text-red-500 text-sm font-mono">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Reload Page
                </button>
            </div>
        );
    }

    return (
        <div {...props}>
            <div
                id={editorId}
                className="rounded-md bg-white min-h-[400px] focus-within:border-blue-500 transition-colors editor-container"
                style={{ minHeight: height }}
            />
            {isLoading && (
                <div className="text-sm text-gray-500 mt-2 flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    Loading editor tools...
                </div>
            )}
            {isReady && (
                <div className="text-sm text-green-600 mt-2 flex items-center">
                    <span className="mr-2">🎉</span>
                    <span>Editor ready! Use the + button or shortcuts:</span>
                    <div className="ml-2 text-xs text-gray-500">
                        H1-H6, Lists, Quotes, Code, Tables & more
                    </div>
                </div>
            )}

            {/* EditorJS Custom Styles */}
            <style>{`
        .editor-container .ce-toolbar__plus {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
        }
        
        .editor-container .ce-toolbar__plus:hover {
          background: #f9fafb !important;
          border-color: #d1d5db !important;
        }
        
        .editor-container .ce-toolbar__settings-btn {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
        }
        
        .editor-container .ce-toolbar__settings-btn:hover {
          background: #f9fafb !important;
          border-color: #d1d5db !important;
        }
        
        .editor-container .ce-toolbar {
          background: transparent !important;
        }
        
        .editor-container .ce-inline-toolbar {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .editor-container .ce-popover {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .editor-container .ce-popover__item {
          color: #374151 !important;
        }
        
        .editor-container .ce-popover__item:hover {
          background: #f3f4f6 !important;
        }
        
        .editor-container .ce-conversion-toolbar {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .editor-container .ce-conversion-tool {
          color: #374151 !important;
        }
        
        .editor-container .ce-conversion-tool:hover {
          background: #f3f4f6 !important;
        }
        
        /* Block settings button */
        .editor-container .ce-settings-button {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 4px !important;
          color: #6b7280 !important;
        }
        
        .editor-container .ce-settings-button:hover {
          background: #f9fafb !important;
          color: #374151 !important;
        }
      `}</style>
        </div>
    );
});

Editor.displayName = 'Editor';

export default Editor;
