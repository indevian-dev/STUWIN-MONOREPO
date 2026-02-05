
import { SystemPromptRepository } from "./system-prompt.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";
import { BASE_PROMPTS } from "@/lib/intelligence";

export class SystemPromptService extends BaseService {
    constructor(
        private readonly repository: SystemPromptRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database
    ) {
        super();
    }

    async getEffectivePromptResult(flowType: string, variables: Record<string, any>) {
        try {
            // 1. Get Base Core (Mandatory Hardcoded)
            const base = BASE_PROMPTS[flowType];
            let combinedPrompt = base?.body || "You are a helpful AI assistant.";

            // 2. Append System-Level Crib from DB (if active for this flow)
            const dbPrompt = await this.repository.findActiveByFlowType(flowType);
            if (dbPrompt && dbPrompt.body) {
                combinedPrompt += "\n\n### SYSTEM INSTRUCTIONS (CRIB):\n" + dbPrompt.body;
            }

            // 3. Append Object-Level Crib (Subject/Topic/Question context)
            const objectCrib = variables.aiCrib || "";
            if (objectCrib) {
                combinedPrompt += "\n\n### CONTEXTUAL ADDITIONS (CRIB):\n" + objectCrib;
            }

            // 4. Hydrate final combined text
            return this.hydrateValues(combinedPrompt, variables);
        } catch (error) {
            this.handleError(error, "getEffectivePromptResult");
            return "Error generating prompt context.";
        }
    }

    /**
     * Get raw prompt data (for admin UI or raw processing)
     */
    async getRawPrompt(flowType: string) {
        const dbPrompt = await this.repository.findActiveByFlowType(flowType);
        if (dbPrompt) return dbPrompt;
        return BASE_PROMPTS[flowType] || null;
    }

    /**
     * Replace {{key}} or {{#key}}...{{/key}} logic
     * Simple implementation:
     * - {{key}}: Replace with value
     * - {{#key}}content{{/key}}: Show content if key is truthy
     */
    hydrateValues(template: string, variables: Record<string, any>): string {
        let result = template;

        // 1. Handle conditional blocks {{#key}}...{{/key}}
        // We do this simply: regex match, check var, replace.
        // Nested blocks not supported in this simple version, but sufficient for our prompts.
        const blockRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
        result = result.replace(blockRegex, (match, key, content) => {
            if (variables[key]) {
                // Check if it's a string that replaces the content, or just a boolean flag? 
                // Mustache logic: if truthy, render content. 
                // But wait, our prompts use {{#aiCrib}}...{{aiCrib}}...{{/aiCrib}}.
                // So we just check existence.
                // We should re-process the inner content for variables eventually, 
                // but assuming simple structure:
                return this.hydrateValues(content, variables);
            }
            return "";
        });

        // 2. Handle simple variables {{key}}
        const varRegex = /\{\{(\w+)\}\}/g;
        result = result.replace(varRegex, (match, key) => {
            const val = variables[key];
            return val !== undefined && val !== null ? String(val) : "";
        });

        return result;
    }

    // ═══════════════════════════════════════════════════════════════
    // MANAGEMENT (Staff)
    // ═══════════════════════════════════════════════════════════════

    async listAllPrompts() {
        try {
            const prompts = await this.repository.listAll();
            return { success: true, data: prompts };
        } catch (error) {
            this.handleError(error, "listAllPrompts");
            return { success: false, error: "Failed to list prompts" };
        }
    }

    async createPrompt(data: { title: string; body: string; usageFlowType: string; isActive?: boolean }) {
        try {
            return await this.db.transaction(async (tx) => {
                if (data.isActive) {
                    await this.repository.deactivateAllByFlow(data.usageFlowType, tx);
                }

                const newPrompt = await this.repository.create({
                    ...data,
                    isActive: data.isActive || false,
                    createdAt: new Date()
                }, tx);

                return { success: true, data: newPrompt };
            });
        } catch (error) {
            this.handleError(error, "createPrompt");
            return { success: false, error: "Failed to create prompt" };
        }
    }

    async updatePrompt(id: string, data: { title?: string; body?: string; isActive?: boolean }) {
        try {
            return await this.db.transaction(async (tx) => {
                const current = (await this.repository.listAll(tx)).find(p => p.id === id); // Inefficient if many, but fine for now
                if (!current) throw new Error("Prompt not found");

                if (data.isActive && !current.isActive) {
                    // Activating this one, deactivate others of same flow
                    if (current.usageFlowType) {
                        await this.repository.deactivateAllByFlow(current.usageFlowType, tx);
                    }
                }

                const updated = await this.repository.update(id, data, tx);
                return { success: true, data: updated };
            });
        } catch (error) {
            this.handleError(error, "updatePrompt");
            return { success: false, error: "Failed to update prompt" };
        }
    }

    async deletePrompt(id: string) {
        // Typically soft delete or just delete, but schema doesn't have deletedAt?
        // Repository didn't implement delete, let's skip for now or use generic if BaseRepo has it.
        return { success: false, error: "Delete not implemented yet" };
    }
}
