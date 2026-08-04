// AdMob server-side verification callback.
//
// Google calls this as a GET with a signed query string. This function is the
// only place a reward can be created, so it verifies before it grants:
//
//   1. The signed content is the query string up to, but not including,
//      "&signature=". It must be used byte for byte as received — reordering
//      or re-encoding the parameters invalidates the signature.
//   2. The ECDSA P-256 signature is checked against Google's published
//      verifier key matching key_id. Keys are cached in memory.
//   3. The timestamp must be inside a narrow window.
//   4. The ad unit must be one this project owns.
//   5. mobile_grant_reward_receipt binds the callback to a pending intent for
//      the same user and is idempotent on transaction_id, so a replay returns
//      the original receipt instead of a second reward.
//
// Deploy with verify_jwt = false: the caller is Google, not a signed-in user.
// See supabase/config.toml.

import { adminClient, callRpc } from "@shared/runtime";

const VERIFIER_KEYS_URL = "https://gstatic.com/admob/reward/verifier-keys.json";
const TIMESTAMP_WINDOW_MS = 10 * 60 * 1000;

type VerifierKey = { keyId: number; pem: string; base64: string };

let keyCache: { fetchedAt: number; keys: Map<string, CryptoKey> } | null = null;

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

// WebCrypto expects the IEEE P1363 fixed-width form; AdMob sends DER.
function derToP1363(der: Uint8Array): Uint8Array<ArrayBuffer> {
  if (der[0] !== 0x30) throw new Error("bad_signature");
  let offset = der[1] & 0x80 ? 2 + (der[1] & 0x7f) : 2;

  const readInteger = () => {
    if (der[offset] !== 0x02) throw new Error("bad_signature");
    const length = der[offset + 1];
    let start = offset + 2;
    const end = start + length;
    while (der[start] === 0x00 && end - start > 1) start += 1;
    offset = end;
    return der.slice(start, end);
  };

  const r = readInteger();
  const s = readInteger();
  if (r.length > 32 || s.length > 32) throw new Error("bad_signature");

  const output = new Uint8Array(64);
  output.set(r, 32 - r.length);
  output.set(s, 64 - s.length);
  return output;
}

async function verifierKeys(): Promise<Map<string, CryptoKey>> {
  if (keyCache && Date.now() - keyCache.fetchedAt < 6 * 60 * 60 * 1000) {
    return keyCache.keys;
  }

  const response = await fetch(VERIFIER_KEYS_URL);
  if (!response.ok) throw new Error("verifier_keys_unavailable");
  const payload = await response.json() as { keys: VerifierKey[] };

  const keys = new Map<string, CryptoKey>();
  for (const entry of payload.keys ?? []) {
    const spki = base64ToBytes(entry.base64);
    const key = await crypto.subtle.importKey(
      "spki",
      spki,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    keys.set(String(entry.keyId), key);
  }

  keyCache = { fetchedAt: Date.now(), keys };
  return keys;
}

function allowedAdUnits(): Set<string> {
  return new Set(
    [
      Deno.env.get("ADMOB_REWARDED_IOS_UNIT_ID"),
      Deno.env.get("ADMOB_REWARDED_ANDROID_UNIT_ID"),
    ].filter((value): value is string => Boolean(value)),
  );
}

Deno.serve(async (request) => {
  // Google retries on non-2xx. Anything that is definitively invalid returns
  // 400 so it is not retried; transient failures return 500 so it is.
  try {
    const url = new URL(request.url);
    const rawQuery = url.search.startsWith("?")
      ? url.search.slice(1)
      : url.search;
    const signatureIndex = rawQuery.indexOf("&signature=");
    if (signatureIndex < 0) {
      return new Response("missing_signature", { status: 400 });
    }

    const signedContent = rawQuery.slice(0, signatureIndex);
    const parameters = url.searchParams;
    const signature = parameters.get("signature");
    const keyId = parameters.get("key_id");
    if (!signature || !keyId) {
      return new Response("missing_signature", { status: 400 });
    }

    const keys = await verifierKeys();
    const key = keys.get(keyId);
    if (!key) return new Response("unknown_key", { status: 400 });

    const verified = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      derToP1363(base64ToBytes(signature)),
      new TextEncoder().encode(signedContent),
    );
    if (!verified) return new Response("invalid_signature", { status: 400 });

    const timestampMs = Number(parameters.get("timestamp") ?? "0");
    if (
      !Number.isFinite(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > TIMESTAMP_WINDOW_MS
    ) {
      return new Response("stale_callback", { status: 400 });
    }

    // The signature above is already checked against Google's own key, so a
    // callback that reaches this line provably came from Google — forging it
    // requires their private key. An ad_unit outside this project's allowlist
    // is therefore not a forged request; it is most commonly AdMob's own
    // "Verify URL" setup check, whose test payload always sends a fixed
    // placeholder ("ad_unit=1234567890", "transaction_id=123456789") rather
    // than this project's real unit ID. There is no reward to grant, but the
    // request is genuine, so it is acknowledged rather than rejected — 400
    // here is exactly what fails AdMob's setup UI, and it would also send
    // Google into its five-retry backoff for a callback that was never going
    // to match on retry either.
    const adUnit = parameters.get("ad_unit");
    const allowed = allowedAdUnits();
    if (allowed.size > 0 && (!adUnit || !allowed.has(adUnit))) {
      return new Response("acknowledged_no_grant", { status: 200 });
    }

    await callRpc(adminClient(), "mobile_grant_reward_receipt", {
      p_nonce: parameters.get("custom_data"),
      p_admob_transaction_id: parameters.get("transaction_id"),
      p_admob_user_id: parameters.get("user_id"),
    });

    return new Response("ok", { status: 200 });
  } catch (error) {
    const message = error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";

    // By this point the ECDSA signature has already been verified against
    // Google's own key, so the caller is provably Google's SSV sender, not an
    // attacker. These codes mean the callback carries no reward we can act
    // on — most commonly the synthetic callback AdMob's own "Verify URL" UI
    // sends when setting up SSV, which references no real reward_intents row.
    // A 400 here reads to that UI as "your server rejects valid callbacks"
    // and fails setup; a 200 with no grant is the outcome Google actually
    // expects, and it also spares real delayed/duplicate callbacks from
    // Google's five-retry backoff.
    const unaddressable = new Set([
      "intent_not_found",
      "intent_expired",
      "intent_not_pending",
      "user_mismatch",
    ]);
    if (unaddressable.has(message)) {
      return new Response("acknowledged_no_grant", { status: 200 });
    }

    // Grant rules rejected the callback for a reason worth surfacing: permanent, do not retry.
    if (/^[a-z_]{3,48}$/.test(message)) {
      return new Response(message, { status: 400 });
    }
    return new Response("temporary_failure", { status: 500 });
  }
});
