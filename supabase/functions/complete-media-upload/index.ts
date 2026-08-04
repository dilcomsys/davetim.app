// Confirms an upload after the object has landed in storage.
//
// The client's claims about size and MIME are ignored. The object is
// re-inspected here, and the row is written by
// public.mobile_record_media_upload, which re-checks the quota inside the same
// transaction that increments it. An object that fails inspection is deleted
// so storage never keeps an orphan.

import {
  adminClient,
  callRpc,
  jsonResponse,
  PublicError,
  readJson,
  requireString,
  serve,
} from "@shared/runtime";

type Ticket = {
  bucket_id: string;
  object_path: string;
  scope: string;
  max_bytes: string | number;
  expected_mime: string;
};

serve(async (request) => {
  const body = await readJson(request);
  const ticketId = requireString(body, "ticketId", 128);
  const client = adminClient();

  // Claiming marks the ticket used, so a replayed completion finds nothing.
  const ticket = await callRpc<Ticket>(client, "mobile_claim_upload_ticket", {
    p_ticket_id: ticketId,
  });

  const folder = ticket.object_path.includes("/")
    ? ticket.object_path.slice(0, ticket.object_path.lastIndexOf("/"))
    : "";
  const fileName = ticket.object_path.slice(
    ticket.object_path.lastIndexOf("/") + 1,
  );

  const { data: listed, error: listError } = await client.storage
    .from(ticket.bucket_id)
    .list(folder, { limit: 1, search: fileName });

  const object = listed?.find((entry) => entry.name === fileName);
  if (listError || !object) {
    throw new PublicError("uploaded_object_missing", 400);
  }

  const actualSize = Number(object.metadata?.size ?? 0);
  const actualMime = String(object.metadata?.mimetype ?? "");

  try {
    const result = await callRpc<Record<string, unknown>>(
      client,
      "mobile_record_media_upload",
      {
        p_ticket: ticket,
        p_actual_size: actualSize,
        p_actual_mime: actualMime,
      },
    );
    return jsonResponse(result);
  } catch (error) {
    await client.storage.from(ticket.bucket_id).remove([ticket.object_path]);
    throw error;
  }
});
