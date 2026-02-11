import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { SubjectUpdateSchema } from "@/lib/domain/learning/learning.inputs";

export const PUT = unifiedApiHandler(
  async (request, { auth, module, params, log }) => {
    try {
      const subjectId = params?.id as string;

      if (!subjectId) {
        return NextResponse.json(
          { success: false, error: "Invalid subject ID" },
          { status: 400 },
        );
      }

      const body = await request.json();

      // Validate with Zod — partial update, all fields optional
      const parsed = SubjectUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({
          success: false,
          error: parsed.error.errors[0]?.message || "Validation failed"
        }, { status: 400 });
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
      if (body.aiAssistantCrib !== undefined) updateData.aiAssistantCrib = body.aiAssistantCrib;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { success: false, error: "No fields to update" },
          { status: 400 },
        );
      }

      const result = await module.subject.update(subjectId, updateData);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Failed to update subject" },
          { status: result.error === "Subject not found" ? 404 : 500 },
        );
      }

      log.info("Subject updated successfully", {
        subjectId,
        accountId: auth.accountId,
        updates: Object.keys(updateData),
      });

      return NextResponse.json({
        success: true,
        data: result.data,
        message: "Subject updated successfully",
      });
    } catch (error) {
      log.error("Failed to update subject", error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update subject",
        },
        { status: 500 },
      );
    }
  },
  {
    authRequired: true,
  }
);
