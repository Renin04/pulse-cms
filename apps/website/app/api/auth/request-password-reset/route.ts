import { NextRequest } from "next/server";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

const GENERIC_RESPONSE = {
  success: true,
  message: "If an account exists, a reset email has been sent.",
};

/**
 * Stub — no reset tokens are issued yet (see reset-password route, which is
 * 501 until the real flow ships). The response is identical whether or not the
 * email belongs to an account, so account existence is never leaked. The email
 * lookup is deliberately NOT performed here: no token is generated, stored,
 * logged, or returned, so nothing usable can ever leave this endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      throw new ApiError("INVALID_INPUT", "Valid email is required", 400);
    }

    // TODO: when the real reset flow ships, look up the user, store a hashed
    // single-use token with expiry, and send it via email — keeping this exact
    // generic response either way.
    return jsonResponse(GENERIC_RESPONSE);
  } catch (err) {
    return handleApiError(err);
  }
}
