import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { authData, module }) => {
    // Optional API key check for queue service
    const queueApiKey = process.env.QUEUE_API_KEY;
    if (queueApiKey) {
      const providedKey = request.headers.get("x-api-key");
      if (providedKey !== queueApiKey) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }
    }

    // Use system account ID for queue-generated questions
    const accountId = authData?.account?.id ? Number(authData.account.id) : 1;

    try {
      const result = await module.jobs.processQuestionQueue(accountId);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process queue";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
