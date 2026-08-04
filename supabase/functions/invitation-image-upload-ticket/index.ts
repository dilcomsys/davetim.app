// Signed upload URL for an editor image.
//
// The object path is generated in SQL and contains no user identifier, because
// invitation-images is a public bucket whose objects are referenced from
// published invitation pages.

import {
  adminClient,
  callRpc,
  jsonResponse,
  optionalString,
  PublicError,
  readJson,
  requireString,
  requireUserId,
  serve,
} from "@shared/runtime";

type Ticket = { ticketId: string; bucket: string; path: string };

serve(async (request) => {
  const userId = await requireUserId(request);
  const body = await readJson(request);
  const mimeType = requireString(body, "mimeType", 128);
  const fileName = requireString(body, "fileName", 260);
  const invitationId = optionalString(body, "invitationId", 64);
  const fileSize = body.fileSize;

  if (
    typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0
  ) {
    throw new PublicError("invalid_fileSize", 400);
  }

  const client = adminClient();
  const ticket = await callRpc<Ticket>(client, "mobile_issue_upload_ticket", {
    p_scope: "invitation_image",
    p_user_id: userId,
    p_invitation_id: invitationId,
    p_qr_code: null,
    p_kind: "image",
    p_mime: mimeType,
    p_file_size: fileSize,
    p_metadata: { fileName },
  });

  const { data, error } = await client.storage
    .from(ticket.bucket)
    .createSignedUploadUrl(ticket.path);

  if (error || !data) throw new PublicError("upload_url_unavailable", 502);

  return jsonResponse({
    ticketId: ticket.ticketId,
    bucket: ticket.bucket,
    path: ticket.path,
    token: data.token,
  });
});
