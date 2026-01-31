import { db, Database } from "@/lib/app-infrastructure/database";
import { workspaceRoles } from "@/lib/app-infrastructure/database/schema";
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

    async create(data: { name: string; slug: string; permissions?: string[]; forWorkspaceType?: string; isStaff?: boolean }) {
        const [role] = await this.db
            .insert(workspaceRoles)
            .values({
                name: data.name,
                slug: data.slug,
                permissions: data.permissions || [],
                forWorkspaceType: data.forWorkspaceType,
                isStaff: data.isStaff || false,
            })
            .returning();
        return role;
    }

    async update(id: string, data: Partial<{ name: string; slug: string; permissions: string[]; forWorkspaceType: string; isStaff: boolean }>) {
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
