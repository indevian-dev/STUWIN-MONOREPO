import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { PROMPTS } from "@/lib/app-infrastructure/database";
import type {
  ApiRouteHandler,
  ApiHandlerContext,
} from "@/types/next";
export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;
    try {
      const whereClause = search
        ? `WHERE string::lowercase(title) CONTAINS string::lowercase($search)
           OR string::lowercase(body) CONTAINS string::lowercase($search)`
        : '';

      const [promptsData, countResult] = await Promise.all([
        db.query(
          `SELECT * FROM ${PROMPTS} ${whereClause} ORDER BY createdAt DESC LIMIT $limit START $offset`,
          { search, limit, offset },
        ),
        db.query(
          `SELECT count() AS total FROM ${PROMPTS} ${whereClause} GROUP ALL`,
          { search },
        ),
      ]);

      const totalCount = countResult[0]?.total || 0;
      return NextResponse.json(
        {
          prompts: promptsData,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
        { status: 200 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch prompts";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
    try {
      if (!authData) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const accountId = authData.account.id;
      const body = await request.json();
      const { body: promptBody, title } = body;
      if (!promptBody || !title) {
        return NextResponse.json(
          { error: "Body and title are required" },
          { status: 400 },
        );
      }
      const created = await db.query(`CREATE ${PROMPTS} CONTENT $data`, {
        data: {
          body: promptBody,
          title,
          createdAt: new Date(),
        },
      });
      const prompt = created[0];
      return NextResponse.json({ prompt }, { status: 201 });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create prompt";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
