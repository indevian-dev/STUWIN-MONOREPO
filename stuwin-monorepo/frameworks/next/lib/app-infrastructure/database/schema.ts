import {
    pgTable,
    varchar,
    timestamp,
    text,
    boolean,
    bigint,
    jsonb,
    integer,
    real,
    primaryKey,
    foreignKey,
    time,
    index,
    uniqueIndex,
    customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { generateSlimId } from "@/lib/utils/slimUlidUtility";

// ═══════════════════════════════════════════════════════════════
// TYPES & SCHEMAS (JSONB)
// ═══════════════════════════════════════════════════════════════

export type WorkspaceProfile =
    | { type: 'student'; gradeLevel?: number; schoolName?: string; childFin?: string }
    | {
        type: 'provider';
        providerSubscriptionPrice: number;
        providerProgramDescription: string;
        providerTrialDaysCount: number;
        providerSubscriptionPeriod: 'month' | 'year';
        currency?: string;
        features?: string[];
        monthlyPrice?: number;
        yearlyPrice?: number;
        logo?: string;
        phone?: string;
        email?: string;
        website?: string;
        location?: { address?: string; city?: string };
    }
    | { type: 'staff'; department?: string; internalCode?: string }
    | { type: 'parent'; childrenCount?: number };

export type LocalizedContent = {
    [langCode: string]: {
        title: string;
        content?: string;
        metaTitle?: string;
        metaDescription?: string;
        slug?: string;
    }
};

export type QuestionContextSnapshot = {
    subjectName: string;
    topicName: string;
    chapterNumber?: string;
};

export type QuizPerformanceAnalytics = {
    [questionId: string]: {
        timeSpentSeconds: number;
        hintsUsed: number;
    }
};

export const vector768 = customType<{ data: number[] }>({
    dataType() {
        return "vector(768)";
    },
});

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
    sessions: jsonb("sessions"),
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
    metadata: jsonb("meta_data"),
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
    type: varchar("type").notNull(), // 'student', 'provider', 'staff', 'parent'
    title: text("title").notNull(),
    profile: jsonb("profile").$type<WorkspaceProfile>().default({} as any),
    cityId: varchar("city_id"),
    isActive: boolean("is_active").default(true),
    isBlocked: boolean("is_blocked").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        // Optimization: Expression index for sorting by price in JSONB
        priceIdx: index("workspace_price_idx").on(sql`(${table.profile}->>'subscriptionPrice')::numeric`),
    };
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
    metadata: jsonb("metadata"),
    status: varchar("status"),
    statusMetadata: jsonb("status_metadata"),
});

export const paymentSubscriptions = pgTable("payment_subscription", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    type: varchar("type"),
    price: real("price"),
    subscriptionPeriod: varchar("subscription_period"),
    metadata: jsonb("metadata"),
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



export const workspaceAccesses = pgTable("workspace_accesses", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    actorAccountId: varchar("actor_account_id").references(() => accounts.id),
    targetWorkspaceId: varchar("target_workspace_id").references(() => workspaces.id),
    viaWorkspaceId: varchar("via_workspace_id").references(() => workspaces.id),
    accessRole: varchar("access_role").references(() => workspaceRoles.name),
    subscribedUntil: timestamp("subscribed_until", { withTimezone: true }),
    subscriptionTier: varchar("subscription_tier"),
}, (table) => {
    return {
        // Enforce: One Account can only be enrolled in a specific Provider Workspace ONCE
        uniqueEnrollmentIdx: uniqueIndex("unique_enrollment_idx").on(table.actorAccountId, table.targetWorkspaceId),
    };
});

export const workspaceRoles = pgTable("workspace_roles", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    name: varchar("name").notNull().unique(),
    permissions: jsonb("permissions").default({}),
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

export const providerSubjects = pgTable("provider_subjects", {
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

export const providerSubjectPdfs = pgTable("provider_subject_pdfs", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    pdfUrl: text("pdf_url"),
    pdfOrder: text("pdf_order"),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),
    isActive: boolean("is_active"),
    uploadAccountId: varchar("upload_account_id"), // Potentially references accounts.id
    topicsOrderedIds: jsonb("topics_ordered_ids"),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    language: varchar("language"),
    name: varchar("name"),
});

export const providerSubjectTopics = pgTable("provider_subject_topics", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    description: text("description"),
    gradeLevel: bigint("grade_level", { mode: "number" }),
    name: text("name"),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),
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
    subjectPdfId: varchar("subject_pdf_id").references(() => providerSubjectPdfs.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    ftsTokens: text("fts_tokens"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    language: varchar("language"),
    aiAssistantCrib: text("ai_assistant_crib"),
    knowledgeVector: vector768("knowledge_vector"),
}, (table) => {
    return {
        parentTopicFkey: foreignKey({
            columns: [table.parentTopicId],
            foreignColumns: [table.id],
            name: "provider_topics_parent_topic_id_fkey"
        }),
    }
});

export const providerQuestions = pgTable("provider_questions", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    question: text("question"),
    answers: jsonb("answers"),
    correctAnswer: text("correct_answer"),
    authorAccountId: varchar("author_account_id").references(() => accounts.id),
    reviewerAccountId: varchar("reviewer_account_id").references(() => accounts.id),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),
    complexity: text("complexity"),
    gradeLevel: bigint("grade_level", { mode: "number" }),
    explanationGuide: jsonb("explanation_guide"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    language: text("language"),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
    providerSubjectTopicId: varchar("provider_subject_topic_id").references(() => providerSubjectTopics.id),
    isPublished: boolean("is_published").default(false),
    aiAssistantCrib: text("ai_assistant_crib"),
    context: jsonb("context").$type<QuestionContextSnapshot>(),
});

// ═══════════════════════════════════════════════════════════════
// STUDENT ACTIVITIES & REPORTS
// ═══════════════════════════════════════════════════════════════

export const studentAiSessions = pgTable("student_ai_sessions", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    quizId: varchar("quiz_id"), // FK to student_quizzes.id
    topicId: varchar("topic_id").references(() => providerSubjectTopics.id),
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
    topicId: varchar("topic_id").references(() => providerSubjectTopics.id),
    quizId: varchar("quiz_id"), // FK to student_quizzes.id
    imageUrl: varchar("image_url"),
    imageStoragePath: varchar("image_storage_path"),
    textContent: text("text_content"),
    originalFileName: varchar("original_file_name"),
    media: jsonb("media").default([]),
    status: varchar("status").notNull().default("pending"),
    aiSessionId: varchar("ai_session_id").references(() => studentAiSessions.id),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    snapshotSubjectTitle: varchar("snapshot_subject_title"),
    snapshotTopicTitle: varchar("snapshot_topic_title"),
    aiReport: jsonb("ai_report"),
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
    questions: jsonb("questions"),
    result: jsonb("result"),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),
    gradeLevel: bigint("grade_level", { mode: "number" }),
    language: text("language"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    complexity: text("complexity"),
    totalQuestions: bigint("total_questions", { mode: "number" }),
    correctAnswers: bigint("correct_answers", { mode: "number" }),
    status: text("status"),
    userAnswers: jsonb("user_answers"),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    snapshotSubjectTitle: varchar("snapshot_subject_title"),
    snapshotTopicTitle: varchar("snapshot_topic_title"),
    aiReport: jsonb("ai_report"),
    snapshotQuestions: jsonb("snapshot_questions"), // Immutable copy of questions
    performanceAnalytics: jsonb("performance_analytics").$type<QuizPerformanceAnalytics>(),
});

export const studentTopicMastery = pgTable("student_topic_mastery", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    topicId: varchar("topic_id").notNull().references(() => providerSubjectTopics.id),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),

    // Mastery Metrics
    masteryScore: real("mastery_score").default(0),
    totalQuizzesTaken: integer("total_quizzes_taken").default(0),
    questionsAttempted: integer("questions_attempted").default(0),
    questionsCorrect: integer("questions_correct").default(0),
    averageTimePerQuestion: real("average_time_per_question").default(0),

    // Metadata & Trends
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    masteryTrend: jsonb("mastery_trend").default([]), // History of last score updates
    gapAnalysis: jsonb("gap_analysis").default({}), // Feedback on missing concepts
    strengths: jsonb("strengths").default([]),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        studentTopicUniqueIdx: index("student_topic_mastery_uidx").on(table.studentAccountId, table.topicId),
    };
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
// SEMANTIC KNOWLEDGE HUB (DNA)
// ═══════════════════════════════════════════════════════════════

export const studentKnowledgeHubs = pgTable("student_knowledge_hubs", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),

    // The "Brain" (768-D Vector)
    knowledgeVector: vector768("knowledge_vector"),

    // Insights (Human-readable summaries)
    insights: jsonb("insights").default({}),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerKnowledgeHubs = pgTable("provider_knowledge_hubs", {
    id: varchar("id").primaryKey().references(() => workspaces.id), // 1-to-1 with Workspace

    // Balanced Centroid Vector (The "Classroom DNA")
    sumVector: vector768("sum_vector"),
    studentCount: integer("student_count").default(0),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const providerKnowledgeDeltas = pgTable("provider_knowledge_deltas", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),

    // The "Change" (New student progress)
    deltaVector: vector768("delta_vector").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════════
// CMS & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export const blogs = pgTable("blogs", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    slug: varchar("slug").unique(),
    localizedContent: jsonb("localized_content").$type<LocalizedContent>().default({}),
    isActive: boolean("is_active").default(true),
    cover: text("cover"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    isFeatured: boolean("is_featured").default(false),
    createdBy: varchar("created_by"), // FK to accounts.id
});

export const pages = pgTable("pages", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    type: varchar("type").unique(),
    localizedContent: jsonb("localized_content").$type<LocalizedContent>().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
    payload: jsonb("payload").$type<{ type?: string; message: string; link?: string; metadata?: any }>().default({} as any),
    markAsRead: boolean("mark_as_read").default(false),
    accountId: varchar("account_id").references(() => accounts.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
});

export const accountBookmarks = pgTable("account_bookmarks", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    questionId: varchar("question_id").references(() => providerQuestions.id),
    accountId: varchar("account_id").references(() => accounts.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
});

// ═══════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════

export const auditLogs = pgTable("audit_logs", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
    actorId: varchar("actor_id").references(() => accounts.id),
    entityType: varchar("entity_type").notNull(), // 'workspace', 'blog', 'question', etc.
    entityId: varchar("entity_id").notNull(),
    action: varchar("action").notNull(), // 'create', 'update', 'delete', 'login', etc.
    changeSummary: jsonb("change_summary").$type<{ before?: any; after?: any; ip?: string; extra?: any }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

