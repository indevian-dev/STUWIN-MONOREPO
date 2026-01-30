import { pgTable, foreignKey, varchar, timestamp, boolean, text, json, bigint, time, unique, jsonb, integer, real } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const accountNotifications = pgTable("account_notifications", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar(),
	body: varchar(),
	markAsRead: boolean("mark_as_read"),
	accountId: varchar("account_id"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	workspaceAccessKey: varchar("workspace_access_key").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "account_notifications_account_id_accounts_id_fk"
		}),
]);

export const accountOtps = pgTable("account_otps", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	code: varchar(),
	expireAt: timestamp("expire_at", { withTimezone: true, mode: 'string' }),
	type: varchar(),
	accountId: varchar("account_id"),
});

export const accountBookmarks = pgTable("account_bookmarks", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	questionId: varchar("question_id"),
	accountId: varchar("account_id"),
	workspaceAccessKey: varchar("workspace_access_key").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "account_bookmarks_account_id_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "account_bookmarks_question_id_questions_id_fk"
		}),
]);

export const blogs = pgTable("blogs", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	titleAz: text("title_az"),
	metaTitleAz: text("meta_title_az"),
	metaDescriptionAz: text("meta_description_az"),
	contentAz: text("content_az"),
	slug: varchar(),
	isActive: boolean("is_active"),
	cover: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	isFeatured: boolean("is_featured"),
	titleEn: text("title_en"),
	metaDescriptionEn: text("meta_description_en"),
	contentEn: text("content_en"),
	createdBy: varchar("created_by"),
	metaTitleEn: text("meta_title_en"),
});

export const accounts = pgTable("accounts", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	userId: varchar("user_id"),
	suspended: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}),
]);

export const learningSubjectPdfs = pgTable("learning_subject_pdfs", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	pdfUrl: text("pdf_url"),
	pdfOrder: text("pdf_order"),
	learningSubjectId: varchar("learning_subject_id"),
	isActive: boolean("is_active"),
	uploadAccountId: varchar("upload_account_id"),
	topicsOrderedIds: json("topics_ordered_ids"),
	workspaceAccessKey: varchar("workspace_access_key").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.learningSubjectId],
			foreignColumns: [learningSubjects.id],
			name: "learning_subject_pdfs_learning_subject_id_learning_subjects_id_"
		}),
]);

export const learningSubjectTopics = pgTable("learning_subject_topics", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	body: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gradeLevel: bigint("grade_level", { mode: "number" }),
	name: text(),
	learningSubjectId: varchar("learning_subject_id"),
	aiSummary: text("ai_summary"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	topicPublishedQuestionsStats: bigint("topic_published_questions_stats", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	topicGeneralQuestionsStats: bigint("topic_general_questions_stats", { mode: "number" }).default(0),
	isActiveForAi: boolean("is_active_for_ai").default(false),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	topicEstimatedQuestionsCapacity: bigint("topic_estimated_questions_capacity", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	topicQuestionsRemainingToGenerate: bigint("topic_questions_remaining_to_generate", { mode: "number" }),
	pdfS3Key: text("pdf_s3_key"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pdfPageStart: bigint("pdf_page_start", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pdfPageEnd: bigint("pdf_page_end", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalPdfPages: bigint("total_pdf_pages", { mode: "number" }),
	chapterNumber: text("chapter_number"),
	parentTopicId: varchar("parent_topic_id"),
	estimatedEducationStartDate: time("estimated_education_start_date"),
	subjectPdfId: varchar("subject_pdf_id"),
	workspaceAccessKey: varchar("workspace_access_key").notNull(),
	ftsTokens: text("fts_tokens"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.learningSubjectId],
			foreignColumns: [learningSubjects.id],
			name: "learning_subject_topics_learning_subject_id_learning_subjects_i"
		}),
	foreignKey({
			columns: [table.subjectPdfId],
			foreignColumns: [learningSubjectPdfs.id],
			name: "learning_subject_topics_subject_pdf_id_learning_subject_pdfs_id"
		}),
	foreignKey({
			columns: [table.parentTopicId],
			foreignColumns: [table.id],
			name: "topics_parent_topic_id_fkey"
		}),
]);

export const countries = pgTable("countries", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar().notNull(),
	isoCode: varchar("iso_code"),
	phoneCode: varchar("phone_code"),
	currency: varchar().default('AZN'),
}, (table) => [
	unique("countries_name_unique").on(table.name),
	unique("countries_iso_code_unique").on(table.isoCode),
]);

export const pages = pgTable("pages", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	type: varchar(),
	contentAz: text("content_az"),
	updateAt: timestamp("update_at", { mode: 'string' }),
	metaTitle: text("meta_title"),
	contentRu: text("content_ru"),
	contentEn: text("content_en"),
}, (table) => [
	unique("pages_type_unique").on(table.type),
]);

export const learningSubjects = pgTable("learning_subjects", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: text(),
	description: text(),
	cover: text(),
	slug: text(),
	isActive: boolean("is_active"),
	aiLabel: text("ai_label"),
	workspaceAccessKey: varchar("workspace_access_key"),
});

export const questions = pgTable("questions", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	question: text(),
	answers: json(),
	correctAnswer: text("correct_answer"),
	authorAccountId: varchar("author_account_id"),
	reviewerAccountId: varchar("reviewer_account_id"),
	learningSubjectId: varchar("learning_subject_id"),
	complexity: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gradeLevel: bigint("grade_level", { mode: "number" }),
	explanationGuide: json("explanation_guide"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	language: text(),
	workspaceAccessKey: varchar("workspace_access_key"),
	learningSubjectTopicId: varchar("learning_subject_topic_id"),
	isPublished: boolean("is_published").default(false),
}, (table) => [
	foreignKey({
			columns: [table.authorAccountId],
			foreignColumns: [accounts.id],
			name: "questions_author_account_id_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.learningSubjectId],
			foreignColumns: [learningSubjects.id],
			name: "questions_learning_subject_id_learning_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.learningSubjectTopicId],
			foreignColumns: [learningSubjectTopics.id],
			name: "questions_learning_subject_topic_id_learning_subject_topics_id_"
		}),
	foreignKey({
			columns: [table.reviewerAccountId],
			foreignColumns: [accounts.id],
			name: "questions_reviewer_account_id_accounts_id_fk"
		}),
]);

export const studentReports = pgTable("student_reports", {
	id: varchar().primaryKey().notNull(),
	studentAccountId: varchar("student_account_id").notNull(),
	reportData: jsonb("report_data").notNull(),
	generatedAt: timestamp("generated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	weekStart: timestamp("week_start", { withTimezone: true, mode: 'string' }).notNull(),
	weekEnd: timestamp("week_end", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	workspaceAccessKey: varchar("workspace_access_key"),
}, (table) => [
	foreignKey({
			columns: [table.studentAccountId],
			foreignColumns: [accounts.id],
			name: "student_reports_student_account_id_accounts_id_fk"
		}),
]);

export const userCredentials = pgTable("user_credentials", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	password: text(),
	facebookId: varchar("facebook_id"),
	googleId: varchar("google_id"),
	appleId: varchar("apple_id"),
	userId: varchar("user_id"),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "user_credentials_id_users_id_fk"
		}),
	unique("user_credentials_facebook_id_unique").on(table.facebookId),
	unique("user_credentials_google_id_unique").on(table.googleId),
	unique("user_credentials_apple_id_unique").on(table.appleId),
]);

export const systemPrompts = pgTable("system_prompts", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	body: text(),
	title: text(),
});

export const studentLearningSessions = pgTable("student_learning_sessions", {
	id: varchar().primaryKey().notNull(),
	workspaceAccessKey: varchar("workspace_access_key").notNull(),
	studentAccountId: varchar("student_account_id").notNull(),
	quizId: varchar("quiz_id"),
	topicId: varchar("topic_id"),
	homeworkId: varchar("homework_id"),
	rootQuestion: text("root_question").notNull(),
	messages: jsonb().default({"nodes":[]}).notNull(),
	status: varchar().default('active').notNull(),
	branchCount: integer("branch_count").default(0).notNull(),
	messageCount: integer("message_count").default(0).notNull(),
	totalTokensUsed: integer("total_tokens_used").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentAccountId],
			foreignColumns: [accounts.id],
			name: "student_learning_sessions_student_account_id_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [learningSubjectTopics.id],
			name: "student_learning_sessions_topic_id_learning_subject_topics_id_f"
		}),
]);

export const studentQuizzes = pgTable("student_quizzes", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	studentAccountId: varchar("student_account_id"),
	score: real(),
	questions: json(),
	result: json(),
	learningSubjectId: varchar("learning_subject_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gradeLevel: bigint("grade_level", { mode: "number" }),
	language: text(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	complexity: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalQuestions: bigint("total_questions", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	correctAnswers: bigint("correct_answers", { mode: "number" }),
	status: text(),
	userAnswers: json("user_answers"),
	workspaceAccessKey: varchar("workspace_access_key").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.learningSubjectId],
			foreignColumns: [learningSubjects.id],
			name: "student_quizzes_learning_subject_id_learning_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.studentAccountId],
			foreignColumns: [accounts.id],
			name: "student_quizzes_student_account_id_accounts_id_fk"
		}),
]);

export const workspaceRoles = pgTable("workspace_roles", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar().notNull(),
	slug: varchar().notNull(),
	permissions: jsonb().default({}),
	isStaff: boolean("is_staff").default(false),
	forWorkspaceType: varchar("for_workspace_type"),
}, (table) => [
	unique("workspace_roles_name_unique").on(table.name),
]);

export const users = pgTable("users", {
	id: varchar().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	phone: varchar(),
	emailIsVerified: boolean("email_is_verified").default(false),
	phoneIsVerified: boolean("phone_is_verified").default(false),
	avatarUrl: text("avatar_url"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	avatarBase64: varchar("avatar_base64"),
	sessions: json(),
	twoFactorAuthEmailExpireAt: time("two_factor_auth_email_expire_at"),
	twoFactorAuthPhoneExpireAt: time("two_factor_auth_phone_expire_at"),
	fin: varchar(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_fin_unique").on(table.fin),
]);

export const workspaceToWorkspace = pgTable("workspace_to_workspace", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	relationType: varchar("relation_type"),
	accountId: varchar("account_id"),
	fromWorkspaceId: varchar("from_workspace_id"),
	toWorkspaceId: varchar("to_workspace_id"),
	isApproved: boolean("is_approved"),
	role: varchar(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "workspace_to_workspace_account_id_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.fromWorkspaceId],
			foreignColumns: [workspaces.id],
			name: "workspace_to_workspace_from_workspace_id_workspaces_id_fk"
		}),
	foreignKey({
			columns: [table.toWorkspaceId],
			foreignColumns: [workspaces.id],
			name: "workspace_to_workspace_to_workspace_id_workspaces_id_fk"
		}),
]);

export const cities = pgTable("cities", {
	id: varchar().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: varchar(),
	countryId: varchar("country_id"),
}, (table) => [
	foreignKey({
			columns: [table.countryId],
			foreignColumns: [countries.id],
			name: "cities_country_id_countries_id_fk"
		}),
]);

export const studentHomeworks = pgTable("student_homeworks", {
	id: varchar().primaryKey().notNull(),
	workspaceAccessKey: varchar("workspace_access_key").notNull(),
	studentAccountId: varchar("student_account_id").notNull(),
	title: varchar().notNull(),
	description: text(),
	subject: varchar(),
	topicId: varchar("topic_id"),
	quizId: varchar("quiz_id"),
	imageUrl: varchar("image_url"),
	imageStoragePath: varchar("image_storage_path"),
	originalFileName: varchar("original_file_name"),
	status: varchar().default('pending').notNull(),
	learningConversationId: varchar("learning_conversation_id"),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.learningConversationId],
			foreignColumns: [studentLearningSessions.id],
			name: "student_homeworks_learning_conversation_id_student_learning_ses"
		}),
	foreignKey({
			columns: [table.studentAccountId],
			foreignColumns: [accounts.id],
			name: "student_homeworks_student_account_id_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [learningSubjectTopics.id],
			name: "student_homeworks_topic_id_learning_subject_topics_id_fk"
		}),
]);

export const workspaces = pgTable("workspaces", {
	id: varchar().primaryKey().notNull(),
	workspaceAccessKey: varchar("workspace_access_key").notNull(),
	type: varchar().notNull(),
	title: text().notNull(),
	metadata: jsonb().default({}),
	ownerAccountId: varchar("owner_account_id"),
	cityId: varchar("city_id"),
	parentWorkspaceId: varchar("parent_workspace_id"),
	isActive: boolean("is_active").default(true),
	isBlocked: boolean("is_blocked").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.ownerAccountId],
			foreignColumns: [accounts.id],
			name: "workspaces_owner_account_id_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.parentWorkspaceId],
			foreignColumns: [table.id],
			name: "workspaces_parent_workspace_id_fkey"
		}),
	unique("workspaces_workspace_access_key_unique").on(table.workspaceAccessKey),
]);
