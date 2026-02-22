import { fetchApiUtil } from "./Http.FetchApiSPA.util";

export interface SystemPrompt {
    id: string;
    title: string;
    body: string;
    usageFlowType: string;
    isActive: boolean;
    createdAt: string;
}

export async function fetchPrompts(workspaceId: string): Promise<{ success: boolean; data: SystemPrompt[] }> {
    const response = await fetchApiUtil<any>({
        method: 'GET',
        url: `/api/workspaces/staff/${workspaceId}/ai-lab/prompts`
    });
    return response.data;
}

export async function createPrompt(workspaceId: string, data: Partial<SystemPrompt>): Promise<{ success: boolean; data: SystemPrompt }> {
    const response = await fetchApiUtil<any>({
        method: 'POST',
        url: `/api/workspaces/staff/${workspaceId}/ai-lab/prompts`,
        body: data
    });
    return response.data;
}

export async function updatePrompt(workspaceId: string, promptId: string, data: Partial<SystemPrompt>): Promise<{ success: boolean; data: SystemPrompt }> {
    const response = await fetchApiUtil<any>({
        method: 'PUT',
        url: `/api/workspaces/staff/${workspaceId}/ai-lab/prompts/${promptId}`,
        body: data
    });
    return response.data;
}

export async function deletePrompt(workspaceId: string, promptId: string): Promise<{ success: boolean }> {
    const response = await fetchApiUtil<any>({
        method: 'DELETE',
        url: `/api/workspaces/staff/${workspaceId}/ai-lab/prompts/${promptId}`
    });
    return response.data;
}
