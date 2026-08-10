import { handleApiError, ApiError } from "@/lib/api-utils";

/**
 * Password reset is DISABLED until a real flow (signed, single-use, expiring
 * tokens stored server-side + email delivery) ships. The previous dev stub
 * "verified" tokens by parsing `dev-token-{userId}-{timestamp}`, which allowed
 * unauthenticated takeover of ANY account — see security audit issue #6 (N1).
 */
export async function POST() {
  try {
    throw new ApiError(
      "NOT_IMPLEMENTED",
      "Password reset is not available yet. Please contact an administrator.",
      501
    );
  } catch (err) {
    return handleApiError(err);
  }
}
