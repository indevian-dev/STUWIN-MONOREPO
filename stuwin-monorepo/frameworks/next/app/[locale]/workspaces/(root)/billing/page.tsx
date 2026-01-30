
import { withPageAuth } from "@/lib/app-access-control/interceptors";
import { SubscriptionManagementClient } from "./SubscriptionManagementClient";

async function SubscriptionManagementPage() {
    return <SubscriptionManagementClient />;
}

export default withPageAuth(SubscriptionManagementPage, {
    path: "/workspaces/billing",
});
