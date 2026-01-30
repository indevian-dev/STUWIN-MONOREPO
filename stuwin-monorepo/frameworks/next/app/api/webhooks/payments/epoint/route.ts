
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse, NextRequest } from "next/server";
import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";

/**
 * POST /api/webhooks/payments/epoint
 * Epoint payment status callback
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const data = formData.get('data') as string;
        const signature = formData.get('signature') as string;

        if (!data || !signature) {
            ConsoleLogger.error("Epoint webhook missing data or signature");
            return NextResponse.json({ success: false, error: "Missing payload" }, { status: 400 });
        }

        // We need a ModuleFactory but we don't have a user session context here
        // However, PaymentService needs AuthContext for some methods, but verifyWebhookSignature only needs env keys.
        // We can create a dummy context for the factory.
        const dummyCtx: any = { accountId: 'system', userId: 'system' };
        const modules = new ModuleFactory(dummyCtx);

        const isValid = await modules.payment.verifyWebhookSignature(data, signature);
        if (!isValid) {
            ConsoleLogger.error("Epoint webhook signature mismatch");
            return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
        }

        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        ConsoleLogger.log("Epoint webhook received:", decodedData);

        const { status, order_id, transaction_id } = decodedData;

        if (status === 'success') {
            await modules.payment.completePayment(order_id);
            ConsoleLogger.log(`Epoint payment success for order ${order_id}`);
        } else {
            ConsoleLogger.warn(`Epoint payment status: ${status} for order ${order_id}`);
        }

        // Respond with OK to epoint
        return NextResponse.json({ status: "ok" });

    } catch (error: any) {
        ConsoleLogger.error("Epoint webhook processing error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
