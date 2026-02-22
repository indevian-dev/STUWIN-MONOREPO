// ═══════════════════════════════════════════════════════════════
// STUDENTS ENDPOINT CONFIGURATION
// For student users accessing educational content and taking quizzes
// ═══════════════════════════════════════════════════════════════

import type { RoutesMap } from "@/lib/routes/Route.types";
import { createRouteFactory } from "../../Route.factory";

// Create student-specific endpoint factory
const createRoute = createRouteFactory({
  workspace: "student",
  needEmailVerification: true,
  needPhoneVerification: true
});

// Student Permission Declarations
export const PERMISSIONS = {
  // General access
  STUDENT_ACCESS: "Access student dashboard",
  STUDENT_ACCOUNT_READ: "View own account",

  // Provider interactions
  STUDENT_PROVIDER_READ: "View providers",
  STUDENT_PROVIDER_APPLICATION_READ: "View applications",
  STUDENT_PROVIDER_APPLICATION_CREATE: "Create applications",

  // Learning content
  STUDENT_QUESTION_READ: "View questions",
  STUDENT_QUIZ_TAKE: "Take quizzes",
  STUDENT_QUIZ_READ: "View quiz results",

  // AI learning sessions
  STUDENT_LEARNING_READ: "View learning conversations",
  STUDENT_LEARNING_CREATE: "Start learning conversations",
  STUDENT_LEARNING_UPDATE: "Send messages",

  // Homework
  STUDENT_HOMEWORK_READ: "View homework",
  STUDENT_HOMEWORK_CREATE: "Create homework",
  STUDENT_HOMEWORK_UPDATE: "Update homework",
  STUDENT_HOMEWORK_DELETE: "Delete homework",

  // Progress & Goals
  STUDENT_PROGRESS_READ: "View own progress and mastery",
  STUDENT_GOALS_READ: "View own learning goals",
} as const;

// Merge all student endpoints (APIs and pages)
export const studentRoutes: RoutesMap = {
  // ============================================
  // Student Pages and APIs
  // ============================================
  // Main student dashboard
  "/workspaces/student/:workspaceId": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_ACCESS",
    type: "page",
  }),

  // Legacy student redirect
  "/student": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_ACCESS",
    type: "page",
  }),

  // ============================================
  // Student - Accounts Pages
  // ============================================
  "/workspaces/student/:workspaceId/accounts/me": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_ACCOUNT_READ",
    type: "page",
  }),

  // ============================================
  // Student - Accounts APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/accounts": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/update": createRoute({
    method: "PATCH",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/delete": createRoute({
    method: "DELETE",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/media/upload": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/media/delete": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/me": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/me/update": createRoute({
    method: "PATCH",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/me/logout-session": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Providers Pages
  // ============================================
  "/workspaces/student/:workspaceId/providers": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_PROVIDER_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/providers/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_PROVIDER_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/providers/applications": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_PROVIDER_APPLICATION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/providers/applications/create": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_PROVIDER_APPLICATION_CREATE",
    type: "page",
  }),

  // ============================================
  // Student - Providers APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/providers": createRoute({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/:id": createRoute({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/update/:id": createRoute({
    method: "POST",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/media/upload/:id": createRoute({
    method: "POST",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/media/delete/:id": createRoute({
    method: "POST",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/applications/create": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Quizzes Pages
  // ============================================
  "/workspaces/student/:workspaceId/questions": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/questions/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/quizzes": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/quizzes/:id": createRoute({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/quizzes/start": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_QUIZ_TAKE"
  }),
  "/workspaces/student/:workspaceId/quizzes/take/:id": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_QUIZ_TAKE"
  }),
  "/workspaces/student/:workspaceId/quizzes/results/:id": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_QUIZ_READ"
  }),

  // ============================================
  // Student - Quizzes APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/quizzes": createRoute({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
    queryDataAuthenticated: true, // 🔒 Require all query values come from authData
  }),
  "/api/workspaces/student/:workspaceId/quizzes/:id": createRoute({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/quizzes/start": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_QUIZ_TAKE"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/submit": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_QUIZ_TAKE"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/history": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_QUIZ_READ"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/history/summary": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_QUIZ_READ"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/analyze": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
    checkSubscriptionStatus: true,
    permission: "STUDENT_QUIZ_READ"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/update/:id": createRoute({
    method: "PUT",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/quizzes/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),

  // ============================================
  // Student - Questions APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/questions": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/questions/:id": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Subjects APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/subjects": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Favorites Pages
  // ============================================
  "/workspaces/student/:workspaceId/favorites": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  // ============================================
  // Student - Favorites APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/favorites": createRoute({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/favorites/context": createRoute({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/favorites/create/:id": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/favorites/delete/:id": createRoute({
    method: "DELETE",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),

  // ============================================
  // Student - Notifications Pages
  // ============================================
  "/workspaces/student/:workspaceId/notifications": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),


  // ============================================
  // Student - Notifications APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/notifications": createRoute({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/notifications/update/:id": createRoute({
    method: "PATCH",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),

  // ============================================
  // Student - Roles APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/roles": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/roles/:id": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/roles/create": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/roles/:id/permissions": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Learning Conversations Pages
  // ============================================
  "/workspaces/student/:workspaceId/learning": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_LEARNING_READ"
  }),
  "/workspaces/student/:workspaceId/learning/sessions": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_LEARNING_READ"
  }),
  "/workspaces/student/:workspaceId/learning/sessions/:conversationId": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_LEARNING_READ"
  }),

  // ============================================
  // Student - Learning Conversations APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/learning-conversations": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_LEARNING_READ"
  }),
  "/api/workspaces/student/:workspaceId/learning-conversations/create": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
    checkSubscriptionStatus: true,
    permission: "STUDENT_LEARNING_CREATE"
  }),
  "/api/workspaces/student/:workspaceId/learning-conversations/:conversationId": createRoute(
    { method: "GET", authRequired: true, type: "api", permission: "STUDENT_LEARNING_READ" },
  ),
  "/api/workspaces/student/:workspaceId/learning-conversations/:conversationId/messages":
    createRoute({ method: "POST", authRequired: true, type: "api", permission: "STUDENT_LEARNING_UPDATE" }),
  "/api/workspaces/student/:workspaceId/learning-conversations/:conversationId/messages/add":
    createRoute({ method: "POST", authRequired: true, type: "api", permission: "STUDENT_LEARNING_UPDATE" }),
  "/api/workspaces/student/:workspaceId/learning-conversations/:conversationId/archive":
    createRoute({ method: "PATCH", authRequired: true, type: "api", permission: "STUDENT_LEARNING_UPDATE" }),

  "/api/workspaces/student/:workspaceId/learning/analyze": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_LEARNING_CREATE"
  }),
  "/api/workspaces/student/:workspaceId/learning/session": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_LEARNING_READ"
  }),

  "/workspaces/student/:workspaceId/homeworks": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_HOMEWORK_READ"
  }),
  "/workspaces/student/:workspaceId/homeworks/upload": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/student/:workspaceId/homeworks/:homeworkId": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_HOMEWORK_READ"
  }),

  // ============================================
  // Student - Homeworks APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/homeworks": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_READ"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/create": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_CREATE"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/:homeworkId": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_READ"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/:homeworkId/update": createRoute({
    method: "PATCH",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_UPDATE"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/:homeworkId/upload-image": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_UPDATE"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/:homeworkId/delete": createRoute({
    method: "DELETE",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_DELETE"
  }),

  "/api/workspaces/student/:workspaceId/progress": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_PROGRESS_READ"
  }),

  // ============================================
  // Student - Progress Page
  // ============================================
  "/workspaces/student/:workspaceId/progress": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_PROGRESS_READ"
  }),

  // ============================================
  // Student - Goals Page
  // ============================================
  "/workspaces/student/:workspaceId/goals": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_GOALS_READ"
  }),
};
