// Owner and public QR gallery reads.
//
// This is an Edge Function rather than a plain RPC because the response needs
// short-lived signed URLs, and only a service role can mint them. The row
// projection and the scan-counter rate limit still come from SQL:
// public.mobile_owner_media_context and public.mobile_public_media_context.

import {
  adminClient,
  callRpc,
  jsonResponse,
  PublicError,
  readJson,
  requireString,
  requireUserId,
  serve,
  signDownload,
} from "@shared/runtime";

const BUCKET = "qr-media";
const SIGNED_URL_TTL_SECONDS = 900;

type MediaContext = {
  media: Record<string, unknown> & { storage_path: string | null };
  uploads: (Record<string, unknown> & { storage_path: string | null })[];
};

serve(async (request) => {
  const body = await readJson(request);
  const scope = requireString(body, "scope", 16);
  const client = adminClient();

  let context: MediaContext | null;

  if (scope === "owner") {
    const userId = await requireUserId(request);
    context = await callRpc<MediaContext | null>(
      client,
      "mobile_owner_media_context",
      {
        p_invitation_id: requireString(body, "invitationId", 64),
        p_user_id: userId,
      },
    );
  } else if (scope === "public") {
    context = await callRpc<MediaContext | null>(
      client,
      "mobile_public_media_context",
      {
        p_qr_code: requireString(body, "qrCode", 64),
      },
    );
  } else {
    throw new PublicError("invalid_scope", 400);
  }

  if (!context) return jsonResponse(null);

  // storage_path is replaced, not accompanied: the raw path never leaves the
  // server, so a client cannot construct its own object requests.
  const { storage_path: mediaPath, ...media } = context.media;
  const uploads = await Promise.all(
    context.uploads.map(async ({ storage_path: uploadPath, ...upload }) => ({
      ...upload,
      signed_url: await signDownload(
        client,
        BUCKET,
        uploadPath,
        SIGNED_URL_TTL_SECONDS,
      ),
    })),
  );

  return jsonResponse({
    media: {
      ...media,
      signed_url: await signDownload(
        client,
        BUCKET,
        mediaPath,
        SIGNED_URL_TTL_SECONDS,
      ),
    },
    uploads,
  });
});
