
import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import { SubscriptionManagementClient } from "./SubscriptionManagementClient";

async function SubscriptionManagementPage() {
    return <SubscriptionManagementClient />;
}

export default withPageAuth(SubscriptionManagementPage, {
    path: "/workspaces/billing",
});
