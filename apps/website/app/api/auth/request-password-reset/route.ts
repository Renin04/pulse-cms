import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      throw new ApiError("INVALID_INPUT", "Email is required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return jsonResponse({ success: true, message: "If an account exists, a reset email has been sent." });
    }

    // In production, generate a secure token and send email
    // For now, return a mock token for development
    const resetToken = `dev-token-${user.id}-${Date.now()}`;

    return jsonResponse({
      success: true,
      message: "If an account exists, a reset email has been sent.",
      // Only included in dev mode
      devToken: resetToken,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
