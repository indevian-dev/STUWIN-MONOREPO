import { Axiom } from '@axiomhq/js';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
const axiomClient = new Axiom({
  token: process.env.AXIOM_TOKEN!
});

// Dataset name for account action logs
export const AXIOM_ACTION_LOG_DATASET = process.env.AXIOM_ACTION_LOG_DATASET || 'account-action-logs';
// Dataset name for background job logs (separate from action logs)
export const AXIOM_BACKGROUND_JOB_DATASET = process.env.AXIOM_BACKGROUND_JOB_DATASET || 'background-job-logs';

// ═══════════════════════════════════════════════════════════════
// JOB LOGGING HELPERS
// ═══════════════════════════════════════════════════════════════

export interface JobEventData {
  correlationId: string;
  jobType: 'scanner' | 'worker' | 'topic-scanner' | 'topic-worker';
  status: 'started' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

/**
 * Log job event to Axiom with structured correlation tracking
 */
export const logJobEvent = async (data: JobEventData): Promise<void> => {
  try {
    const event = {
      _time: new Date().toISOString(),
      correlationId: data.correlationId,
      jobType: data.jobType,
      status: data.status,
      ...data.metadata,
    };

    await axiomClient.ingest(AXIOM_BACKGROUND_JOB_DATASET, [event]);
    await axiomClient.flush();
  } catch (error) {
    ConsoleLogger.error('Failed to log job event to Axiom:', error);
    // Don't throw - logging should not break the main flow
  }
};

/**
 * Log scanner batch event
 */
export const logScannerBatch = async (data: {
  correlationId: string;
  status: 'started' | 'completed' | 'failed';
  lastId: string | number;
  batchSize: number;
  hasMore: boolean;
  error?: string;
}): Promise<void> => {
  return logJobEvent({
    correlationId: data.correlationId,
    jobType: 'scanner',
    status: data.status,
    metadata: {
      lastId: data.lastId,
      batchSize: data.batchSize,
      hasMore: data.hasMore,
      error: data.error,
    },
  });
};

/**
 * Log worker processing event
 */
export const logWorkerProcessing = async (data: {
  correlationId: string;
  studentId: string | number;
  status: 'started' | 'completed' | 'failed';
  processingTimeMs?: number;
  geminiResponseTimeMs?: number;
  reportId?: string | number;
  error?: string;
}): Promise<void> => {
  return logJobEvent({
    correlationId: data.correlationId,
    jobType: 'worker',
    status: data.status,
    metadata: {
      studentId: data.studentId,
      processingTimeMs: data.processingTimeMs,
      geminiResponseTimeMs: data.geminiResponseTimeMs,
      reportId: data.reportId,
      error: data.error,
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// TOPIC JOB LOGGING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Log topic scanner batch event
 */
export const logTopicScanner = async (data: {
  correlationId: string;
  status: 'started' | 'completed' | 'failed';
  lastId: string | number;
  batchSize: number;
  hasMore: boolean;
  topicsWithCapacity?: number;
  error?: string;
}): Promise<void> => {
  return logJobEvent({
    correlationId: data.correlationId,
    jobType: 'topic-scanner',
    status: data.status,
    metadata: {
      lastId: data.lastId,
      batchSize: data.batchSize,
      hasMore: data.hasMore,
      topicsWithCapacity: data.topicsWithCapacity,
      error: data.error,
    },
  });
};

/**
 * Log topic worker processing event
 */
export const logTopicWorker = async (data: {
  correlationId: string;
  topicId: string | number;
  status: 'started' | 'completed' | 'failed';
  questionsGenerated?: number;
  processingTimeMs?: number;
  currentStats?: number;
  capacity?: number;
  error?: string;
}): Promise<void> => {
  return logJobEvent({
    correlationId: data.correlationId,
    jobType: 'topic-worker',
    status: data.status,
    metadata: {
      topicId: data.topicId,
      questionsGenerated: data.questionsGenerated,
      processingTimeMs: data.processingTimeMs,
      currentStats: data.currentStats,
      capacity: data.capacity,
      error: data.error,
    },
  });
};

export default axiomClient;

