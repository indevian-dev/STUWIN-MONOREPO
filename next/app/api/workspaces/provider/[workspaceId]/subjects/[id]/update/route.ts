import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { SubjectUpdateSchema } from "@/lib/domain/learning/Learning.inputs";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const PUT = unifiedApiHandler(
  async (request, { auth, module, params, log }) => {
    try {
      const subjectId = params?.id as string;

      if (!subjectId) {
        return errorResponse("Invalid subject ID", 400);
      }

      const body = await request.json();

      // Validate with Zod — partial update, all fields optional
      const parsed = SubjectUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(parsed.error.errors[0]?.message || "Validation failed", 400);
      }

      // Build update object only with fields present in body
      const updateData: Record<string, unknown> = {};
      const { title, description, slug, aiLabel, language, gradeLevel } = parsed.data;
      if (body.name !== undefined) updateData.name = body.name;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (slug !== undefined) updateData.slug = slug;
      if (aiLabel !== undefined) updateData.aiLabel = aiLabel;
      if (body.cover !== undefined) updateData.cover = body.cover;
      if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
      if (language !== undefined) updateData.language = language;
      if (body.aiGuide !== undefined) updateData.aiGuide = body.aiGuide;

      if (Object.keys(updateData).length === 0) {
        return errorResponse("No fields to update", 400);
      }

      const result = await module.subject.update(subjectId, updateData);

      if (!result.success) {
        return errorResponse(result.error || "Failed to update subject", result.error === "Subject not found" ? 404 : 500);
      }

      log.info("Subject updated successfully", {
        subjectId,
        accountId: auth.accountId,
        updates: Object.keys(updateData),
      });

      return okResponse(result.data, "Subject updated successfully");
    } catch (error) {
      log.error("Failed to update subject", error);
      return serverErrorResponse(error instanceof Error ? error.message : "Failed to update subject");
    }
  },
  {
    authRequired: true,
  }
);
