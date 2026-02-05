
import { eq, desc, and } from "drizzle-orm";
import { systemPromptsCrib } from "@/lib/app-infrastructure/database/schema";
import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";

export class SystemPromptRepository extends BaseRepository {

    async findActiveByFlowType(flowType: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(systemPromptsCrib)
            .where(
                and(
                    eq(systemPromptsCrib.usageFlowType, flowType),
                    eq(systemPromptsCrib.isActive, true)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    async listAll(tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.select().from(systemPromptsCrib).orderBy(desc(systemPromptsCrib.createdAt));
    }

    async create(data: typeof systemPromptsCrib.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(systemPromptsCrib).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof systemPromptsCrib.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(systemPromptsCrib).set(data).where(eq(systemPromptsCrib.id, id)).returning();
        return result[0];
    }

    async deactivateRaw(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        await client.update(systemPromptsCrib).set({ isActive: false }).where(eq(systemPromptsCrib.id, id));
    }

    async deactivateAllByFlow(flowType: string, tx?: DbClient) {
        const client = tx ?? this.db;
        // TODO: This might need to be more efficient or specific if we have many prompts
        await client.update(systemPromptsCrib)
            .set({ isActive: false })
            .where(eq(systemPromptsCrib.usageFlowType, flowType));
    }
}
