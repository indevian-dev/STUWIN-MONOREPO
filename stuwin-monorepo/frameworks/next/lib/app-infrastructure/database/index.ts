import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ═══════════════════════════════════════════════════════════════
// DRIZZLE DATABASE CLIENT (POSTGRES)
// ═══════════════════════════════════════════════════════════════

// For edge environments or Bun, postgres-js is recommended
const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
// Helper type for Transaction or Database
export type DbClient = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

// ═══════════════════════════════════════════════════════════════
// TABLE NAME CONSTANTS (FOR BACKWARD COMPATIBILITY IF NEEDED)
// ═══════════════════════════════════════════════════════════════

export const USERS = "users";
export const ACCOUNTS = "accounts";
export const OTPS = "account_otps";
export const WORKSPACES = "workspaces";
export const MEMBERSHIPS = "workspace_memberships";
export const ROLES = "workspace_roles";
export const SUBJECTS = "learning_subjects";
export const TOPICS = "learning_subject_topics";
export const QUESTIONS = "questions";
export const QUIZZES = "student_quizzes";
export const BLOGS = "blogs";
export const PAGES = "pages";
export const PROMPTS = "system_prompts";
export const NOTIFICATIONS = "account_notifications";
export const BOOKMARKS = "account_bookmarks";
export const LEARNING_CONVERSATIONS = "student_learning_sessions";
export const HOMEWORKS = "student_homeworks";
export const CITIES = "cities";
export const COUNTRIES = "countries";

export const ORGANIZATIONS = "organizations";
export const APPLICATIONS = "provider_applications";
export const ORG_PLATFORM = "org_platform";

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { schema };
