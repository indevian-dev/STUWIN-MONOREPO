
import { JobRepository } from "./jobs.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import {
    getAllJobs,
    pauseSchedule,
    resumeSchedule,
    triggerJob,
} from '@/lib/helpers/qstashScheduleHelper';
import { DbClient } from "@/lib/app-infrastructure/database";

/**
 * JobService - Manages background jobs via QStash
 */
export class JobService extends BaseService {
    constructor(
        private readonly repository: JobRepository,
        private readonly ctx: AuthContext,
        private readonly db: DbClient
    ) {
        super();
    }

    async listJobs() {
        try {
            // In a real app we might verify staff permissions here
            const jobs = await getAllJobs();
            return { success: true, data: jobs };
        } catch (error) {
            this.handleError(error, "listJobs");
            return { success: false, error: "Failed to list jobs" };
        }
    }

    async pauseJob(jobId: string) {
        try {
            await pauseSchedule(jobId);
            return { success: true, message: 'Job paused successfully' };
        } catch (error) {
            this.handleError(error, "pauseJob");
            return { success: false, error: "Failed to pause job" };
        }
    }

    async resumeJob(jobId: string) {
        try {
            await resumeSchedule(jobId);
            return { success: true, message: 'Job resumed successfully' };
        } catch (error) {
            this.handleError(error, "resumeJob");
            return { success: false, error: "Failed to resume job" };
        }
    }

    async triggerJob(jobId: string) {
        try {
            const jobs = await getAllJobs();
            const job = jobs.find(j => j.id === jobId);
            if (!job) return { success: false, error: 'Job not found' };

            await triggerJob(job.endpoint);
            return { success: true, message: 'Job triggered successfully' };
        } catch (error) {
            this.handleError(error, "triggerJob");
            return { success: false, error: "Failed to trigger job" };
        }
    }
}
