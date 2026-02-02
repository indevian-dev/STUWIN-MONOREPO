// ═══════════════════════════════════════════════════════════════
// STUDENTS ENDPOINT CONFIGURATION
// For student users accessing educational content and taking quizzes
// ═══════════════════════════════════════════════════════════════

import type { EndpointsMap } from "@/types";
import { createRouteFactory } from "../../RouteFactory";

// Create student-specific endpoint factory
const createStudentEndpoint = createRouteFactory({
  workspace: "student",
  needEmailVerification: true,
  needPhoneVerification: true
});

// Merge all student endpoints (APIs and pages)
export const studentEndpoints: EndpointsMap = {
  // ============================================
  // Student Pages and APIs
  // ============================================
  // Main student dashboard
  "/workspaces/student/:workspaceId": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_ACCESS",
    type: "page",
  }),

  // Legacy student redirect
  "/student": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_ACCESS",
    type: "page",
  }),

  // ============================================
  // Student - Accounts Pages
  // ============================================
  "/workspaces/student/:workspaceId/accounts/me": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_ACCOUNT_READ",
    type: "page",
  }),

  // ============================================
  // Student - Accounts APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/accounts": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/update": createStudentEndpoint({
    method: "PATCH",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/delete": createStudentEndpoint({
    method: "DELETE",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/media/upload": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/media/delete": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/me": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/me/update": createStudentEndpoint({
    method: "PATCH",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/accounts/me/logout-session": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Providers Pages
  // ============================================
  "/workspaces/student/:workspaceId/providers": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_PROVIDER_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/providers/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_PROVIDER_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/providers/applications": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_PROVIDER_APPLICATION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/providers/applications/create": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_PROVIDER_APPLICATION_CREATE",
    type: "page",
  }),

  // ============================================
  // Student - Providers APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/providers": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/update/:id": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/delete/:id": createStudentEndpoint({
    method: "DELETE",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/media/upload/:id": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/media/delete/:id": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/providers/applications/create": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Quizzes Pages
  // ============================================
  "/workspaces/student/:workspaceId/questions": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/questions/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/quizzes": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/quizzes/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    permission: "STUDENT_QUESTION_READ",
    type: "page",
  }),
  "/workspaces/student/:workspaceId/quizzes/start": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_QUIZ_TAKE"
  }),
  "/workspaces/student/:workspaceId/quizzes/take/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_QUIZ_TAKE"
  }),
  "/workspaces/student/:workspaceId/quizzes/results/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_QUIZ_READ"
  }),

  // ============================================
  // Student - Quizzes APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/quizzes": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
    queryDataAuthenticated: true, // 🔒 Require all query values come from authData
  }),
  "/api/workspaces/student/:workspaceId/quizzes/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/quizzes/start": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_QUIZ_TAKE"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/submit": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_QUIZ_TAKE"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/history": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_QUIZ_READ"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/history/summary": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_QUIZ_READ"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/analyze": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
    checkSubscriptionStatus: true,
    permission: "STUDENT_QUIZ_READ"
  }),
  "/api/workspaces/student/:workspaceId/quizzes/update/:id": createStudentEndpoint({
    method: "PUT",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/quizzes/delete/:id": createStudentEndpoint({
    method: "DELETE",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),

  // ============================================
  // Student - Questions APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/questions": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/questions/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Favorites Pages
  // ============================================
  "/workspaces/student/:workspaceId/favorites": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  // ============================================
  // Student - Favorites APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/favorites": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/favorites/context": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/favorites/create/:id": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/favorites/delete/:id": createStudentEndpoint({
    method: "DELETE",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),

  // ============================================
  // Student - Notifications Pages
  // ============================================
  "/workspaces/student/:workspaceId/notifications": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/student/:workspaceId/conversations": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/student/:workspaceId/conversations/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  // ============================================
  // Student - Notifications APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/notifications": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/notifications/update/:id": createStudentEndpoint({
    method: "PATCH",
    authRequired: true,
    workspace: "student",
    type: "api",
  }),

  // ============================================
  // Student - Roles APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/roles": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/roles/:id": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/roles/create": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/student/:workspaceId/roles/:id/permissions": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Student - Learning Conversations Pages
  // ============================================
  "/workspaces/student/:workspaceId/learning": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_LEARNING_READ"
  }),
  "/workspaces/student/:workspaceId/learning/sessions": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_LEARNING_READ"
  }),
  "/workspaces/student/:workspaceId/learning/sessions/:conversationId": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_LEARNING_READ"
  }),

  // ============================================
  // Student - Learning Conversations APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/learning-conversations": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_LEARNING_READ"
  }),
  "/api/workspaces/student/:workspaceId/learning-conversations/create": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
    checkSubscriptionStatus: true,
    permission: "STUDENT_LEARNING_CREATE"
  }),
  "/api/workspaces/student/:workspaceId/learning-conversations/:conversationId": createStudentEndpoint(
    { method: "GET", authRequired: true, type: "api", permission: "STUDENT_LEARNING_READ" },
  ),
  "/api/workspaces/student/:workspaceId/learning-conversations/:conversationId/messages":
    createStudentEndpoint({ method: "POST", authRequired: true, type: "api", permission: "STUDENT_LEARNING_UPDATE" }),
  "/api/workspaces/student/:workspaceId/learning-conversations/:conversationId/messages/add":
    createStudentEndpoint({ method: "POST", authRequired: true, type: "api", permission: "STUDENT_LEARNING_UPDATE" }),
  "/api/workspaces/student/:workspaceId/learning-conversations/:conversationId/archive":
    createStudentEndpoint({ method: "PATCH", authRequired: true, type: "api", permission: "STUDENT_LEARNING_UPDATE" }),

  "/api/workspaces/student/:workspaceId/learning/analyze": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_LEARNING_CREATE"
  }),
  "/api/workspaces/student/:workspaceId/learning/session": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_LEARNING_READ"
  }),

  "/workspaces/student/:workspaceId/homeworks": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_HOMEWORK_READ"
  }),
  "/workspaces/student/:workspaceId/homeworks/upload": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/student/:workspaceId/homeworks/:homeworkId": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
    permission: "STUDENT_HOMEWORK_READ"
  }),

  // ============================================
  // Student - Homeworks APIs
  // ============================================
  "/api/workspaces/student/:workspaceId/homeworks": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_READ"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/create": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_CREATE"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/:homeworkId": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_READ"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/:homeworkId/update": createStudentEndpoint({
    method: "PATCH",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_UPDATE"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/:homeworkId/upload-image": createStudentEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_UPDATE"
  }),
  "/api/workspaces/student/:workspaceId/homeworks/:homeworkId/delete": createStudentEndpoint({
    method: "DELETE",
    authRequired: true,
    type: "api",
    permission: "STUDENT_HOMEWORK_DELETE"
  }),

  "/api/workspaces/student/:workspaceId/progress": createStudentEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
    permission: "STUDENT_ACCESS"
  }),
};
