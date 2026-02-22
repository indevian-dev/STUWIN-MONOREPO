
import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import { CheckoutPageClient } from "./CheckoutPageClient";

async function CheckoutPage() {
    return <CheckoutPageClient />;
}

export default withPageAuth(CheckoutPage, {
    path: "/workspaces/billing/checkout",
});
