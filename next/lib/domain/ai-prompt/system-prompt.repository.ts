
import { eq, desc, and } from "drizzle-orm";
import { aiSystemGuides } from "@/lib/database/schema";
import { BaseRepository } from "../base/base.repository";
import { type DbClient } from "@/lib/database";

export class SystemPromptRepository extends BaseRepository {

    async findActiveByFlowType(flowType: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(aiSystemGuides)
            .where(
                and(
                    eq(aiSystemGuides.usageFlowType, flowType),
                    eq(aiSystemGuides.isActive, true)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    async listAll(tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.select().from(aiSystemGuides).orderBy(desc(aiSystemGuides.createdAt));
    }

    async create(data: typeof aiSystemGuides.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(aiSystemGuides).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof aiSystemGuides.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(aiSystemGuides).set(data).where(eq(aiSystemGuides.id, id)).returning();
        return result[0];
    }

    async deactivateRaw(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        await client.update(aiSystemGuides).set({ isActive: false }).where(eq(aiSystemGuides.id, id));
    }

    async deactivateAllByFlow(flowType: string, tx?: DbClient) {
        const client = tx ?? this.db;
        // TODO: This might need to be more efficient or specific if we have many prompts
        await client.update(aiSystemGuides)
            .set({ isActive: false })
            .where(eq(aiSystemGuides.usageFlowType, flowType));
    }
}
