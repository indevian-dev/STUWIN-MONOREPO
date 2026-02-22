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

    time,
    index,
    uniqueIndex,
    customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { generateSlimId } from "@/lib/utils/Helper.SlimUlid.util";

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
    toDriver(value: number[]) {
        return `[${value.join(",")}]`;
    },
    fromDriver(value: unknown) {
        if (typeof value === "string") {
            return value
                .replace(/[\[\]]/g, "")
                .split(",")
                .map((v) => parseFloat(v));
        }
        return value as number[];
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
    firstName: text("first_name"),
    lastName: text("last_name"),
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
    profile: jsonb("profile").$type<WorkspaceProfile>().default(sql`'{}'`),
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



export const workspaceRoles = pgTable("workspace_roles", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    name: varchar("name").notNull().unique(),
    permissions: jsonb("permissions").default({}),
    forWorkspaceType: varchar("for_workspace_type"),
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

export const workspaceInvitations = pgTable("workspace_invitations", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    invitedAccountId: varchar("invited_account_id").references(() => accounts.id),
    forWorkspaceId: varchar("for_workspace_id").references(() => workspaces.id),
    invitedByAccountId: varchar("invited_by_account_id").references(() => accounts.id),
    isApproved: boolean("is_approved").default(false),
    isDeclined: boolean("is_declined").default(false),
    accessRole: varchar("access_role").references(() => workspaceRoles.name),
    expireAt: timestamp("expire_at", { withTimezone: true }),
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

    slug: text("slug"),
    isActive: boolean("is_active"),
    aiLabel: text("ai_label"),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
    gradeLevel: integer("grade_level"),
    language: varchar("language"),
    aiGuide: text("ai_guide"),
    files: json("files"),
});


import { TopicQuestionsStats, TopicPdfDetails } from "../domain/learning/Learning.entity";

export const providerSubjectTopics = pgTable("provider_subject_topics", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    description: text("description"),
    gradeLevel: bigint("grade_level", { mode: "number" }),
    name: text("name"),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),
    aiSummary: text("ai_summary"),
    isActiveAiGeneration: boolean("is_active_ai_generation").default(false),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    language: varchar("language"),
    aiGuide: text("ai_guide"),
    pdfDetails: jsonb("pdf_details").$type<TopicPdfDetails>(),
    questionsStats: jsonb("questions_stats").$type<TopicQuestionsStats>(),
    topicVector: vector768("topic_vector"), // 768-D embedding of name + description
}, (table) => {
    return {
        topicVectorIdx: index("topic_vector_idx").using("hnsw", sql`${table.topicVector} vector_cosine_ops`),
    };
});

export const providerQuestions = pgTable("provider_questions", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    question: text("question"),
    answers: json("answers"),
    correctAnswer: text("correct_answer"),
    authorAccountId: varchar("author_account_id").references(() => accounts.id),
    reviewerAccountId: varchar("reviewer_account_id").references(() => accounts.id),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),
    complexity: text("complexity"),
    gradeLevel: bigint("grade_level", { mode: "number" }),
    explanationGuide: json("explanation_guide"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    language: text("language"),
    workspaceId: varchar("workspace_id").references(() => workspaces.id),
    providerSubjectTopicId: varchar("provider_subject_topic_id").references(() => providerSubjectTopics.id),
    isPublished: boolean("is_published").default(false),
    aiGuide: text("ai_guide"),
    visualData: jsonb("visual_data"),
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
    aiGuide: text("ai_guide"),
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

export const studentQuizReports = pgTable("student_quiz_reports", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    quizId: varchar("quiz_id").notNull().references(() => studentQuizzes.id),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    reportText: text("report_text"),
    learningInsights: jsonb("learning_insights").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
}, (table) => {
    return {
        knowledgeVectorIdx: index("skh_knowledge_vector_idx").using("hnsw", sql`${table.knowledgeVector} vector_cosine_ops`),
    };
});

export const providerKnowledgeHubs = pgTable("provider_knowledge_hubs", {
    id: varchar("id").primaryKey().references(() => workspaces.id), // 1-to-1 with Workspace

    // Balanced Centroid Vector (The "Classroom DNA")
    sumVector: vector768("sum_vector"),
    studentCount: integer("student_count").default(0),
    totalEntries: integer("total_entries").default(0),
    metadata: jsonb("metadata").default({}),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        sumVectorIdx: index("pkh_sum_vector_idx").using("hnsw", sql`${table.sumVector} vector_cosine_ops`),
    };
});

export const providerKnowledgeDeltas = pgTable("provider_knowledge_deltas", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),

    // The "Change" (New student progress)
    deltaVector: vector768("delta_vector").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
    return {
        deltaVectorIdx: index("pkd_delta_vector_idx").using("hnsw", sql`${table.deltaVector} vector_cosine_ops`),
    };
});

// Student Knowledge Hub Entries (Granular log of all AI interactions — shard by student_account_id)
export const studentKnowledgeHubEntries = pgTable("student_knowledge_hub_entries", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),
    topicId: varchar("topic_id").references(() => providerSubjectTopics.id),

    sourceType: varchar("source_type").notNull(), // 'quiz_analysis' | 'term_deepdive' | 'homework_report' | 'topic_exploration'
    sourceId: varchar("source_id"),               // FK to student_quizzes, student_homeworks, etc.

    contentSummary: text("content_summary"),       // Human-readable AI response text
    contentVector: vector768("content_vector"),    // 768-D embedding of the content

    masterySignal: real("mastery_signal"),         // 0.0–1.0, AI-driven quality signal
    metadata: jsonb("metadata").default({}),       // { complexity, timeSpent, questionId, etc. }

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
    return {
        contentVectorIdx: index("skhe_content_vector_idx").using("hnsw", sql`${table.contentVector} vector_cosine_ops`),
    };
});

// Provider Knowledge Hub Entries (Aggregated from student entries — shard by provider_workspace_id)
export const providerKnowledgeHubEntries = pgTable("provider_knowledge_hub_entries", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    providerWorkspaceId: varchar("provider_workspace_id").notNull().references(() => workspaces.id),
    providerSubjectId: varchar("provider_subject_id").references(() => providerSubjects.id),
    topicId: varchar("topic_id").references(() => providerSubjectTopics.id),

    sourceType: varchar("source_type").notNull(),

    aggregatedVector: vector768("aggregated_vector"), // Averaged from student entries
    studentCount: integer("student_count").default(0),
    averageMasterySignal: real("average_mastery_signal"),
    metadata: jsonb("metadata").default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        aggregatedVectorIdx: index("pkhe_aggregated_vector_idx").using("hnsw", sql`${table.aggregatedVector} vector_cosine_ops`),
    };
});

// Provider Defined Goals (Default workspace goals for all students)
export const providerDefinedGoals = pgTable("provider_defined_goals", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    title: text("title").notNull(),
    description: text("description"),
    goalVector: vector768("goal_vector"),
    status: varchar("status").notNull().default("active"),
    deadline: timestamp("deadline", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        goalVectorIdx: index("pdg_goal_vector_idx").using("hnsw", sql`${table.goalVector} vector_cosine_ops`),
    };
});

// Topic targets for provider goals
export const providerGoalTopics = pgTable("provider_goal_topics", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    goalId: varchar("goal_id").notNull().references(() => providerDefinedGoals.id),
    topicId: varchar("topic_id").notNull().references(() => providerSubjectTopics.id),
    targetScore: real("target_score").notNull().default(85), // 0–100
});

// Student Defined Goals (Custom goals created by/for a specific student)
export const studentDefinedGoals = pgTable("student_defined_goals", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    studentAccountId: varchar("student_account_id").notNull().references(() => accounts.id),
    workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
    title: text("title").notNull(),
    description: text("description"),
    goalVector: vector768("goal_vector"),
    status: varchar("status").notNull().default("active"),
    deadline: timestamp("deadline", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        goalVectorIdx: index("sdg_goal_vector_idx").using("hnsw", sql`${table.goalVector} vector_cosine_ops`),
    };
});

// Topic targets for student custom goals
export const studentGoalTopics = pgTable("student_goal_topics", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    goalId: varchar("goal_id").notNull().references(() => studentDefinedGoals.id),
    topicId: varchar("topic_id").notNull().references(() => providerSubjectTopics.id),
    targetScore: real("target_score").notNull().default(85), // 0–100
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

export const docs = pgTable("docs", {
    id: varchar("id").primaryKey().$defaultFn(() => generateSlimId()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    type: varchar("type").unique(),
    localizedContent: jsonb("localized_content").$type<LocalizedContent>().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const aiSystemGuides = pgTable("ai_system_guides", {
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
    payload: jsonb("payload").$type<{ type?: string; message: string; link?: string; metadata?: Record<string, unknown> }>().default(sql`'{}'`),
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
    changeSummary: jsonb("change_summary").$type<{ before?: Record<string, unknown>; after?: Record<string, unknown>; ip?: string; extra?: Record<string, unknown> }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

