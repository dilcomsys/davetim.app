// KVKK/GDPR data export.
//
// The payload is built by public.mobile_export_account_data, which selects the
// caller's own content and deliberately omits guest tokens, storage paths,
// signed URLs, security logs and payment payloads.

import {
  adminClient,
  callRpc,
  jsonResponse,
  requireUserId,
  serve,
} from "@shared/runtime";

serve(async (request) => {
  const userId = await requireUserId(request);
  const client = adminClient();

  const payload = await callRpc<Record<string, unknown>>(
    client,
    "mobile_export_account_data",
    { p_user_id: userId },
  );

  return jsonResponse(payload);
});
