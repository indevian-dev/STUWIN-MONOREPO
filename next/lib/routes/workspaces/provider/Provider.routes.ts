
import type { RoutesMap } from "@/lib/routes/Route.types";
import { createRouteFactory } from "../../Route.factory";

// Create provider-specific endpoint factory
// Unified for all Provider / Provideranization activity
const createRoute = createRouteFactory({
  workspace: 'provider',
  needEmailVerification: true,
  needPhoneVerification: true
});

// ═══════════════════════════════════════════════════════════════
// PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const PERMISSIONS = {
  // ─── Provider / Content Permissions ───
  PROVIDER_SUBJECT_READ: "View subjects",
  PROVIDER_SUBJECT_UPDATE: "Update subjects",
  PROVIDER_SUBJECT_DELETE: "Delete subjects",
  PROVIDER_SUBJECT_MEDIA_UPLOAD: "Upload subject media files",
  PROVIDER_SUBJECT_MEDIA_DELETE: "Delete subject media files",

  PROVIDER_TOPIC_READ: "View topics",
  PROVIDER_TOPIC_CREATE: "Create new topics",
  PROVIDER_TOPIC_UPDATE: "Update topics",
  PROVIDER_TOPIC_DELETE: "Delete topics",
  PROVIDER_TOPIC_MEDIA_UPLOAD: "Upload topic media files",
  PROVIDER_TOPIC_MEDIA_DELETE: "Delete topic media files",

  PROVIDER_QUESTION_READ: "View questions",
  PROVIDER_QUESTION_CREATE: "Create new questions",
  PROVIDER_QUESTION_UPDATE: "Update questions",
  PROVIDER_QUESTION_DELETE: "Delete questions",
  PROVIDER_QUESTION_MEDIA_UPLOAD: "Upload question media files",
  PROVIDER_QUESTION_MEDIA_DELETE: "Delete question media files",
  PROVIDER_QUESTION_GENERATE: "Generate questions with AI",
  PROVIDER_QUESTION_VISUAL_GENERATE: "Generate 3D/2D visuals for questions",
  PROVIDER_QUESTION_SUBMIT: "Submit questions for review",

  PROVIDER_QUIZ_READ: "View quizzes",
  PROVIDER_QUIZ_CREATE: "Create new quizzes",
  PROVIDER_QUIZ_UPDATE: "Update quizzes",
  PROVIDER_QUIZ_DELETE: "Delete quizzes",

  PROVIDER_MEDIA_UPLOAD: "Upload media files",
  PROVIDER_MEDIA_DELETE: "Delete media files",

  PROVIDER_STATS_READ: "View content statistics",
  PROVIDER_ANALYTICS_READ: "View content analytics",
  PROVIDER_ACCESS: "Access provider dashboard",

  // ─── Provider / Management Permissions ───
  PROVIDER_ORG_READ: "View organization information",
  PROVIDER_ORG_UPDATE: "Update organization information",
  PROVIDER_ORG_MEDIA_UPLOAD: "Upload organization media files",
  PROVIDER_ORG_MEDIA_DELETE: "Delete organization media files",

  PROVIDER_STUDENT_READ: "View students",
  PROVIDER_STUDENT_CREATE: "Create student accounts",
  PROVIDER_STUDENT_UPDATE: "Update student information",
  PROVIDER_STUDENT_DELETE: "Delete students",
  PROVIDER_STUDENT_INVITE: "Invite students",

  PROVIDER_ASSIGNMENT_READ: "View assignments",
  PROVIDER_ASSIGNMENT_CREATE: "Create new assignments",
  PROVIDER_ASSIGNMENT_UPDATE: "Update assignments",
  PROVIDER_ASSIGNMENT_DELETE: "Delete assignments",
  PROVIDER_ASSIGNMENT_SUBMIT: "Submit assignments",
  PROVIDER_ASSIGNMENT_GRADE: "Grade assignments",

  PROVIDER_PROGRESS_READ: "View student progress",
  PROVIDER_PROGRESS_EXPORT: "Export progress data",

  PROVIDER_REPORT_READ: "View reports",
  PROVIDER_REPORT_GENERATE: "Generate reports",
  PROVIDER_REPORT_EXPORT: "Export reports",

  PROVIDER_CONTENT_READ: "View content library",
  PROVIDER_CONTENT_ASSIGN: "Assign content to students",

  PROVIDER_STAFF_READ: "View organization staff",
  PROVIDER_STAFF_CREATE: "Add staff members",
  PROVIDER_STAFF_UPDATE: "Update staff information",
  PROVIDER_STAFF_DELETE: "Remove staff members",

  PROVIDER_ACCESS_DASHBOARD: "Access provider dashboard",
} as const;

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

export const providerRoutes: RoutesMap = {
  // ============================================
  // Provider / Main Dashboard
  // ============================================
  "/workspaces/provider/:workspaceId": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_ACCESS",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/stats": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_STATS_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/analytics": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_ANALYTICS_READ",
    type: "page",
  }),

  // ============================================
  // Provider Dashboard & Mgmt (Merged)
  // ============================================
  "/providers": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_ACCESS", type: "page" }),

  // Organization Details
  "/workspaces/provider/:workspaceId/organization": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_ORG_READ", type: "page" }),
  "/api/workspaces/provider/:workspaceId/organization": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_ORG_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/organization/update": createRoute({ method: "PUT", authRequired: true, permission: "PROVIDER_ORG_UPDATE", twoFactorAuth: true, twoFactorAuthType: "email", type: "api" }),
  "/api/workspaces/provider/:workspaceId/organization/media/upload": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_ORG_MEDIA_UPLOAD", type: "api" }),
  "/api/workspaces/provider/:workspaceId/organization/media/delete/:id": createRoute({ method: "DELETE", authRequired: true, permission: "PROVIDER_ORG_MEDIA_DELETE", type: "api" }),

  // Students
  "/workspaces/provider/:workspaceId/students": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/students/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/students/create": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_CREATE", type: "page" }),
  "/workspaces/provider/:workspaceId/students/invite": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_INVITE", type: "page" }),
  "/api/workspaces/provider/:workspaceId/students": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/create": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_STUDENT_CREATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/update/:id": createRoute({ method: "PUT", authRequired: true, permission: "PROVIDER_STUDENT_UPDATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/delete/:id": createRoute({ method: "DELETE", authRequired: true, permission: "PROVIDER_STUDENT_DELETE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/invite": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_STUDENT_INVITE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/invitations": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/invitations/send": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_STAFF_CREATE", type: "api" }),

  // Assignments
  "/workspaces/provider/:workspaceId/assignments": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/assignments/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/assignments/create": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_CREATE", type: "page" }),
  "/api/workspaces/provider/:workspaceId/assignments": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/create": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_ASSIGNMENT_CREATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/update/:id": createRoute({ method: "PUT", authRequired: true, permission: "PROVIDER_ASSIGNMENT_UPDATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/delete/:id": createRoute({ method: "DELETE", authRequired: true, permission: "PROVIDER_ASSIGNMENT_DELETE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/submit/:id": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_ASSIGNMENT_SUBMIT", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/grade/:id": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_ASSIGNMENT_GRADE", type: "api" }),

  // Progress
  "/workspaces/provider/:workspaceId/progress": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/progress/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_READ", type: "page" }),
  "/api/workspaces/provider/:workspaceId/progress": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/progress/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/progress/export": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_EXPORT", type: "api" }),

  // Reports
  "/workspaces/provider/:workspaceId/reports": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_REPORT_READ", type: "page" }),
  "/api/workspaces/provider/:workspaceId/reports": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_REPORT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/reports/generate": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_REPORT_GENERATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/reports/export/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_REPORT_EXPORT", type: "api" }),

  // Staff
  "/workspaces/provider/:workspaceId/staff": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/staff/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/staff/create": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_CREATE", type: "page" }),
  "/api/workspaces/provider/:workspaceId/staff": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/staff/:id": createRoute({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/staff/create": createRoute({ method: "POST", authRequired: true, permission: "PROVIDER_STAFF_CREATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/staff/update/:id": createRoute({ method: "PUT", authRequired: true, permission: "PROVIDER_STAFF_UPDATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/staff/delete/:id": createRoute({ method: "DELETE", authRequired: true, permission: "PROVIDER_STAFF_DELETE", type: "api" }),

  // ============================================
  // Quizzes (Provider)
  // ============================================
  "/workspaces/provider/:workspaceId/quizzes": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/quizzes/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/quizzes/create": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_CREATE",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/quizzes/update/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_UPDATE",
    type: "page",
  }),

  // Quizzes APIs
  "/api/workspaces/provider/:workspaceId/quizzes": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/quizzes/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/quizzes/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUIZ_CREATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/quizzes/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_QUIZ_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/quizzes/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_QUIZ_DELETE",
    type: "api",
  }),

  // ============================================
  // Media APIs
  // ============================================
  "/api/workspaces/provider/:workspaceId/media/upload": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/media/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_MEDIA_DELETE",
    type: "api",
  }),

  // ============================================
  // Stats APIs
  // ============================================
  "/api/workspaces/provider/:workspaceId/stats": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_STATS_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/analytics": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_ANALYTICS_READ",
    type: "api",
  }),

  // ============================================
  // Subjects
  // ============================================
  "/workspaces/provider/:workspaceId/subjects": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/subjects/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "page",
  }),
  "/api/workspaces/provider/:workspaceId/subjects": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/update": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/cover": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs/upload": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs/save": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs/:id/delete": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_CREATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/:id/update": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_TOPIC_UPDATE",
    collectActionLogs: true,
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/:id/generate-tests": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_GENERATE",
    collectActionLogs: true,
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/:id/questions/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_CREATE",
    collectActionLogs: true,
    type: "api",
  }),

  // ============================================
  // Topics
  // ============================================
  "/workspaces/provider/:workspaceId/topics": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/topics/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/topics/create": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_CREATE",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/topics/update/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_UPDATE",
    type: "page",
  }),
  "/api/workspaces/provider/:workspaceId/topics": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_CREATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_TOPIC_UPDATE",
    collectActionLogs: true,
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_TOPIC_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/media/upload/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/media/delete/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/media/upload-url/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/media/save-pdf/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/upload-pdf": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/analyze-book": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_CREATE",
    type: "api",
  }),

  // ============================================
  // Questions
  // ============================================
  "/workspaces/provider/:workspaceId/questions": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/questions/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/questions/create": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_CREATE",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/questions/update/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_UPDATE",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/questions/generate": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_GENERATE",
    type: "page",
  }),
  "/api/workspaces/provider/:workspaceId/questions": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/create": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_CREATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_QUESTION_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_QUESTION_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/media/upload/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/media/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_QUESTION_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/generate": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_GENERATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/submit/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_SUBMIT",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/publish/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_SUBMIT",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/sync/:id": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/queue": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/:id/generate-visual": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_GENERATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/:id/visual": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/:id/visual/save": createRoute({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_QUESTION_GENERATE",
    type: "api",
  }),

  // ============================================
  // Provider - Members Management
  // ============================================
  "/workspaces/provider/:workspaceId/members": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_STAFF_READ",
    type: "page",
  }),
  "/api/workspaces/provider/:workspaceId/members": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_STAFF_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/members/search": createRoute({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_STAFF_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/members/add": createRoute({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_STAFF_CREATE",
    type: "api",
  }),
};
