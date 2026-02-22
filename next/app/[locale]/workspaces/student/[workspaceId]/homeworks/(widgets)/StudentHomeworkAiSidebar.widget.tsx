"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import { toast } from "react-toastify";
import { PiPaperPlaneRight, PiRobot, PiUser, PiInfo } from "react-icons/pi";

interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

interface StudentHomeworkAiSidebarWidgetProps {
    homeworkId: string;
    isOpen: boolean;
}

export function StudentHomeworkAiSidebarWidget({ homeworkId, isOpen }: StudentHomeworkAiSidebarWidgetProps) {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && homeworkId) {
            initiateSession();
        }
    }, [isOpen, homeworkId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const initiateSession = async () => {
        try {
            setIsInitializing(true);
            const response = await fetchApiUtil<any>({
                url: `/api/workspaces/student/${workspaceId}/homeworks/${homeworkId}/initiate`,
                method: "POST",
            });

            const result = (response as any).data;

            if (result.success) {
                setSession(result.data);
                const nodes = result.data.messages?.nodes || [];
                // Filter out system prompt for UI
                setMessages(nodes.filter((m: any) => m.role !== 'system'));
            } else {
                toast.error("Failed to start AI session");
            }
        } catch (error) {
            console.error("Init session error", error);
        } finally {
            setIsInitializing(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetchApiUtil<any>({
                url: `/api/workspaces/student/${workspaceId}/learning-conversations/${session.id}/chat`,
                method: "POST",
                body: { message: input }
            } as any);

            const result = (response as any).data;

            if (result.success) {
                setMessages((prev) => [...prev, { role: "assistant", content: result.data.answer }]);
            } else {
                toast.error("AI is unavailable right now");
            }
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full md:w-96 shadow-xl">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PiRobot className="text-app-bright-green text-xl" />
                    <h3 className="font-semibold text-gray-900 text-sm">AI Socratic Tutor</h3>
                </div>
                <div className="group relative">
                    <PiInfo className="text-gray-400 cursor-help" />
                    <div className="absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                        I'm here to guide you, not give answers. Let's work through it together!
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {isInitializing ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-2">
                        <div className="animate-spin rounded-app-full h-6 w-6 border-b-2 border-app"></div>
                        <p className="text-xs text-gray-500">Waking up the tutor...</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-app p-3 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-app-bright-green text-white rounded-tr-app'
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-app'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        {msg.role === 'user' ? <PiUser /> : <PiRobot />}
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            {msg.role === 'user' ? 'Student' : 'Tutor'}
                                        </span>
                                    </div>
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-app rounded-tl-app p-3 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-app-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-app-full animate-bounce [animation-delay:-.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-app-full animate-bounce [animation-delay:-.5s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        disabled={isLoading || isInitializing}
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-app text-sm focus:outline-none focus:ring-2 focus:ring-app/20 focus:border-app transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || isInitializing}
                        className="absolute right-2 top-1.5 p-2 bg-app-bright-green text-white rounded-app hover:bg-app-bright-green-dark transition-colors disabled:opacity-50"
                    >
                        <PiPaperPlaneRight size={18} />
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                    Guided Learning Mode Active
                </p>
            </form>
        </div>
    );
}
