
import { withPageAuth } from "@/lib/app-access-control/interceptors";
import { CheckoutPageClient } from "./CheckoutPageClient";

async function CheckoutPage() {
    return <CheckoutPageClient />;
}

export default withPageAuth(CheckoutPage, {
    path: "/workspaces/billing/checkout",
});
