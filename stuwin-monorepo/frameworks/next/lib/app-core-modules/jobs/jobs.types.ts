
// ═══════════════════════════════════════════════════════════════
// BACKGROUND JOBS - TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type JobType = 'report-scanner' | 'topic-scanner';
export type JobStatus = 'active' | 'paused' | 'running' | 'unknown';

export interface BackgroundJob {
    id: string;
    name: string;
    description: string;
    type: JobType;
    status: JobStatus;
    schedule: string; // Cron expression
    scheduleDescription: string; // Human-readable
    nextRun: Date | null;
    endpoint: string;
    lastRun?: Date | null;
}

// ═══════════════════════════════════════════════════════════════
// LOG DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type LogJobType = 'scanner' | 'worker' | 'topic-scanner' | 'topic-worker';
export type LogStatus = 'started' | 'completed' | 'failed';

export interface JobLog {
    timestamp: Date;
    correlationId: string;
    jobType: LogJobType;
    status: LogStatus;
    duration?: number;
    metadata: Record<string, any>;
}

export interface LogFilters {
    jobType?: LogJobType[];
    status?: LogStatus[];
    startTime?: Date;
    endTime?: Date;
    correlationId?: string;
    limit?: number;
    offset?: number;
}

// ═══════════════════════════════════════════════════════════════
// STATISTICS DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface JobStats {
    jobType: string;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    successRate: number;
    avgProcessingTime: number;
    lastRun: Date | null;
    queueDepth?: number;
}

export interface JobStatsOverview {
    reportGeneration: JobStats;
    questionGeneration: JobStats;
    totalQueueDepth: number;
}

// ═══════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

// Control API
export interface JobControlRequest {
    jobId: string;
    action: 'pause' | 'resume' | 'trigger';
}

export interface JobControlResponse {
    success: boolean;
    message: string;
    job?: BackgroundJob;
}

export interface JobListResponse {
    jobs: BackgroundJob[];
}

// Logs API
export interface JobLogsRequest {
    jobType?: LogJobType[];
    status?: LogStatus[];
    startTime?: string; // ISO string
    endTime?: string; // ISO string
    correlationId?: string;
    limit?: number;
    offset?: number;
}

export interface JobLogsResponse {
    logs: JobLog[];
    total: number;
    hasMore: boolean;
}

// Stats API
export interface JobStatsResponse {
    overview: JobStatsOverview;
    recentActivity: Array<{
        timestamp: Date;
        jobType: string;
        status: LogStatus;
        duration?: number;
    }>;
}

// ═══════════════════════════════════════════════════════════════
// QSTASH SCHEDULE TYPES
// ═══════════════════════════════════════════════════════════════

export interface QStashSchedule {
    scheduleId: string;
    cron: string;
    destination: string;
    method?: string;
    body?: string;
    retries?: number;
    delay?: number;
    callback?: string;
    paused?: boolean;
    createdAt?: number;
}

// ═══════════════════════════════════════════════════════════════
// WORKER TYPES
// ═══════════════════════════════════════════════════════════════

export interface StudentReportData {
    score: number;
    summary: string;
    recommendations: string[];
}

export interface WorkerRequest {
    studentId: string;
    correlationId: string;
}

export interface TopicWorkerRequest {
    topicId: string;
    correlationId: string;
    questionsToGenerate: number;
}
