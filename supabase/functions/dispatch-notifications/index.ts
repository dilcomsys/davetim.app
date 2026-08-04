// Flushes the notification outbox to Expo's push service.
//
// This endpoint takes no instruction from its caller. It accepts no body, no
// query parameters, and no identifiers — it sends exactly what the database
// already decided to send, and nothing else. That is deliberate: it is what
// lets the trigger call it without embedding a key in a SQL string, which is
// how the retired cron job leaked the service role key in the first place. The
// worst an anonymous caller can do is ask the queue to drain sooner.
//
// Claiming is done inside `mobile_claim_notifications`, which increments
// `attempts` in the same statement that selects the batch and skips locked
// rows, so two overlapping runs cannot send the same notification twice.
//
// Deploy with verify_jwt = false: the caller is Postgres, not a signed-in user.

import { adminClient, callRpc, jsonResponse, serve } from "@shared/runtime";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_LIMIT = 50;

type Claimed = {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  tokens: string[];
};

type ExpoTicket = {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
};

/*
 * Expo reports a per-message result in the same order it was given the
 * messages. `DeviceNotRegistered` is the only error worth acting on: it means
 * the install is gone, and keeping the token would put a known-dead recipient
 * in every future send.
 */
async function pushToExpo(
  messages: Record<string, unknown>[],
): Promise<ExpoTicket[]> {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accept": "application/json",
      "accept-encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) throw new Error("push_service_unavailable");
  const payload = await response.json() as { data?: ExpoTicket[] };
  return payload.data ?? [];
}

serve(async () => {
  const client = adminClient();
  const claimed = await callRpc<Claimed[]>(
    client,
    "mobile_claim_notifications",
    {
      p_limit: BATCH_LIMIT,
    },
  );

  if (!claimed || claimed.length === 0) {
    return jsonResponse({ dispatched: 0 });
  }

  let sent = 0;

  for (const item of claimed) {
    // Nobody to deliver to — the account has no registered device. Settling as
    // `skipped` stops it being retried forever.
    if (!item.tokens || item.tokens.length === 0) {
      await callRpc(client, "mobile_settle_notification", {
        p_id: item.id,
        p_status: "skipped",
        p_invalid_tokens: [],
      });
      continue;
    }

    const messages = item.tokens.map((token) => ({
      to: token,
      title: item.title,
      body: item.body,
      data: item.data ?? {},
      sound: "default",
      channelId: "default",
      priority: "high",
    }));

    try {
      const tickets = await pushToExpo(messages);
      const invalid = tickets
        .map((
          ticket,
          index,
        ) => (ticket.details?.error === "DeviceNotRegistered"
          ? item.tokens[index]
          : null)
        )
        .filter((token): token is string => token !== null);
      const delivered = tickets.some((ticket) => ticket.status === "ok");

      await callRpc(client, "mobile_settle_notification", {
        p_id: item.id,
        p_status: delivered ? "sent" : "failed",
        p_invalid_tokens: invalid,
      });
      if (delivered) sent += 1;
    } catch {
      // Left unsettled on purpose: `attempts` was already incremented, so the
      // next run picks it up and it gives up after three tries.
    }
  }

  return jsonResponse({ claimed: claimed.length, dispatched: sent });
});
