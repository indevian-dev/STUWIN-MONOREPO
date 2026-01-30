export interface ChatMessage {
    id: string;
    content: string;
    senderId: string;
    messageType?: string;
    createdAt: string;
    isNew?: boolean;
}

export interface UseChatReturn {
    messages: ChatMessage[];
    isConnected: boolean;
    isTyping: boolean;
    ablyConfigured: boolean;
    sendMessage: (content: string, messageType?: string) => Promise<ChatMessage>;
    sendTypingIndicator: (isTyping: boolean) => void;
    loadMessages: (limit?: number, offset?: number) => Promise<ChatMessage[]>;
}
