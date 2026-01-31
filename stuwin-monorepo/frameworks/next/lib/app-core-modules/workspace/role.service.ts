
import { RoleRepository } from "./role.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";

export class RoleService extends BaseService {
    constructor(
        private readonly repository: RoleRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database
    ) {
        super();
    }

    async getAllRoles() {
        try {
            const roles = await this.repository.findAll();
            return { success: true, roles };
        } catch (error) {
            this.handleError(error, "getAllRoles");
            return { success: false, error: "Failed to fetch roles" };
        }
    }

    async getRole(id: string) {
        try {
            const role = await this.repository.findById(id);
            if (!role) {
                return { success: false, error: "Role not found", status: 404 };
            }
            return { success: true, role };
        } catch (error) {
            this.handleError(error, "getRole");
            return { success: false, error: "Failed to fetch role" };
        }
    }

    async createRole(data: { name: string; permissions?: string[]; forWorkspaceType?: string }) {
        try {
            const slug = data.name.toLowerCase().replace(/ /g, '-');
            const role = await this.repository.create({
                ...data,
                slug,
            });
            return { success: true, role };
        } catch (error) {
            this.handleError(error, "createRole");
            return { success: false, error: "Failed to create role" };
        }
    }

    async updateRolePermissions(id: string, permission: string, action: 'add' | 'remove') {
        try {
            const role = await this.repository.findById(id);
            if (!role) {
                return { success: false, error: "Role not found", status: 404 };
            }

            let permissions = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];

            if (action === 'add') {
                if (!permissions.includes(permission)) {
                    permissions.push(permission);
                }
            } else {
                permissions = permissions.filter((p) => p !== permission);
            }

            const updated = await this.repository.update(id, { permissions });
            return { success: true, role: updated };
        } catch (error) {
            this.handleError(error, "updateRolePermissions");
            return { success: false, error: "Failed to update role permissions" };
        }
    }
}
