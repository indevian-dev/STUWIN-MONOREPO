import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import StaffMailPageClient from "./StaffMailPageClient";

function StaffMailPage() {
  return <StaffMailPageClient />;
}

export default withPageAuth(StaffMailPage, {
  path: "/workspaces/staff/:workspaceId/mail",
});
