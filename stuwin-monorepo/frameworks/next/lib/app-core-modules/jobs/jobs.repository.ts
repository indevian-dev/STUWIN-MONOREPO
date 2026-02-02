import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";
import { and, asc, eq, gt, gte, lte, inArray, count } from 'drizzle-orm';
import {
    workspaces,
    accounts,
    studentQuizzes,
    accountBookmarks,
    accountNotifications,
    studentReports,
    providerSubjectTopics as learningSubjectTopics,
    workspaceAccesses
} from '@/lib/app-infrastructure/database/schema';

/**
 * JobRepository - Handles job logs and persistence
 */
export class JobRepository extends BaseRepository {
    // Placeholder methods to match pattern
    async logJob(data: any, tx?: DbClient) {
        // Implementation would go here
        return { success: true };
    }

    async getStudentBatch(lastId?: string, batchSize: number = 1000) {
        return await this.db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(
                and(
                    eq(workspaces.type, "student"),
                    lastId ? gt(workspaces.id, lastId) : undefined
                )
            )
            .orderBy(asc(workspaces.id))
            .limit(batchSize);
    }

    async getStudentWithAccount(studentId: string) {
        const result = await this.db
            .select({
                student: workspaces,
                account: accounts
            })
            .from(workspaces)
            .leftJoin(workspaceAccesses, and(
                eq(workspaces.id, workspaceAccesses.targetWorkspaceId),
                eq(workspaceAccesses.accessRole, 'owner')
            ))
            .leftJoin(accounts, eq(workspaceAccesses.actorAccountId, accounts.id))
            .where(eq(workspaces.id, studentId))
            .limit(1);
        return result[0] || null;
    }

    async getStudentActivity(studentId: string, weekStart: Date, weekEnd: Date) {
        const [quizzes, bookmarks, notifications] = await Promise.all([
            this.db.select()
                .from(studentQuizzes)
                .where(
                    and(
                        eq(studentQuizzes.studentAccountId, studentId),
                        gte(studentQuizzes.completedAt, weekStart),
                        lte(studentQuizzes.completedAt, weekEnd)
                    )
                )
                .orderBy(asc(studentQuizzes.completedAt)),
            this.db.select({ count: count() })
                .from(accountBookmarks)
                .where(eq(accountBookmarks.accountId, studentId)),
            this.db.select()
                .from(accountNotifications)
                .where(
                    and(
                        eq(accountNotifications.accountId, studentId),
                        gte(accountNotifications.createdAt, weekStart)
                    )
                )
        ]);

        return { quizzes, bookmarks: Number(bookmarks[0]?.count || 0), notifications };
    }

    async getTopicsBySubjectIds(subjectIds: string[]) {
        if (!subjectIds.length) return [];
        return await this.db.select({
            id: learningSubjectTopics.id,
            name: learningSubjectTopics.name,
            subjectId: learningSubjectTopics.providerSubjectId
        })
            .from(learningSubjectTopics)
            .where(inArray(learningSubjectTopics.providerSubjectId, subjectIds));
    }

    async getTopicById(topicId: string) {
        const result = await this.db
            .select()
            .from(learningSubjectTopics)
            .where(eq(learningSubjectTopics.id, topicId))
            .limit(1);
        return result[0] || null;
    }

    async getTopicsToProcessForAi(limit: number = 5) {
        return await this.db
            .select()
            .from(learningSubjectTopics)
            .where(
                and(
                    eq(learningSubjectTopics.isActiveForAi, true),
                    gt(learningSubjectTopics.topicQuestionsRemainingToGenerate, 0)
                )
            )
            .limit(limit);
    }

    async saveStudentReport(data: any) {
        const result = await this.db.insert(studentReports).values(data).returning();
        return result[0];
    }
}
