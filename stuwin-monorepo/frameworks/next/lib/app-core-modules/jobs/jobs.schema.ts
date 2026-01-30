
import { z } from "zod";

/**
 * Zod schemas for Jobs module
 */

export const jobControlSchema = z.object({
    jobId: z.string(),
    action: z.enum(['pause', 'resume', 'trigger']),
});

export const jobLogFilterSchema = z.object({
    status: z.array(z.string()).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
});
