import { relations } from "drizzle-orm/relations";
import { accounts, accountNotifications, accountBookmarks, questions, users, learningSubjects, learningSubjectPdfs, learningSubjectTopics, studentReports, userCredentials, studentLearningSessions, studentQuizzes, workspaceToWorkspace, workspaces, countries, cities, studentHomeworks } from "./schema";

export const accountNotificationsRelations = relations(accountNotifications, ({one}) => ({
	account: one(accounts, {
		fields: [accountNotifications.accountId],
		references: [accounts.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one, many}) => ({
	accountNotifications: many(accountNotifications),
	accountBookmarks: many(accountBookmarks),
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
	questions_authorAccountId: many(questions, {
		relationName: "questions_authorAccountId_accounts_id"
	}),
	questions_reviewerAccountId: many(questions, {
		relationName: "questions_reviewerAccountId_accounts_id"
	}),
	studentReports: many(studentReports),
	studentLearningSessions: many(studentLearningSessions),
	studentQuizzes: many(studentQuizzes),
	workspaceToWorkspaces: many(workspaceToWorkspace),
	studentHomeworks: many(studentHomeworks),
	workspaces: many(workspaces),
}));

export const accountBookmarksRelations = relations(accountBookmarks, ({one}) => ({
	account: one(accounts, {
		fields: [accountBookmarks.accountId],
		references: [accounts.id]
	}),
	question: one(questions, {
		fields: [accountBookmarks.questionId],
		references: [questions.id]
	}),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	accountBookmarks: many(accountBookmarks),
	account_authorAccountId: one(accounts, {
		fields: [questions.authorAccountId],
		references: [accounts.id],
		relationName: "questions_authorAccountId_accounts_id"
	}),
	learningSubject: one(learningSubjects, {
		fields: [questions.learningSubjectId],
		references: [learningSubjects.id]
	}),
	learningSubjectTopic: one(learningSubjectTopics, {
		fields: [questions.learningSubjectTopicId],
		references: [learningSubjectTopics.id]
	}),
	account_reviewerAccountId: one(accounts, {
		fields: [questions.reviewerAccountId],
		references: [accounts.id],
		relationName: "questions_reviewerAccountId_accounts_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	userCredentials: many(userCredentials),
}));

export const learningSubjectPdfsRelations = relations(learningSubjectPdfs, ({one, many}) => ({
	learningSubject: one(learningSubjects, {
		fields: [learningSubjectPdfs.learningSubjectId],
		references: [learningSubjects.id]
	}),
	learningSubjectTopics: many(learningSubjectTopics),
}));

export const learningSubjectsRelations = relations(learningSubjects, ({many}) => ({
	learningSubjectPdfs: many(learningSubjectPdfs),
	learningSubjectTopics: many(learningSubjectTopics),
	questions: many(questions),
	studentQuizzes: many(studentQuizzes),
}));

export const learningSubjectTopicsRelations = relations(learningSubjectTopics, ({one, many}) => ({
	learningSubject: one(learningSubjects, {
		fields: [learningSubjectTopics.learningSubjectId],
		references: [learningSubjects.id]
	}),
	learningSubjectPdf: one(learningSubjectPdfs, {
		fields: [learningSubjectTopics.subjectPdfId],
		references: [learningSubjectPdfs.id]
	}),
	learningSubjectTopic: one(learningSubjectTopics, {
		fields: [learningSubjectTopics.parentTopicId],
		references: [learningSubjectTopics.id],
		relationName: "learningSubjectTopics_parentTopicId_learningSubjectTopics_id"
	}),
	learningSubjectTopics: many(learningSubjectTopics, {
		relationName: "learningSubjectTopics_parentTopicId_learningSubjectTopics_id"
	}),
	questions: many(questions),
	studentLearningSessions: many(studentLearningSessions),
	studentHomeworks: many(studentHomeworks),
}));

export const studentReportsRelations = relations(studentReports, ({one}) => ({
	account: one(accounts, {
		fields: [studentReports.studentAccountId],
		references: [accounts.id]
	}),
}));

export const userCredentialsRelations = relations(userCredentials, ({one}) => ({
	user: one(users, {
		fields: [userCredentials.id],
		references: [users.id]
	}),
}));

export const studentLearningSessionsRelations = relations(studentLearningSessions, ({one, many}) => ({
	account: one(accounts, {
		fields: [studentLearningSessions.studentAccountId],
		references: [accounts.id]
	}),
	learningSubjectTopic: one(learningSubjectTopics, {
		fields: [studentLearningSessions.topicId],
		references: [learningSubjectTopics.id]
	}),
	studentHomeworks: many(studentHomeworks),
}));

export const studentQuizzesRelations = relations(studentQuizzes, ({one}) => ({
	learningSubject: one(learningSubjects, {
		fields: [studentQuizzes.learningSubjectId],
		references: [learningSubjects.id]
	}),
	account: one(accounts, {
		fields: [studentQuizzes.studentAccountId],
		references: [accounts.id]
	}),
}));

export const workspaceToWorkspaceRelations = relations(workspaceToWorkspace, ({one}) => ({
	account: one(accounts, {
		fields: [workspaceToWorkspace.accountId],
		references: [accounts.id]
	}),
	workspace_fromWorkspaceId: one(workspaces, {
		fields: [workspaceToWorkspace.fromWorkspaceId],
		references: [workspaces.id],
		relationName: "workspaceToWorkspace_fromWorkspaceId_workspaces_id"
	}),
	workspace_toWorkspaceId: one(workspaces, {
		fields: [workspaceToWorkspace.toWorkspaceId],
		references: [workspaces.id],
		relationName: "workspaceToWorkspace_toWorkspaceId_workspaces_id"
	}),
}));

export const workspacesRelations = relations(workspaces, ({one, many}) => ({
	workspaceToWorkspaces_fromWorkspaceId: many(workspaceToWorkspace, {
		relationName: "workspaceToWorkspace_fromWorkspaceId_workspaces_id"
	}),
	workspaceToWorkspaces_toWorkspaceId: many(workspaceToWorkspace, {
		relationName: "workspaceToWorkspace_toWorkspaceId_workspaces_id"
	}),
	account: one(accounts, {
		fields: [workspaces.ownerAccountId],
		references: [accounts.id]
	}),
	workspace: one(workspaces, {
		fields: [workspaces.parentWorkspaceId],
		references: [workspaces.id],
		relationName: "workspaces_parentWorkspaceId_workspaces_id"
	}),
	workspaces: many(workspaces, {
		relationName: "workspaces_parentWorkspaceId_workspaces_id"
	}),
}));

export const citiesRelations = relations(cities, ({one}) => ({
	country: one(countries, {
		fields: [cities.countryId],
		references: [countries.id]
	}),
}));

export const countriesRelations = relations(countries, ({many}) => ({
	cities: many(cities),
}));

export const studentHomeworksRelations = relations(studentHomeworks, ({one}) => ({
	studentLearningSession: one(studentLearningSessions, {
		fields: [studentHomeworks.learningConversationId],
		references: [studentLearningSessions.id]
	}),
	account: one(accounts, {
		fields: [studentHomeworks.studentAccountId],
		references: [accounts.id]
	}),
	learningSubjectTopic: one(learningSubjectTopics, {
		fields: [studentHomeworks.topicId],
		references: [learningSubjectTopics.id]
	}),
}));
