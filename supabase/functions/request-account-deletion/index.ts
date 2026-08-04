// Account deletion request.
//
// Records the request and unpublishes the account's content immediately, so a
// pending deletion stops serving public pages while the retention window runs.
// Actual erasure is an operator-run job; see
// docs/engineering/BACKEND-IMPLEMENTATION.md.
//
// Idempotent: a second call returns the existing open request.

import {
  adminClient,
  callRpc,
  jsonResponse,
  PublicError,
  readJson,
  requireUserId,
  serve,
} from "@shared/runtime";

const CONFIRMATION = "DELETE_MY_ACCOUNT";
const RECENT_SESSION_SECONDS = 60 * 60;

serve(async (request) => {
  const body = await readJson(request);
  if (body.confirmation !== CONFIRMATION) {
    throw new PublicError("confirmation_required", 400);
  }

  const userId = await requireUserId(request);
  const client = adminClient();

  // Recent-session policy: deletion is destructive, so a stale token that was
  // lifted from a device days ago must not be able to trigger it.
  const { data: userData } = await client.auth.admin.getUserById(userId);
  const lastSignIn = userData?.user?.last_sign_in_at;
  if (
    lastSignIn &&
    Date.now() - Date.parse(lastSignIn) > RECENT_SESSION_SECONDS * 1000
  ) {
    throw new PublicError("reauthentication_required", 401);
  }

  const result = await callRpc<Record<string, unknown>>(
    client,
    "mobile_request_account_deletion",
    { p_user_id: userId },
  );

  return jsonResponse(result);
});
