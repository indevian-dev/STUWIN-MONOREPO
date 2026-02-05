import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { ValidationService, Rules, Sanitizers } from '@/lib/app-core-modules/services/ValidationService';

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
      const validation = ValidationService.validate(body, {
        name: {
          rules: [Rules.string('name'), Rules.subjectNameFormat('name')]
        },
        description: {
          rules: [Rules.string('description')],
          sanitizers: [Sanitizers.trim]
        },
        slug: {
          rules: [Rules.string('slug')],
          sanitizers: [Sanitizers.lowercase, Sanitizers.trim]
        }
      });

      if (!validation.isValid) {
        return NextResponse.json({
          success: false,
          error: validation.firstError?.message || "Validation failed"
        }, { status: 400 });
      }

      const { name, description, slug, aiLabel, cover, gradeLevel, language } = validation.sanitized;

      // Build update object only with existing fields in body
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (slug !== undefined) updateData.slug = slug;
      if (aiLabel !== undefined) updateData.aiLabel = aiLabel;
      if (cover !== undefined) updateData.cover = cover;
      if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
      if (language !== undefined) updateData.language = language;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { success: false, error: "No fields to update" },
          { status: 400 },
        );
      }

      // Call service to update
      const result = await module.learning.updateSubject(subjectId, updateData);

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
