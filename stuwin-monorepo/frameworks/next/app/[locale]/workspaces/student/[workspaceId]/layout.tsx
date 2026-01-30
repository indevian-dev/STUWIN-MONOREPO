import { withLayoutAuth } from "@/lib/app-access-control/interceptors";
import { StudentLayoutClient } from "./StudentLayoutClient";
import type { ReactNode } from "react";
import type { AuthData } from "@/types";

interface StudentLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string;[key: string]: string }>;
  authData?: AuthData | null;
}

/**
 * Student Layout - Server Component
 * Validates auth at layout level so UI never renders for unauthorized users
 */
async function StudentLayout({ children, authData }: StudentLayoutProps) {
  return (
    <StudentLayoutClient authData={authData ?? null}>
      {children}
    </StudentLayoutClient>
  );
}

export default withLayoutAuth(StudentLayout, {
  path: "/workspaces/student/:workspaceId",
});
