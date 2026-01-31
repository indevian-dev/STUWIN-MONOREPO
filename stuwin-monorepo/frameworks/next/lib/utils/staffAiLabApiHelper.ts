import { apiCallForSpaHelper } from './apiCallForSpaHelper';

export interface SystemPrompt {
    id: string;
    title: string;
    body: string;
    usageFlowType: string;
    isActive: boolean;
    createdAt: string;
}

export async function fetchPrompts(workspaceId: string): Promise<{ success: boolean; data: SystemPrompt[] }> {
    const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/staff/${workspaceId}/ai-lab/prompts`
    });
    return response.data;
}

export async function createPrompt(workspaceId: string, data: Partial<SystemPrompt>): Promise<{ success: boolean; data: SystemPrompt }> {
    const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/staff/${workspaceId}/ai-lab/prompts`,
        body: data
    });
    return response.data;
}

export async function updatePrompt(workspaceId: string, promptId: string, data: Partial<SystemPrompt>): Promise<{ success: boolean; data: SystemPrompt }> {
    const response = await apiCallForSpaHelper({
        method: 'PUT',
        url: `/api/workspaces/staff/${workspaceId}/ai-lab/prompts/${promptId}`,
        body: data
    });
    return response.data;
}

export async function deletePrompt(workspaceId: string, promptId: string): Promise<{ success: boolean }> {
    const response = await apiCallForSpaHelper({
        method: 'DELETE',
        url: `/api/workspaces/staff/${workspaceId}/ai-lab/prompts/${promptId}`
    });
    return response.data;
}
