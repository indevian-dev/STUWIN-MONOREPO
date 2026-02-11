import { db, Database } from "@/lib/database";
import { workspaceRoles } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

export class RoleRepository {
    constructor(private readonly db: Database) { }

    async findAll() {
        return await this.db.select().from(workspaceRoles);
    }

    async findById(id: string) {
        const [role] = await this.db
            .select()
            .from(workspaceRoles)
            .where(eq(workspaceRoles.id, id))
            .limit(1);
        return role;
    }

    async create(data: { name: string; permissions?: string[]; forWorkspaceType?: string }) {
        const [role] = await this.db
            .insert(workspaceRoles)
            .values({
                name: data.name,
                permissions: data.permissions || [],
                forWorkspaceType: data.forWorkspaceType,
            })
            .returning();
        return role;
    }

    async update(id: string, data: Partial<{ name: string; permissions: string[]; forWorkspaceType: string }>) {
        const [role] = await this.db
            .update(workspaceRoles)
            .set(data)
            .where(eq(workspaceRoles.id, id))
            .returning();
        return role;
    }

    async delete(id: string) {
        await this.db.delete(workspaceRoles).where(eq(workspaceRoles.id, id));
    }
}
