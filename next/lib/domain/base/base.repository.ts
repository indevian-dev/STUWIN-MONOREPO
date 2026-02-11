import { type DbClient } from "@/lib/database";

/**
 * Base Repository Class
 * Provides the database client instance to all repositories.
 * Supports dependency injection of the database client.
 */
export class BaseRepository {
    constructor(protected readonly db: DbClient) { }
}
