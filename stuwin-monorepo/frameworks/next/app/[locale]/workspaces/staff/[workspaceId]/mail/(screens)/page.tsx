import { withPageAuth } from "@/lib/app-access-control/interceptors";
import StaffMailPageClient from "./StaffMailPageClient";

function StaffMailPage() {
  return <StaffMailPageClient />;
}

export default withPageAuth(StaffMailPage, {
  path: "/workspaces/staff/:workspaceId/mail",
});
