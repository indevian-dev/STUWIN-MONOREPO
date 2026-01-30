/**
 * Base Service Class
 * Provides common functionality for all services, such as error handling.
 */
export abstract class BaseService {
    protected handleError(error: unknown, context: string): void {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[${context}] Error:`, message, error);
        // You could also integrate with a logging service here in the future
    }
}
