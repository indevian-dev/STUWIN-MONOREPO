import { withLayoutAuth } from "@/lib/middleware/_Middleware.index";
import { StudentLayoutClient } from "./StudentLayoutClient";
import type { ReactNode } from "react";
import type { ClientAuthData } from "@stuwin/shared/types/auth/AuthData.types";

interface StudentLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string;[key: string]: string }>;
  clientAuth?: ClientAuthData | null;
}

/**
 * Student Layout - Server Component
 * Validates auth at layout level so UI never renders for unauthorized users
 */
async function StudentLayout({ children, clientAuth }: StudentLayoutProps) {
  return (
    <StudentLayoutClient authData={clientAuth ?? null}>
      {children}
    </StudentLayoutClient>
  );
}

export default withLayoutAuth(StudentLayout, {
  path: "/workspaces/student/:workspaceId",
});
