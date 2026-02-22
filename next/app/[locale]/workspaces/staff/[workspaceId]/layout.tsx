import { ReactNode } from "react";
import { withLayoutAuth } from "@/lib/middleware/_Middleware.index";
import { StaffLayoutClient } from "./StaffLayoutClient";
import type { ClientAuthData } from "@stuwin/shared/types/auth/AuthData.types";

interface StaffLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string;[key: string]: string }>;
  clientAuth?: ClientAuthData | null;
  layoutPath?: string;
}

/**
 * Staff Layout - Server Component
 * Validates auth at layout level so UI never renders for unauthorized users
 * Staff requires STAFF_ACCESS permission
 */
async function StaffLayout({ children, clientAuth }: StaffLayoutProps) {
  return (
    <StaffLayoutClient authData={clientAuth ?? null}>
      {children}
    </StaffLayoutClient>
  );
}

export default withLayoutAuth(StaffLayout, {
  path: "/workspaces/staff/:workspaceId",
});
