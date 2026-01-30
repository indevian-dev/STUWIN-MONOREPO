
import { ContentRepository } from "./content.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { DbClient } from "@/lib/app-infrastructure/database";

/**
 * ContentService - Manages blogs, pages, and system prompts
 */
export class ContentService extends BaseService {
    constructor(
        private readonly repository: ContentRepository,
        private readonly ctx: AuthContext,
        private readonly db: DbClient
    ) {
        super();
    }

    // ═══════════════════════════════════════════════════════════════
    // BLOGS
    // ═══════════════════════════════════════════════════════════════

    async listBlogs(options: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
    } = {}) {
        try {
            const page = options.page || 1;
            const limit = options.limit || 10;
            const offset = (page - 1) * limit;

            const result = await this.repository.listBlogs({
                onlyActive: options.isActive !== false,
                limit,
                offset,
                search: options.search
            });

            return {
                success: true,
                data: {
                    blogs: result.data,
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit)
                    }
                }
            };
        } catch (error) {
            this.handleError(error, "listBlogs");
            return { success: false, error: "Failed to list blogs" };
        }
    }

    async createBlog(data: any) {
        try {
            const created = await this.repository.createBlog({
                ...data,
                createdBy: this.ctx.accountId ? this.ctx.accountId : undefined
            });

            return { success: true, data: created };
        } catch (error) {
            this.handleError(error, "createBlog");
            return { success: false, error: "Failed to create blog" };
        }
    }

    async getBlog(id: string) {
        try {
            const blog = await this.repository.findBlogById(id);
            if (!blog) return { success: false, error: "Blog not found" };
            return { success: true, data: blog };
        } catch (error) {
            this.handleError(error, "getBlog");
            return { success: false, error: "Failed to get blog" };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PAGES
    // ═══════════════════════════════════════════════════════════════

    async getPage(type: string) {
        try {
            const page = await this.repository.findPageByType(type);
            if (!page) return { success: false, error: "Page not found" };
            return { success: true, data: page };
        } catch (error) {
            this.handleError(error, "getPage");
            return { success: false, error: "Failed to get page" };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PROMPTS
    // ═══════════════════════════════════════════════════════════════

    async listPrompts() {
        try {
            const prompts = await this.repository.listPrompts();
            return { success: true, data: prompts };
        } catch (error) {
            this.handleError(error, "listPrompts");
            return { success: false, error: "Failed to list prompts" };
        }
    }
}
