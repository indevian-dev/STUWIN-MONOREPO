
import { eq, desc, and } from "drizzle-orm";
import { systemPrompts } from "@/lib/app-infrastructure/database/schema";
import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";

export class SystemPromptRepository extends BaseRepository {

    async findActiveByFlowType(flowType: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(systemPrompts)
            .where(
                and(
                    eq(systemPrompts.usageFlowType, flowType),
                    eq(systemPrompts.isActive, true)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    async listAll(tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.select().from(systemPrompts).orderBy(desc(systemPrompts.createdAt));
    }

    async create(data: typeof systemPrompts.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(systemPrompts).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof systemPrompts.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(systemPrompts).set(data).where(eq(systemPrompts.id, id)).returning();
        return result[0];
    }

    async deactivateRaw(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        await client.update(systemPrompts).set({ isActive: false }).where(eq(systemPrompts.id, id));
    }

    async deactivateAllByFlow(flowType: string, tx?: DbClient) {
        const client = tx ?? this.db;
        // TODO: This might need to be more efficient or specific if we have many prompts
        await client.update(systemPrompts)
            .set({ isActive: false })
            .where(eq(systemPrompts.usageFlowType, flowType));
    }
}
