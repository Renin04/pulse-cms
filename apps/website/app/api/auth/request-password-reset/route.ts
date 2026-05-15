import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      throw new ApiError("INVALID_INPUT", "Valid email is required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return jsonResponse({ success: true, message: "If an account exists, a reset email has been sent." });
    }

    // Generate a cryptographically secure reset token
    const _resetToken = crypto.randomUUID();

    // TODO: Store token hash in DB with expiry and send via email
    // For now, token is generated but not exposed in the response
    console.log("[password-reset] Token generated for user", user.id, _resetToken.slice(0, 8));

    return jsonResponse({
      success: true,
      message: "If an account exists, a reset email has been sent.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
