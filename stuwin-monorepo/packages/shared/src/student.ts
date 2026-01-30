import { z } from 'zod';

export const StudentSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2),
    email: z.string().email(),
    grade: z.number().min(1).max(12),
    isActive: z.boolean().default(true)
});

export type Student = z.infer<typeof StudentSchema>;
