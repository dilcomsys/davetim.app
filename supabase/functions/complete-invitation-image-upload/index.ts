// Confirms an editor image upload and returns its delivery URL.
//
// The object is re-inspected before the URL is handed out, so a client that
// uploads something other than what it declared gets nothing back and the
// object is removed.

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

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

type Ticket = {
  bucket_id: string;
  object_path: string;
  scope: string;
  user_id: string | null;
  expected_mime: string;
};

serve(async (request) => {
  const userId = await requireUserId(request);
  const body = await readJson(request);
  const ticketId = requireString(body, "ticketId", 128);
  const client = adminClient();

  const ticket = await callRpc<Ticket>(client, "mobile_claim_upload_ticket", {
    p_ticket_id: ticketId,
  });

  if (ticket.scope !== "invitation_image" || ticket.user_id !== userId) {
    throw new PublicError("ticket_not_found", 403);
  }

  const folder = ticket.object_path.slice(
    0,
    ticket.object_path.lastIndexOf("/"),
  );
  const fileName = ticket.object_path.slice(
    ticket.object_path.lastIndexOf("/") + 1,
  );

  const { data: listed } = await client.storage
    .from(ticket.bucket_id)
    .list(folder, { limit: 1, search: fileName });

  const object = listed?.find((entry) => entry.name === fileName);
  if (!object) throw new PublicError("uploaded_object_missing", 400);

  const size = Number(object.metadata?.size ?? 0);
  const mime = String(object.metadata?.mimetype ?? "");

  if (
    size <= 0 || size > MAX_IMAGE_BYTES || !ALLOWED_MIME.has(mime) ||
    mime !== ticket.expected_mime
  ) {
    await client.storage.from(ticket.bucket_id).remove([ticket.object_path]);
    throw new PublicError("uploaded_object_rejected", 400);
  }

  const { data } = client.storage.from(ticket.bucket_id).getPublicUrl(
    ticket.object_path,
  );
  if (!data.publicUrl.startsWith("https://")) {
    throw new PublicError("delivery_unavailable", 502);
  }

  return jsonResponse({ publicUrl: data.publicUrl });
});
