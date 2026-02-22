import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request, { module }) => {
  const body = await request.json();
  const { to_email, to_name, subject, htmlbody, textbody } = body;

  if (!to_email || !subject || !htmlbody) {
    return errorResponse("Missing required fields: to_email, subject, htmlbody");
  }

  const result = await module.mail.sendEmail({
    to_email,
    to_name,
    subject,
    htmlbody,
    textbody
  });

  if (!result.success) {
    return serverErrorResponse(result.error || "Failed to send email");
  }

  return okResponse(result.data, "Email sent successfully");
});
