import { ReactNode } from "react";
import { withLayoutAuth } from "@/lib/middleware/handlers";
import { StaffLayoutClient } from "./StaffLayoutClient";
import type { AuthData } from "@stuwin/shared/types";

interface StaffLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string;[key: string]: string }>;
  authData?: AuthData | null;
  layoutPath?: string;
}

/**
 * Staff Layout - Server Component
 * Validates auth at layout level so UI never renders for unauthorized users
 * Staff requires STAFF_ACCESS permission
 */
async function StaffLayout({ children, authData }: StaffLayoutProps) {
  return (
    <StaffLayoutClient authData={authData ?? null}>
      {children}
    </StaffLayoutClient>
  );
}

export default withLayoutAuth(StaffLayout, {
  path: "/workspaces/staff/:workspaceId",
});
