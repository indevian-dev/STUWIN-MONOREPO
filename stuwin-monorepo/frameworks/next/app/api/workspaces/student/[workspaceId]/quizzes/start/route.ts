import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
    const accountId = auth.accountId;
    const workspaceId = params?.workspaceId as string;

    try {
      const body = await request.json();

      log.info("Starting quiz via module", { accountId, workspaceId, ...body });

      const result = await module.activity.startQuiz(accountId, workspaceId, body);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.error === "No questions found matching criteria" ? 404 : 500 });
      }

      log.info("Quiz started successfully", { quizId: result.data?.id });

      return NextResponse.json(
        {
          message: "Quiz started successfully",
          quiz: result.data,
        },
        { status: 200 },
      );
    } catch (error) {
      log.error("Error starting quiz", error);
      return NextResponse.json(
        { error: "Failed to start quiz" },
        { status: 500 },
      );
    }
  },
);
