
import { eq, and, or } from "drizzle-orm";
import { providerSubjects } from "@/lib/database/schema";
import { BaseRepository } from "../base/Base.repository";
import { type DbClient } from "@/lib/database";

/**
 * SubjectRepository - Database operations for Subject entities
 */
export class SubjectRepository extends BaseRepository {

    async findById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = id.includes(":") ? id : `provider_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .select()
            .from(providerSubjects)
            .where(
                or(
                    eq(providerSubjects.id, plainId),
                    eq(providerSubjects.id, prefixedId)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    async findBySlug(slug: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(providerSubjects)
            .where(eq(providerSubjects.slug, slug))
            .limit(1);
        return result[0] || null;
    }

    async list(params: { onlyActive?: boolean, workspaceId?: string } = {}, tx?: DbClient) {
        const client = tx ?? this.db;
        const filters = [];
        if (params.onlyActive) filters.push(eq(providerSubjects.isActive, true));
        if (params.workspaceId) filters.push(eq(providerSubjects.workspaceId, params.workspaceId));
        const query = client.select().from(providerSubjects)
            .where(filters.length > 0 ? and(...filters) : undefined);
        return await query;
    }

    async create(data: typeof providerSubjects.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(providerSubjects).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof providerSubjects.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = id.includes(":") ? id : `provider_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .update(providerSubjects)
            .set(data)
            .where(
                or(
                    eq(providerSubjects.id, plainId),
                    eq(providerSubjects.id, prefixedId)
                )
            )
            .returning();
        return result[0];
    }

    async delete(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = id.includes(":") ? id : `provider_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .delete(providerSubjects)
            .where(
                or(
                    eq(providerSubjects.id, plainId),
                    eq(providerSubjects.id, prefixedId)
                )
            )
            .returning();
        return result[0];
    }
}
