
import { eq, desc, and } from "drizzle-orm";
import { studentHomeworks } from "@/lib/database/schema";
import { BaseRepository } from "../base/Base.repository";
import { type DbClient } from "@/lib/database";

type NewHomework = typeof studentHomeworks.$inferInsert;

/**
 * HomeworkRepository - Database operations for homework submissions
 */
export class HomeworkRepository extends BaseRepository {

    async findById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(studentHomeworks).where(eq(studentHomeworks.id, id)).limit(1);
        return result[0] || null;
    }

    async listByAccount(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(studentHomeworks)
            .where(eq(studentHomeworks.studentAccountId, accountId))
            .orderBy(desc(studentHomeworks.createdAt));
    }

    async create(data: NewHomework, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentHomeworks).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<NewHomework>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(studentHomeworks).set(data).where(eq(studentHomeworks.id, id)).returning();
        return result[0];
    }
}
