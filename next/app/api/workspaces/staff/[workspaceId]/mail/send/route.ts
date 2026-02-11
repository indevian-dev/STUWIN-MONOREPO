import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(async (request, { module }) => {
  const body = await request.json();
  const { to_email, to_name, subject, htmlbody, textbody } = body;

  if (!to_email || !subject || !htmlbody) {
    return NextResponse.json(
      { error: "Missing required fields: to_email, subject, htmlbody" },
      { status: 400 },
    );
  }

  const result = await module.mail.sendEmail({
    to_email,
    to_name,
    subject,
    htmlbody,
    textbody
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to send email" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Email sent successfully",
    message_id: result.data?.message_id,
    status: result.data?.status,
  });
});
