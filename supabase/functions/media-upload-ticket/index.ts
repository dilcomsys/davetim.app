// Issues a short-lived signed upload URL for owner media or a guest upload.
//
// Ownership, quota, consent, MIME and size rules all live in
// public.mobile_issue_upload_ticket. This function only resolves the caller and
// turns the ticket's object path into a signed upload token.

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
  const body = await readJson(request);
  const scope = requireString(body, "scope", 16);
  const kind = requireString(body, "kind", 8);
  const mimeType = requireString(body, "mimeType", 128);
  const fileName = requireString(body, "fileName", 260);
  const fileSize = body.fileSize;

  if (
    typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0
  ) {
    throw new PublicError("invalid_fileSize", 400);
  }

  const client = adminClient();
  let userId: string | null = null;
  let invitationId: string | null = null;
  let qrCode: string | null = null;
  const metadata: Record<string, unknown> = { fileName };

  if (scope === "owner") {
    userId = await requireUserId(request);
    invitationId = requireString(body, "invitationId", 64);
    metadata.title = optionalString(body, "title", 120);
  } else if (scope === "guest") {
    // Anonymous by design. The QR code plus the server-side consent and quota
    // checks are the only authorisation.
    qrCode = requireString(body, "qrCode", 64);
    metadata.consent = body.consent === true ? "true" : "false";
    metadata.guestName = optionalString(body, "guestName", 80);
    metadata.note = optionalString(body, "note", 400);
  } else {
    throw new PublicError("invalid_scope", 400);
  }

  const ticket = await callRpc<Ticket>(client, "mobile_issue_upload_ticket", {
    p_scope: scope === "owner" ? "owner_media" : "guest_media",
    p_user_id: userId,
    p_invitation_id: invitationId,
    p_qr_code: qrCode,
    p_kind: kind,
    p_mime: mimeType,
    p_file_size: fileSize,
    p_metadata: metadata,
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
