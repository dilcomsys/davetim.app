// Deletes a guest upload: the row first, then the storage object.
//
// Idempotent. public.mobile_delete_guest_upload returns the object path even
// when the row was already marked deleted, so a retry after a partial failure
// still removes the object.

import {
  adminClient,
  callRpc,
  jsonResponse,
  PublicError,
  readJson,
  requireString,
  requireUserId,
  serve,
} from "@shared/runtime";

serve(async (request) => {
  const body = await readJson(request);
  const scope = requireString(body, "scope", 16);
  if (scope !== "guest") throw new PublicError("invalid_scope", 400);

  const userId = await requireUserId(request);
  const uploadId = requireString(body, "uploadId", 64);
  const client = adminClient();

  const target = await callRpc<{ bucket: string; path: string | null }>(
    client,
    "mobile_delete_guest_upload",
    { p_upload_id: uploadId, p_user_id: userId },
  );

  if (target.path) {
    const { error } = await client.storage.from(target.bucket).remove([
      target.path,
    ]);
    // A missing object is the desired end state, so a storage error is only
    // surfaced when the object is still there.
    if (error) throw new PublicError("storage_delete_failed", 502);
  }

  return jsonResponse({ deleted: true });
});
