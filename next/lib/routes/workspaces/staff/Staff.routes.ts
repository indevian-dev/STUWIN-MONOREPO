// ═══════════════════════════════════════════════════════════════
// STAFF ENDPOINT CONFIGURATION
// Supports multiple HTTP methods per path via method array or object
// ═══════════════════════════════════════════════════════════════

import type { RoutesMap } from "@/lib/routes/Route.types";
import { createRouteFactory } from "../../Route.factory";

// Create staff-specific endpoint factory
const createRoute = createRouteFactory({
  workspace: 'staff',
  needEmailVerification: true,
  needPhoneVerification: true
});

// Permission descriptions for the staff
export const PERMISSIONS = {
  // Account permissions
  STAFF_ACCOUNT_READ: "View account information",
  STAFF_ACCOUNT_CREATE: "Create new accounts",
  STAFF_ACCOUNT_UPDATE: "Update account information",
  STAFF_ACCOUNT_DELETE: "Delete accounts",
  STAFF_ACCOUNT_MEDIA_UPLOAD: "Upload account media files",
  STAFF_ACCOUNT_MEDIA_DELETE: "Delete account media files",

  // User permissions
  STAFF_USER_READ: "View user information",
  STAFF_USER_CREATE: "Create new users",
  STAFF_USER_UPDATE: "Update user information",
  STAFF_USER_DELETE: "Delete users",
  STAFF_USER_MEDIA_UPLOAD: "Upload user media files",
  STAFF_USER_MEDIA_DELETE: "Delete user media files",
  STAFF_USER_RESET_PASSWORD: "Reset user passwords",
  STAFF_USER_SWITCH_ACCOUNT: "Switch to user accounts",

  // Subject permissions
  STAFF_SUBJECT_READ: "View subjects",
  STAFF_SUBJECT_CREATE: "Create new subjects",
  STAFF_SUBJECT_UPDATE: "Update subjects",
  STAFF_SUBJECT_DELETE: "Delete subjects",
  STAFF_SUBJECT_MEDIA_UPLOAD: "Upload subject media files",
  STAFF_SUBJECT_MEDIA_DELETE: "Delete subject media files",

  // Topic permissions
  STAFF_TOPIC_READ: "View topics",
  STAFF_TOPIC_CREATE: "Create new topics",
  STAFF_TOPIC_UPDATE: "Update topics",
  STAFF_TOPIC_DELETE: "Delete topics",

  // Role permissions
  STAFF_ROLE_READ: "View roles",
  STAFF_ROLE_CREATE: "Create new roles",
  STAFF_ROLE_UPDATE: "Update roles and permissions",
  STAFF_ROLE_DELETE: "Delete roles",

  // Question permissions
  STAFF_QUESTION_READ: "View questions",
  STAFF_QUESTION_CREATE: "Create new questions",
  STAFF_QUESTION_UPDATE: "Update questions",
  STAFF_QUESTION_DELETE: "Delete questions",
  STAFF_QUESTION_MEDIA_UPLOAD: "Upload question media files",
  STAFF_QUESTION_MEDIA_DELETE: "Delete question media files",
  STAFF_QUESTION_MEDIA_UPDATE: "Update question media files",
  STAFF_QUESTION_GENERATE: "Generate questions with AI",
  STAFF_QUESTION_APPROVE: "Approve questions for publishing",
  STAFF_QUESTION_SYNC: "Sync questions to search",
  STAFF_QUESTION_PUBLISH: "Publish questions",
  STAFF_QUESTION_BULK_OPERATIONS: "Bulk question operations",

  // Provider permissions
  STAFF_PROVIDER_READ: "View provider organizations",
  STAFF_PROVIDER_CREATE: "Create provider organizations",
  STAFF_PROVIDER_UPDATE: "Update provider organizations",
  STAFF_PROVIDER_DELETE: "Delete provider organizations",
  STAFF_PROVIDER_APPLICATION_READ: "View provider applications",
  STAFF_PROVIDER_APPLICATION_CREATE: "Create provider applications",
  STAFF_PROVIDER_APPLICATION_UPDATE: "Update provider applications",
  STAFF_PROVIDER_APPLICATION_DELETE: "Delete provider applications",
  STAFF_PROVIDER_APPLICATION_APPROVE: "Approve provider applications",
  STAFF_PROVIDER_APPLICATION_REJECT: "Reject provider applications",
  STAFF_PROVIDER_MEDIA_UPLOAD: "Upload provider media files",
  STAFF_PROVIDER_MEDIA_DELETE: "Delete provider media files",

  // City permissions
  STAFF_CITY_READ: "View cities",
  STAFF_CITY_CREATE: "Create new cities",
  STAFF_CITY_UPDATE: "Update cities",
  STAFF_CITY_DELETE: "Delete cities",

  // Pages/Docs permissions
  STAFF_PAGE_READ: "View pages and documents",
  STAFF_PAGE_UPDATE: "Update pages and documents",
  STAFF_DOCS_READ: "View documentation",
  STAFF_DOCS_UPDATE: "Update documentation",

  // Mail permissions
  STAFF_MAIL_READ: "View mail configuration",
  STAFF_MAIL_STATUS: "View mail service status",
  STAFF_MAIL_SEND: "Send emails",
  STAFF_MAIL_TEST: "Send test emails",
  STAFF_MAIL_CONFIG: "Configure mail settings",

  // Background Jobs permissions
  STAFF_JOBS_READ: "View background jobs and logs",
  STAFF_JOBS_CONTROL: "Control background jobs (pause/resume/trigger)",

  // Payment & Subscription permissions
  STAFF_PAYMENT_MANAGE: "Manage payments, subscriptions and coupons",

  // General staff access
  STAFF_ACCESS: "Access staff dashboard",
} as const;

// Merge all staff endpoints (APIs and pages)
export const staffRoutes: RoutesMap = {
  // ============================================
  // Staff Pages and APIs
  // ============================================

  // ============================================
  // Staff - Roles Pages
  // ============================================
  "/workspaces/staff/:workspaceId/roles": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ROLE_READ",
    type: "page",
  }),

  // ============================================
  // Staff - Accounts Pages
  // ============================================

  "/workspaces/staff/:workspaceId": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/accounts": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCOUNT_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/accounts/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCOUNT_READ",
    type: "page",
  }),

  // ============================================
  // Staff - Accounts APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/accounts": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCOUNT_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/accounts/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCOUNT_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/accounts/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_ACCOUNT_CREATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/accounts/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_ACCOUNT_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/accounts/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_ACCOUNT_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/accounts/media/upload/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_ACCOUNT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/accounts/media/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_ACCOUNT_MEDIA_DELETE",
    type: "api",
  }),

  // ============================================
  // Staff - Users Pages
  // ============================================
  "/workspaces/staff/:workspaceId/users": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/users/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/users/update/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/users/delete/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_DELETE",
    type: "page",
  }),

  // ============================================
  // Staff - Users APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/users": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_USER_CREATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/update": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_USER_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_USER_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/delete": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_USER_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_USER_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/assign-provider": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_USER_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/media/upload/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_USER_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/media/delete/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_USER_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/reset-password/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_USER_RESET_PASSWORD",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/switch-account/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_USER_SWITCH_ACCOUNT",
    type: "api",
  }),

  // ============================================
  // Staff - Questions Pages
  // ============================================
  "/workspaces/staff/:workspaceId/questions": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/questions/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/questions/create": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_CREATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/questions/update/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/questions/delete/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_DELETE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/questions/generate": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_GENERATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/quizzes": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/quizzes/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/quizzes/update/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/quizzes/delete/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_DELETE",
    type: "page",
  }),

  // ============================================
  // Staff - Questions APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/questions": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_QUESTION_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_QUESTION_CREATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_QUESTION_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_QUESTION_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/media/upload/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_QUESTION_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/media/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_QUESTION_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/generate": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_QUESTION_GENERATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/submit/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_QUESTION_SUBMIT",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/publish/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_QUESTION_PUBLISH",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/sync/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_QUESTION_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/queue": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/questions/bulk-operations": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_QUESTION_BULK_OPERATIONS",
    type: "api",
  }),

  // ============================================
  // Staff - Providers Pages
  // ============================================
  "/workspaces/staff/:workspaceId/providers": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/providers/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/providers/update/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/providers/delete/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_DELETE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/providers/applications": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_APPLICATION_READ",
    type: "page",
  }),

  // ============================================
  // Staff - Providers APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/providers": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_PROVIDER_CREATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_PROVIDER_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_PROVIDER_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/media/upload/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_PROVIDER_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/media/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_PROVIDER_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/applications": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_APPLICATION_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/applications/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PROVIDER_APPLICATION_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/applications/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_PROVIDER_APPLICATION_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/applications/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_PROVIDER_APPLICATION_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/applications/approve/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_PROVIDER_APPLICATION_APPROVE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/providers/applications/reject/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_PROVIDER_APPLICATION_REJECT",
    type: "api",
  }),

  // Main staff APIs (from staff_apis.ts)

  // ============================================
  // Staff - Subjects APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/subjects": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_SUBJECT_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/subjects/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_SUBJECT_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/subjects/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_SUBJECT_CREATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/subjects/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_SUBJECT_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/subjects/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_SUBJECT_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/subjects/media/upload/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/subjects/media/delete/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_SUBJECT_MEDIA_DELETE",
    type: "api",
  }),

  // ============================================
  // Staff - Subjects Pages
  // ============================================
  "/workspaces/staff/:workspaceId/subjects": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_SUBJECT_READ",
    type: "page",
  }),

  // ============================================
  // Staff - Topics APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/topics": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/topics/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/topics/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_TOPIC_CREATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/topics/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_TOPIC_UPDATE",
    collectActionLogs: true,
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/topics/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_TOPIC_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/topics/media/upload-url/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_TOPIC_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/topics/media/save-pdf/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_TOPIC_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/topics/media/delete/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_TOPIC_UPDATE",
    type: "api",
  }),

  // ============================================
  // Staff - Roles APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/roles": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ROLE_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/roles/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ROLE_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/roles/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_ROLE_CREATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/roles/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_ROLE_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/roles/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_ROLE_DELETE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/roles/:id/permissions": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_ROLE_UPDATE",
    twoFactorAuth: true,
    twoFactorAuthType: "email",
    type: "api",
  }),

  // ============================================
  // Staff - Cities APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/cities": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_CITY_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/cities/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_CITY_CREATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/cities/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_CITY_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/cities/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_CITY_DELETE",
    type: "api",
  }),

  // ============================================
  // Staff - Pages/Docs APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/docs": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_READ",
    type: "api",
  }),


  "/api/workspaces/staff/:workspaceId/docs/update": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_PAGE_UPDATE",
    type: "api",
  }),
  // ============================================
  // Staff - Blogs Pages
  // ============================================
  "/workspaces/staff/:workspaceId/blogs": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_READ",
    type: "page",
  }),

  // ============================================
  // Staff - Blogs APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/blogs": createRoute({
    method: ["GET", "POST"],
    authRequired: true,
    permission: "STAFF_PAGE_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/blogs/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/blogs/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_PAGE_UPDATE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/blogs/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_PAGE_UPDATE",
    type: "api",
  }),

  // ============================================
  // Staff - AI Lab Pages
  // ============================================
  "/workspaces/staff/:workspaceId/ai-lab": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),

  // ============================================
  // Staff - Prompts APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/ai-lab/prompts": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/ai-lab/prompts/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),

  // ============================================
  // Staff - Mail APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/mail/config": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_MAIL_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/mail/status": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_MAIL_STATUS",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/mail/send": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_MAIL_SEND",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/mail/test": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_MAIL_TEST",
    type: "api",
  }),

  // ============================================
  // Staff - Background Jobs APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/jobs": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_JOBS_READ",
    type: "api",
  }),

  // ============================================
  // Staff - Payments & Coupons APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/payments/coupons": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAYMENT_MANAGE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/payments/coupons/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_PAYMENT_MANAGE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/payments/coupons/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_PAYMENT_MANAGE",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/payments/coupons/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_PAYMENT_MANAGE",
    type: "api",
  }),

  // ============================================
  // Staff - Payments & Coupons Pages
  // ============================================
  "/workspaces/staff/:workspaceId/payments/coupons": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAYMENT_MANAGE",
    type: "page",
  }),

  // ============================================
  // Staff - Background Jobs APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/jobs/control": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_JOBS_CONTROL",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/jobs/logs": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_JOBS_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/jobs/stats": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_JOBS_READ",
    type: "api",
  }),

  // ============================================
  // Staff Pages
  // ============================================
  "/staff": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/cities": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_CITY_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/cities/create": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_CITY_CREATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/cities/update/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_CITY_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/cities/delete/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_CITY_DELETE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/faq": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/terms": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/privacy": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/about": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/rules": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_PAGE_UPDATE",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/mail": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_MAIL_READ",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/jobs": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_JOBS_READ",
    type: "page",
  }),

  // ============================================
  // Staff - Account Search & Workspace Management APIs
  // ============================================
  "/api/workspaces/staff/:workspaceId/accounts/search": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCOUNT_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/accounts/:id/workspaces": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCOUNT_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/memberships/add-staff": createRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_ACCOUNT_CREATE",
    twoFactorAuth: true,
    twoFactorAuthType: "email",
    type: "api",
  }),

  // ============================================
  // Staff - Workspace Management Pages
  // ============================================
  "/workspaces/staff/:workspaceId/manage-workspaces": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCOUNT_READ",
    type: "page",
  }),
};
