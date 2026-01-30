
import type { EndpointsMap } from "@/types";
import { createRouteFactory } from "../../RouteFactory";

// Create provider-specific endpoint factory
// Unified for all Provider / Provideranization activity
const createProviderEndpoint = createRouteFactory({
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
// ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export const providerEndpoints: EndpointsMap = {
  // ============================================
  // Provider / Main Dashboard
  // ============================================
  "/workspaces/provider/:workspaceId": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_ACCESS",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/stats": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_STATS_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/analytics": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_ANALYTICS_READ",
    type: "page",
  }),

  // ============================================
  // Provider Dashboard & Mgmt (Merged)
  // ============================================
  "/providers": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ACCESS", type: "page" }),

  // Organization Details
  "/workspaces/provider/:workspaceId/organization": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ORG_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/organization/edit": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ORG_UPDATE", type: "page" }),
  "/api/workspaces/provider/:workspaceId/organization": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ORG_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/organization/update": createProviderEndpoint({ method: "PUT", authRequired: true, permission: "PROVIDER_ORG_UPDATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/organization/media/upload": createProviderEndpoint({ method: "POST", authRequired: true, permission: "PROVIDER_ORG_MEDIA_UPLOAD", type: "api" }),
  "/api/workspaces/provider/:workspaceId/organization/media/delete/:id": createProviderEndpoint({ method: "DELETE", authRequired: true, permission: "PROVIDER_ORG_MEDIA_DELETE", type: "api" }),

  // Students
  "/workspaces/provider/:workspaceId/students": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/students/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/students/create": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_CREATE", type: "page" }),
  "/workspaces/provider/:workspaceId/students/invite": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_INVITE", type: "page" }),
  "/api/workspaces/provider/:workspaceId/students": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STUDENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/create": createProviderEndpoint({ method: "POST", authRequired: true, permission: "PROVIDER_STUDENT_CREATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/update/:id": createProviderEndpoint({ method: "PUT", authRequired: true, permission: "PROVIDER_STUDENT_UPDATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/delete/:id": createProviderEndpoint({ method: "DELETE", authRequired: true, permission: "PROVIDER_STUDENT_DELETE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/students/invite": createProviderEndpoint({ method: "POST", authRequired: true, permission: "PROVIDER_STUDENT_INVITE", type: "api" }),

  // Assignments
  "/workspaces/provider/:workspaceId/assignments": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/assignments/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/assignments/create": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_CREATE", type: "page" }),
  "/api/workspaces/provider/:workspaceId/assignments": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_ASSIGNMENT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/create": createProviderEndpoint({ method: "POST", authRequired: true, permission: "PROVIDER_ASSIGNMENT_CREATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/update/:id": createProviderEndpoint({ method: "PUT", authRequired: true, permission: "PROVIDER_ASSIGNMENT_UPDATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/delete/:id": createProviderEndpoint({ method: "DELETE", authRequired: true, permission: "PROVIDER_ASSIGNMENT_DELETE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/submit/:id": createProviderEndpoint({ method: "POST", authRequired: true, permission: "PROVIDER_ASSIGNMENT_SUBMIT", type: "api" }),
  "/api/workspaces/provider/:workspaceId/assignments/grade/:id": createProviderEndpoint({ method: "POST", authRequired: true, permission: "PROVIDER_ASSIGNMENT_GRADE", type: "api" }),

  // Progress
  "/workspaces/provider/:workspaceId/progress": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/progress/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_READ", type: "page" }),
  "/api/workspaces/provider/:workspaceId/progress": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/progress/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/progress/export": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_PROGRESS_EXPORT", type: "api" }),

  // Reports
  "/workspaces/provider/:workspaceId/reports": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_REPORT_READ", type: "page" }),
  "/api/workspaces/provider/:workspaceId/reports": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_REPORT_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/reports/generate": createProviderEndpoint({ method: "POST", authRequired: true, permission: "PROVIDER_REPORT_GENERATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/reports/export/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_REPORT_EXPORT", type: "api" }),

  // Staff
  "/workspaces/provider/:workspaceId/staff": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/staff/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_READ", type: "page" }),
  "/workspaces/provider/:workspaceId/staff/create": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_CREATE", type: "page" }),
  "/api/workspaces/provider/:workspaceId/staff": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/staff/:id": createProviderEndpoint({ method: "GET", authRequired: true, permission: "PROVIDER_STAFF_READ", type: "api" }),
  "/api/workspaces/provider/:workspaceId/staff/create": createProviderEndpoint({ method: "POST", authRequired: true, permission: "PROVIDER_STAFF_CREATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/staff/update/:id": createProviderEndpoint({ method: "PUT", authRequired: true, permission: "PROVIDER_STAFF_UPDATE", type: "api" }),
  "/api/workspaces/provider/:workspaceId/staff/delete/:id": createProviderEndpoint({ method: "DELETE", authRequired: true, permission: "PROVIDER_STAFF_DELETE", type: "api" }),

  // ============================================
  // Quizzes (Provider)
  // ============================================
  "/workspaces/provider/:workspaceId/quizzes": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/quizzes/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/quizzes/create": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_CREATE",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/quizzes/update/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_UPDATE",
    type: "page",
  }),

  // Quizzes APIs
  "/api/workspaces/provider/:workspaceId/quizzes": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/quizzes/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUIZ_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/quizzes/create": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUIZ_CREATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/quizzes/update/:id": createProviderEndpoint({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_QUIZ_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/quizzes/delete/:id": createProviderEndpoint({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_QUIZ_DELETE",
    type: "api",
  }),

  // ============================================
  // Media APIs
  // ============================================
  "/api/workspaces/provider/:workspaceId/media/upload": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/media/delete/:id": createProviderEndpoint({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_MEDIA_DELETE",
    type: "api",
  }),

  // ============================================
  // Stats APIs
  // ============================================
  "/api/workspaces/provider/:workspaceId/stats": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_STATS_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/analytics": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_ANALYTICS_READ",
    type: "api",
  }),

  // ============================================
  // Subjects
  // ============================================
  "/workspaces/provider/:workspaceId/subjects": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/subjects/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "page",
  }),
  "/api/workspaces/provider/:workspaceId/subjects": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/update": createProviderEndpoint({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/cover": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs/upload": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs/save": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs/:id": createProviderEndpoint({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/pdfs/:id/delete": createProviderEndpoint({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_SUBJECT_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/create": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_CREATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/reorder": createProviderEndpoint({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_TOPIC_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/:id/update": createProviderEndpoint({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_TOPIC_UPDATE",
    collectActionLogs: true,
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/:id/generate-tests": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_GENERATE",
    collectActionLogs: true,
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/subjects/:id/topics/:id/questions/create": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_CREATE",
    collectActionLogs: true,
    type: "api",
  }),

  // ============================================
  // Topics
  // ============================================
  "/workspaces/provider/:workspaceId/topics": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/topics/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/topics/create": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_CREATE",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/topics/update/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_UPDATE",
    type: "page",
  }),
  "/api/workspaces/provider/:workspaceId/topics": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_TOPIC_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/create": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_CREATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/update/:id": createProviderEndpoint({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_TOPIC_UPDATE",
    collectActionLogs: true,
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/delete/:id": createProviderEndpoint({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_TOPIC_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/media/upload/:id": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/media/delete/:id": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/media/upload-url/:id": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/media/save-pdf/:id": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/upload-pdf": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/topics/analyze-book": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_TOPIC_CREATE",
    type: "api",
  }),

  // ============================================
  // Questions
  // ============================================
  "/workspaces/provider/:workspaceId/questions": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/questions/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/questions/create": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_CREATE",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/questions/update/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_UPDATE",
    type: "page",
  }),
  "/workspaces/provider/:workspaceId/questions/generate": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_GENERATE",
    type: "page",
  }),
  "/api/workspaces/provider/:workspaceId/questions": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/:id": createProviderEndpoint({
    method: "GET",
    authRequired: true,
    permission: "PROVIDER_QUESTION_READ",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/create": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_CREATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/update/:id": createProviderEndpoint({
    method: "PUT",
    authRequired: true,
    permission: "PROVIDER_QUESTION_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/delete/:id": createProviderEndpoint({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_QUESTION_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/media/upload/:id": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_MEDIA_UPLOAD",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/media/delete/:id": createProviderEndpoint({
    method: "DELETE",
    authRequired: true,
    permission: "PROVIDER_QUESTION_MEDIA_DELETE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/generate": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_GENERATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/submit/:id": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_SUBMIT",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/publish/:id": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_SUBMIT",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/sync/:id": createProviderEndpoint({
    method: "POST",
    authRequired: true,
    permission: "PROVIDER_QUESTION_UPDATE",
    type: "api",
  }),
  "/api/workspaces/provider/:workspaceId/questions/queue": createProviderEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
};
