import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { TOPICS } from "@/lib/app-infrastructure/database";

const SUBJECTS_PDFS_TABLE = "subjectsPdfs";

export const PUT: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, context: ApiHandlerContext) => {
    const { authData, log, db, params, isValidSlimId } = context;

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const subjectId = params?.id as string;
      const isValidResourceId = (value: string) =>
        isValidSlimId(value) || (value.includes(":") && isValidSlimId(value.split(":")[1]));

      if (!subjectId || !isValidResourceId(subjectId)) {
        return NextResponse.json(
          { success: false, error: "Invalid subject ID" },
          { status: 400 },
        );
      }

      const toRecordId = (table: string, value: unknown): string => {
        if (value === null || value === undefined) {
          return "";
        }
        const raw = String(value);
        return raw.includes(":") ? raw : `${table}:${raw}`;
      };

      const toRecordIds = (table: string, values: unknown[]) =>
        values.map((value) => toRecordId(table, value));

      // Parse request body
      const body = await request.json();
      let { topicIds, subjectPdfId: bodySubjectPdfId } = body;

      // Backward compatibility: if old format with 'topics' array is sent, convert it
      if (!topicIds && body.topics && Array.isArray(body.topics)) {
        topicIds = body.topics
          .map((t: any) => {
            // Handle both old format {id: 1} and simple format [1, 2, 3]
            return typeof t === "object" && t.id ? String(t.id) : String(t as any);
          })
          .filter((id: string) => isValidResourceId(id));

        log.info("Converted old format to new format", {
          oldTopicsCount: body.topics.length,
          newTopicIdsCount: topicIds.length,
          topicIds,
        });
      }

      // Also check query parameters for subjectPdfId
      const url = new URL(request.url);
      const querySubjectPdfId = url.searchParams.get("subjectPdfId");
      const subjectPdfId = bodySubjectPdfId || querySubjectPdfId;

      log.info("Reorder request received", {
        subjectId,
        subjectPdfId,
        body: JSON.stringify(body),
        topicIdsCount: Array.isArray(topicIds) ? topicIds.length : "not array",
        topicIdsType: typeof topicIds,
        hasTopicIds: body.hasOwnProperty("topicIds"),
        allKeys: Object.keys(body),
      });

      if (!Array.isArray(topicIds)) {
        log.error("Invalid request body - topicIds array missing", {
          subjectId,
          body: JSON.stringify(body),
          topicIdsType: typeof topicIds,
          hasTopicIds: body.hasOwnProperty("topicIds"),
          hasTopics: body.hasOwnProperty("topics"),
          error: "Expected 'topicIds' array",
        });

        const errorMsg =
          !body.hasOwnProperty("topicIds") && !body.hasOwnProperty("topics")
            ? 'Missing \'topicIds\' array in request body. Expected format: {"topicIds": [1, 2, 3]} or {"topics": [{"id": 1}, {"id": 2}]}'
            : `Invalid 'topicIds' format. Expected array, got ${typeof topicIds}. Body received: ${JSON.stringify(body)}`;

        return NextResponse.json(
          { success: false, error: errorMsg },
          { status: 400 },
        );
      }

      // Validate topic IDs - they should be numbers
      const validatedTopicIds = topicIds
        .map((id: any) => String(id))
        .filter((id: string) => isValidResourceId(id));

      if (
        validatedTopicIds.length === 0 ||
        validatedTopicIds.length !== topicIds.length
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid topic IDs in request - all must be valid IDs",
          },
          { status: 400 },
        );
      }

      // Try to determine subjectPdfId
      let pdfId: string | undefined;

      if (subjectPdfId && isValidResourceId(String(subjectPdfId))) {
        pdfId = String(subjectPdfId);
        log.debug("Using provided subjectPdfId", { subjectPdfId: pdfId });
      } else {
        // Try to find subjectPdfId from the topics being reordered
        // Check ALL topics in the request, not just the first one
        if (validatedTopicIds.length > 0) {
          const topicRecordIds = toRecordIds(TOPICS, validatedTopicIds);
          const topicsFromDb = await db.query(
            `SELECT id, subjectPdfId FROM ${TOPICS} WHERE id IN $ids`,
            { ids: topicRecordIds },
          );

          // Find the most common subjectPdfId among topics that have one
          const pdfIdCounts = new Map<string, number>();
          topicsFromDb.forEach((t) => {
            if (t.subjectPdfId) {
              pdfIdCounts.set(
                t.subjectPdfId,
                (pdfIdCounts.get(t.subjectPdfId) || 0) + 1,
              );
            }
          });

          if (pdfIdCounts.size > 0) {
            // Pick the one with the most topics (or just the first one if only one exists)
            let maxCount = 0;
            for (const [id, count] of pdfIdCounts.entries()) {
              if (count > maxCount) {
                maxCount = count;
                pdfId = id;
              }
            }

            if (pdfId) {
              log.info("Auto-determined subjectPdfId from topics", {
                subjectPdfId: pdfId,
                uniquePdfIds: Array.from(pdfIdCounts.keys()),
                maxCount,
              });
            }
          }

          if (!pdfId) {
            // No topics have subject_pdf_id - try to find available PDFs for this subject
            log.warn(
              "Topics have no subject_pdf_id, checking available PDFs for subject",
              {
                subjectId,
              },
            );

            const availablePdfs = await db.query(
              `SELECT id, pdfUrl, isActive FROM ${SUBJECTS_PDFS_TABLE} WHERE subjectId = $subjectId`,
              { subjectId },
            );

            if (availablePdfs.length === 1) {
              // Only one PDF available, use it
              pdfId = availablePdfs[0].id;
              log.info("Using only available PDF for subject", {
                subjectId,
                pdfId,
                pdfUrl: availablePdfs[0].pdfUrl,
              });
            } else if (availablePdfs.length > 1) {
              // Multiple PDFs available - try to see if one is active
              const activePdfs = availablePdfs.filter((p) => p.isActive);
              if (activePdfs.length === 1) {
                pdfId = activePdfs[0].id;
                log.info("Using only active PDF for subject", {
                  subjectId,
                  pdfId,
                  pdfUrl: activePdfs[0].pdfUrl,
                });
              } else {
                // Multiple active or no active - cannot determine which one
                log.error("Multiple PDFs available, cannot auto-determine", {
                  subjectId,
                  availablePdfs: availablePdfs.map((p) => ({
                    id: p.id,
                    pdfUrl: p.pdfUrl,
                    isActive: p.isActive,
                  })),
                });
                return NextResponse.json(
                  {
                    success: false,
                    error: `Multiple PDFs found for subject ${subjectId}. Please specify subjectPdfId in request body.`,
                    availableOptions: availablePdfs.map((p) => ({
                      id: p.id,
                      pdfUrl: p.pdfUrl,
                      isActive: p.isActive,
                    })),
                  },
                  { status: 400 },
                );
              }
            } else {
              // No PDFs found
              log.error("No PDFs found for subject", { subjectId });
              return NextResponse.json(
                {
                  success: false,
                  error: `No PDFs found for subject ${subjectId}. Please create a PDF first.`,
                },
                { status: 400 },
              );
            }
          }
        } else {
          log.error("No valid topics provided for subjectPdfId determination", {
            subjectId,
            topicIdsCount: validatedTopicIds.length,
          });
          return NextResponse.json(
            {
              success: false,
              error: "No topics provided to determine subjectPdfId",
            },
            { status: 400 },
          );
        }
      }

      // Ensure we have a valid pdfId
      if (!pdfId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to determine subjectPdfId. Please provide it explicitly.",
          },
          { status: 400 },
        );
      }

      // Verify all topics belong to this subject and have the correct subject_pdf_id
      const existingTopics = await db.query(
        `SELECT id, subjectPdfId FROM ${TOPICS} WHERE subjectId = $subjectId`,
        { subjectId },
      );

      const existingTopicIds = existingTopics.map((t) => t.id);
      const invalidTopics = validatedTopicIds.filter(
        (id) => !existingTopicIds.includes(id),
      );

      if (invalidTopics.length > 0) {
        log.error("Invalid topics found", {
          subjectId,
          pdfId,
          invalidTopics,
          existingTopicIds,
        });
        return NextResponse.json(
          {
            success: false,
            error: `Topics not found or do not belong to this subject: ${invalidTopics.join(", ")}`,
          },
          { status: 400 },
        );
      }

      // Check if topics have mismatched subjectPdfId (but allow if we're setting it for the first time)
      const topicsWithDifferentPdfId = existingTopics.filter(
        (t) => t.subjectPdfId !== null && t.subjectPdfId !== pdfId,
      );
      if (topicsWithDifferentPdfId.length > 0) {
        log.error("Topics have mismatched subjectPdfId", {
          subjectId,
          expectedPdfId: pdfId,
          mismatchedTopics: topicsWithDifferentPdfId.map((t) => ({
            id: t.id,
            subjectPdfId: t.subjectPdfId,
          })),
        });
        return NextResponse.json(
          {
            success: false,
            error: `Some topics belong to different PDFs. All topics must belong to the same PDF (ID: ${pdfId})`,
          },
          { status: 400 },
        );
      }

      // If any topics don't have subjectPdfId set, we'll set it during the update
      const topicsWithoutPdfId = existingTopics.filter(
        (t) => t.subjectPdfId === null,
      );
      if (topicsWithoutPdfId.length > 0) {
        log.info("Some topics don't have subjectPdfId set, will update them", {
          subjectId,
          pdfId,
          topicsToUpdate: topicsWithoutPdfId.map((t) => t.id),
        });
      }

      // Verify the subject_pdf exists and belongs to this subject
      const pdfRecordId = toRecordId(SUBJECTS_PDFS_TABLE, pdfId);
      const subjectPdfRecord = await db.query(
        `SELECT id FROM ${SUBJECTS_PDFS_TABLE} WHERE id = $pdfId`,
        { pdfId: pdfRecordId },
      );

      if (!subjectPdfRecord || subjectPdfRecord.length === 0) {
        return NextResponse.json(
          { success: false, error: "Subject PDF record not found" },
          { status: 404 },
        );
      }

      // Start a transaction to ensure the update succeeds
      // Update the topics_ordered_ids JSON column in subjects_pdfs table
      await db.query("UPDATE $record SET topicsOrderedIds = $topicsOrderedIds", {
        record: pdfRecordId,
        topicsOrderedIds: validatedTopicIds,
      });

      log.info("Updated topics_ordered_ids in subjects_pdfs", {
        subjectPdfId: pdfId,
        orderedTopicIds: validatedTopicIds,
      });

      // Update the subject_pdf_id on topics that don't have it set
      // This ensures topics are linked to the correct PDF
      const topicsToUpdate = existingTopics.filter(
        (t) => t.subjectPdfId === null || t.subjectPdfId !== pdfId,
      );

      if (topicsToUpdate.length > 0) {
        const updateTopicPromises = topicsToUpdate.map((topic) =>
          db.query(
            "UPDATE $record SET subjectPdfId = $subjectPdfId",
            {
              record: toRecordId(TOPICS, topic.id),
              subjectPdfId: pdfId,
            },
          ),
        );

        await Promise.all(updateTopicPromises);

        log.info("Updated subject_pdf_id on topics", {
          subjectPdfId: pdfId,
          updatedTopicIds: topicsToUpdate.map((t) => t.id),
          totalTopics: validatedTopicIds.length,
        });
      }

      // Verify the update persisted after transaction commit
      const updatedPdfRecord = await db.query(
        `SELECT id, topicsOrderedIds FROM ${SUBJECTS_PDFS_TABLE} WHERE id = $pdfId LIMIT 1`,
        { pdfId: pdfRecordId },
      );

      log.info("Subjects_pdfs after reorder (final check)", {
        subjectPdfId: pdfId,
        topicsOrderedIds: updatedPdfRecord[0]?.topicsOrderedIds,
      });

      log.info("Topics reordered successfully", {
        subjectId,
        topicCount: validatedTopicIds.length,
        accountId: authData.account?.id,
      });

      return NextResponse.json({
        success: true,
        message: "Topics reordered successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Log to both application logger and console for debugging
      log.error("Failed to reorder topics", {
        error: errorMessage,
        stack: errorStack,
        subjectId: params?.id,
        accountId: authData.account?.id,
      });

      console.error("============ Topics Reorder API Error ============");
      console.error("Error Message:", errorMessage);
      console.error("Stack Trace:", errorStack);
      console.error("Subject ID:", params?.id);
      console.error(
        "Request Body:",
        await request.json().catch(() => "Unable to parse"),
      );
      console.error("================================================");

      return NextResponse.json(
        {
          success: false,
          error: "Failed to reorder topics",
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 },
      );
    }
  },
);
