export interface LearningConversationResponse {
    id: string;
    status: string;
    rootQuestion: string;
    messages: any[];
    branchCount: number;
    messageCount: number;
    createdAt: Date;
    updatedAt: Date | null;
}
