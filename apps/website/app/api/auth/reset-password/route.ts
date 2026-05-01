import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      throw new ApiError("INVALID_INPUT", "Token and password are required", 400);
    }

    if (password.length < 8) {
      throw new ApiError("INVALID_INPUT", "Password must be at least 8 characters", 400);
    }

    // In production, verify token against a password_resets table
    // For dev, extract userId from token format: dev-token-{userId}-{timestamp}
    const parts = token.split("-");
    const userId = parts.length >= 3 ? parts[2] : null;

    if (!userId) {
      throw new ApiError("INVALID_TOKEN", "Invalid or expired token", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError("INVALID_TOKEN", "Invalid or expired token", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });

    return jsonResponse({ success: true, message: "Password updated successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}
