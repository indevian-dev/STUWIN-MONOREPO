import {
    pgTable,
    varchar,
    timestamp,
    text,
    boolean,
    bigint,
    json,
    jsonb,
    integer,
    real,
    primaryKey,
    foreignKey,
    time,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { generateSlimId } from "@/lib/utils/slimUlidUtility";

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION & USERS
// ═══════════════════════════════════════════════════════════════

export const users = pgTable("users", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    email: text("email").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    phone: varchar("phone"),
    emailIsVerified: boolean("email_is_verified").default(false),
    phoneIsVerified: boolean("phone_is_verified").default(false),
    avatarUrl: text("avatar_url"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    avatarBase64: varchar("avatar_base64"),
    sessions: json("sessions"),
    twoFactorAuthEmailExpireAt: time("two_factor_auth_email_expire_at"),
    twoFactorAuthPhoneExpireAt: time("two_factor_auth_phone_expire_at"),
    fin: varchar("fin").unique(),
    sessionsGroupId: varchar("sessions_group_id").unique(),
});

export const userCredentials = pgTable("user_credentials", {
    id: varchar("id").primaryKey().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    password: text("password"),
    facebookId: varchar("facebook_id").unique(),
    googleId: varchar("google_id").unique(),
    appleId: varchar("apple_id").unique(),
    userId: varchar("user_id"), // Redundant but kept if needed
});

export const accounts = pgTable("accounts", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    userId: varchar("user_id").references(() => users.id),
    suspended: boolean("suspended").default(false),
    subscribedUntil: timestamp("subscribed_until", { withTimezone: true }),
    subscriptionType: varchar("subscription_type"),
});

export const userSessions = pgTable("user_sessions", {
    id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sessionsGroupId: varchar("group_id"), // Part of the session identifier
    device: varchar("device"),
    browser: varchar("browser"),
    os: varchar("os"),
    metadata: json("meta_data"),
    ip: varchar("ip"),
    expireAt: timestamp("expire_at", { withTimezone: true }),
    accountId: varchar("account_id").references(() => accounts.id),
});

export const accountOtps = pgTable("account_otps", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    code: varchar("code"),
    expireAt: timestamp("expire_at", { withTimezone: true }),
    type: varchar("type"),
    accountId: varchar("account_id"), // FK to accounts.id
    destination: varchar("destination"),
});

// ═══════════════════════════════════════════════════════════════
// WORKSPACES & MEMBERSHIPS
// ═══════════════════════════════════════════════════════════════

export const workspaces = pgTable("workspaces", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    type: varchar("type").notNull(),
    title: text("title").notNull(),
    metadata: jsonb("metadata").default({}),
    ownerAccountId: varchar("owner_account_id").references(() => accounts.id),
    cityId: varchar("city_id"), // FK to cities.id
    parentWorkspaceId: varchar("parent_workspace_id"), // Self-ref references is handled in constraints below
    isActive: boolean("is_active").default(true),
    isBlocked: boolean("is_blocked").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    studentSubscribedUntill: timestamp("student_subscribed_untill", { withTimezone: true }),
    providerSubscriptionPrice: real("provider_subscription_price"),
    providerProgramDescription: text("provider_program_description"),
    providerSubscriptionPeriod: varchar("provider_subscription_period").default("month"),
    providerTrialDaysCount: bigint("provider_trial_days_count", { mode: "number" }).default(0),
}, (table) => {
    return {
        parentWorkspaceFkey: foreignKey({
            columns: [table.parentWorkspaceId],
            foreignColumns: [table.id],
            name: "workspaces_parent_workspace_id_fkey"
        }),
    }
});

// ═══════════════════════════════════════════════════════════════
// PAYMENTS & SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════

export const workspaceSubscriptionTransactions = pgTable("workspace_subscription_transactions", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paymentChannel: varchar("payment_channel"),
    paidAmount: real("paid_amount"),
    accountId: varchar("account_id").references(() => accounts.id),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
    metadata: json("metadata"),
    status: varchar("status"),
    statusMetadata: json("status_metadata"),
});

export const paymentSubscriptions = pgTable("payment_subscription", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    type: varchar("type"),
    price: real("price"),
    subscribtionPeriod: varchar("subscribtion_period"),
    metadata: json("metadata"),
    title: varchar("title"),
    isActive: boolean("is_active"),
});

export const workspaceSubscriptionCoupons = pgTable("workspace_subscription_coupons", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    discountPercent: bigint("discount_percent", { mode: "number" }),
    code: varchar("code").notNull().unique(),
    usageCount: bigint("usage_count", { mode: "number" }),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
    isActive: boolean("is_active"),
});

export const activeSubscriptions = pgTable("active_subscriptions", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    accountId: varchar("account_id").references(() => accounts.id), // Owner/Payer
    workspaceId: varchar("workspace_id").references(() => workspaces.id),

    // Plan Details
    planType: varchar("plan_type").notNull(), // e.g. 'pro', 'premium' (matches paymentSubscriptions.type)
    planId: varchar("plan_id"), // Optional FK to paymentSubscriptions.id

    // Period & Status
    startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    status: varchar("status").default('active'), // 'active', 'cancelled', 'expired'

    // Metadata
    metadata: jsonb("metadata").default({}),
    paymentTransactionId: varchar("payment_transaction_id"),
});

export const workspaceToWorkspace = pgTable("workspace_to_workspace", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    relationType: varchar("relation_type"),
    accountId: varchar("account_id").references(() => accounts.id),
    fromWorkspaceId: varchar("from_workspace_id").references(() => workspaces.id),
    toWorkspaceId: varchar("to_workspace_id").references(() => workspaces.id),
    isApproved: boolean("is_approved"),
    role: varchar("role"), // FK to workspace_roles.name
});

export const workspaceRoles = pgTable("workspace_roles", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    name: varchar("name").notNull().unique(),
    slug: varchar("slug").notNull(),
    permissions: jsonb("permissions").default({}),
    isStaff: boolean("is_staff").default(false),
    forWorkspaceType: varchar("for_workspace_type"),
});

// ═══════════════════════════════════════════════════════════════
// GEOGRAPHY
// ═══════════════════════════════════════════════════════════════

export const countries = pgTable("countries", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    name: varchar("name").notNull().unique(),
    isoCode: varchar("iso_code").unique(),
    phoneCode: varchar("phone_code"),
    currency: varchar("currency").default("AZN"),
});

export const cities = pgTable("cities", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    title: varchar("title"),
    countryId: varchar("country_id").references(() => countries.id),
});

// ═══════════════════════════════════════════════════════════════
// EDUCATIONAL CONTENT
// ═══════════════════════════════════════════════════════════════

export const learningSubjects = pgTable("learning_subjects", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    name: text("name"),
    description: text("description"),
    cover: text("cover"),
    slug: text("slug"),
    isActive: boolean("is_active"),
    aiLabel: text("ai_label"),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
    gradeLevel: integer("grade_level"),
    language: varchar("language"),
    aiAssistantCrib: text("ai_assistant_crib"),
});

export const learningSubjectPdfs = pgTable("learning_subject_pdfs", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    pdfUrl: text("pdf_url"),
    pdfOrder: text("pdf_order"),
    learningSubjectId: varchar("learning_subject_id").references(() => learningSubjects.id),
    isActive: boolean("is_active"),
    uploadAccountId: varchar("upload_account_id"), // Potentially references accounts.id
    topicsOrderedIds: json("topics_ordered_ids"),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    language: varchar("language"),
    name: varchar("name"),
});

export const learningSubjectTopics = pgTable("learning_subject_topics", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    description: text("description"),
    gradeLevel: bigint("grade_level", { mode: "number" }),
    name: text("name"),
    learningSubjectId: varchar("learning_subject_id").references(() => learningSubjects.id),
    aiSummary: text("ai_summary"),
    topicPublishedQuestionsStats: bigint("topic_published_questions_stats", { mode: "number" }).default(0),
    topicGeneralQuestionsStats: bigint("topic_general_questions_stats", { mode: "number" }).default(0),
    isActiveForAi: boolean("is_active_for_ai").default(false),
    topicEstimatedQuestionsCapacity: bigint("topic_estimated_questions_capacity", { mode: "number" }),
    topicQuestionsRemainingToGenerate: bigint("topic_questions_remaining_to_generate", { mode: "number" }),
    pdfS3Key: text("pdf_s3_key"),
    pdfPageStart: bigint("pdf_page_start", { mode: "number" }),
    pdfPageEnd: bigint("pdf_page_end", { mode: "number" }),
    totalPdfPages: bigint("total_pdf_pages", { mode: "number" }),
    chapterNumber: text("chapter_number"),
    parentTopicId: varchar("parent_topic_id"),
    estimatedEducationStartDate: time("estimated_education_start_date"),
    subjectPdfId: varchar("subject_pdf_id").references(() => learningSubjectPdfs.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    ftsTokens: text("fts_tokens"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    language: varchar("language"),
    aiAssistantCrib: text("ai_assistant_crib"),
}, (table) => {
    return {
        parentTopicFkey: foreignKey({
            columns: [table.parentTopicId],
            foreignColumns: [table.id],
            name: "topics_parent_topic_id_fkey"
        }),
    }
});

export const questions = pgTable("questions", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    question: text("question"),
    answers: json("answers"),
    correctAnswer: text("correct_answer"),
    authorAccountId: varchar("author_account_id").references(() => accounts.id),
    reviewerAccountId: varchar("reviewer_account_id").references(() => accounts.id),
    learningSubjectId: varchar("learning_subject_id").references(() => learningSubjects.id),
    complexity: text("complexity"),
    gradeLevel: bigint("grade_level", { mode: "number" }),
    explanationGuide: json("explanation_guide"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    language: text("language"),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
    learningSubjectTopicId: varchar("learning_subject_topic_id").references(() => learningSubjectTopics.id),
    isPublished: boolean("is_published").default(false),
    aiAssistantCrib: text("ai_assistant_crib"),
});

// ═══════════════════════════════════════════════════════════════
// STUDENT ACTIVITIES & REPORTS
// ═══════════════════════════════════════════════════════════════

export const studentLearningSessions = pgTable("student_learning_sessions", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    quizId: varchar("quiz_id"), // FK to student_quizzes.id
    topicId: varchar("topic_id").references(() => learningSubjectTopics.id),
    homeworkId: varchar("homework_id"), // FK to student_homeworks.id
    rootQuestion: text("root_question").notNull(),
    digests: jsonb("digests").notNull().default({ nodes: [] }),
    status: varchar("status").notNull().default("active"),
    branchCount: integer("branch_count").notNull().default(0),
    messageCount: integer("message_count").notNull().default(0),
    totalTokensUsed: integer("total_tokens_used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentHomeworks = pgTable("student_homeworks", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    title: varchar("title").notNull(),
    description: text("description"),
    subject: varchar("subject"),
    topicId: varchar("topic_id").references(() => learningSubjectTopics.id),
    quizId: varchar("quiz_id"), // FK to student_quizzes.id
    imageUrl: varchar("image_url"),
    imageStoragePath: varchar("image_storage_path"),
    textContent: text("text_content"),
    originalFileName: varchar("original_file_name"),
    media: jsonb("media").default([]),
    status: varchar("status").notNull().default("pending"),
    learningConversationId: varchar("learning_conversation_id").references(() => studentLearningSessions.id),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    aiAssistantCrib: text("ai_assistant_crib"),
});

export const studentQuizReports = pgTable("student_quiz_reports", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    quizId: varchar("quiz_id").notNull().references(() => studentQuizzes.id),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    reportText: text("report_text"),
    learningInsights: jsonb("learning_insights").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentQuizzes = pgTable("student_quizzes", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    studentAccountId: varchar("student_account_id").references(() => accounts.id),
    score: real("score"),
    questions: json("questions"),
    result: json("result"),
    learningSubjectId: varchar("learning_subject_id").references(() => learningSubjects.id),
    gradeLevel: bigint("grade_level", { mode: "number" }),
    language: text("language"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    complexity: text("complexity"),
    totalQuestions: bigint("total_questions", { mode: "number" }),
    correctAnswers: bigint("correct_answers", { mode: "number" }),
    status: text("status"),
    userAnswers: json("user_answers"),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
});

export const studentReports = pgTable("student_reports", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    reportData: jsonb("report_data").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
    weekEnd: timestamp("week_end", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
});

// ═══════════════════════════════════════════════════════════════
// CMS & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export const blogs = pgTable("blogs", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    titleAz: text("title_az"),
    metaTitleAz: text("meta_title_az"),
    metaDescriptionAz: text("meta_description_az"),
    contentAz: text("content_az"),
    slug: varchar("slug"),
    isActive: boolean("is_active"),
    cover: text("cover"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    isFeatured: boolean("is_featured"),
    titleEn: text("title_en"),
    metaDescriptionEn: text("meta_description_en"),
    contentEn: text("content_en"),
    createdBy: varchar("created_by"), // FK to accounts.id
    metaTitleEn: text("meta_title_en"),
});

export const pages = pgTable("pages", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    type: varchar("type").unique(),
    contentAz: text("content_az"),
    updateAt: timestamp("update_at"),
    metaTitle: text("meta_title"),
    contentRu: text("content_ru"),
    contentEn: text("content_en"),
});

export const systemPrompts = pgTable("system_prompts", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    body: text("body"),
    title: text("title"),
    usageFlowType: varchar("usage_flow_type"),
    isActive: boolean("is_active"),
});

export const accountNotifications = pgTable("account_notifications", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    name: varchar("name"),
    body: varchar("body"),
    markAsRead: boolean("mark_as_read"),
    accountId: varchar("account_id").references(() => accounts.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
});

export const accountBookmarks = pgTable("account_bookmarks", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    questionId: varchar("question_id").references(() => questions.id),
    accountId: varchar("account_id").references(() => accounts.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
});

