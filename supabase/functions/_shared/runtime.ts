// Shared helpers for the mobile-contract Edge Functions.
//
// Design rule: these functions hold the service role key, so they must contain
// no business invariants. Every rule that decides ownership, a quota, an
// entitlement or a counter lives in a security-definer SQL function. What is
// here is transport: CORS, JWT resolution, JSON shapes, and the two things SQL
// cannot do — signing storage URLs and verifying an AdMob signature.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Client-visible error. Anything else becomes a generic 500 so an internal
// message never reaches the app.
export class PublicError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PublicError";
    this.status = status;
  }
}

// The elevated key these functions talk to Postgres with.
//
// `service_role` is a JWT signed by the project's JWT secret, and Supabase no
// longer supports rotating that secret — the replacement for a leaked or
// suspect `service_role` key is a named secret key (`sb_secret_…`), which can
// be revoked on its own. The platform publishes those to the function runtime
// as `SUPABASE_SECRET_KEYS`, a JSON object keyed by the name given in the
// dashboard.
//
// Preferring it here, with the legacy variable as a fallback, is what turns the
// rotation into a dashboard-only operation: create the secret key, and these
// functions pick it up on their next invocation with no redeploy. Once the
// legacy keys are disabled the fallback simply stops being reachable.
//
// Only the outbound key changes. The platform's `verify_jwt` setting inspects
// the *incoming* Authorization header and is unaffected.
function elevatedKey(): string | undefined {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys) as Record<string, string>;
      const named = parsed.default ?? Object.values(parsed)[0];
      if (typeof named === "string" && named.length > 0) return named;
    } catch {
      // Malformed value: fall through rather than take the whole function down.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = elevatedKey();
  if (!url || !key) {
    throw new PublicError("server_misconfigured", 500);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Resolves the caller from the Authorization header. The user ID is taken from
// the verified token, never from the request body.
export async function requireUserId(request: Request): Promise<string> {
  const header = request.headers.get("Authorization");
  const token = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null;
  if (!token) throw new PublicError("not_authenticated", 401);

  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) throw new PublicError("not_authenticated", 401);
  return data.user.id;
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown>> {
  if (request.method === "GET") return {};
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export function requireString(
  body: Record<string, unknown>,
  key: string,
  max = 512,
): string {
  const value = body[key];
  if (typeof value !== "string" || value.length === 0 || value.length > max) {
    throw new PublicError(`invalid_${key}`, 400);
  }
  return value;
}

export function optionalString(
  body: Record<string, unknown>,
  key: string,
  max = 512,
): string | null {
  const value = body[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > max) {
    throw new PublicError(`invalid_${key}`, 400);
  }
  return value.length > 0 ? value : null;
}

// Postgres errors raised with `raise exception 'name'` arrive as a message.
// They are already safe, short identifiers, so they are passed through.
export function toResponse(error: unknown) {
  if (error instanceof PublicError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : "";
  const known = /^[a-z_]{3,48}$/.test(message);
  return jsonResponse(
    { error: known ? message : "unexpected_error" },
    known ? 400 : 500,
  );
}

export function serve(handler: (request: Request) => Promise<Response>) {
  Deno.serve(async (request: Request) => {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    try {
      return await handler(request);
    } catch (error) {
      return toResponse(error);
    }
  });
}

// Short-lived download URL for a private object. Never logged.
export async function signDownload(
  client: SupabaseClient,
  bucket: string,
  path: string | null,
  expiresIn = 900,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await client.storage.from(bucket).createSignedUrl(
    path,
    expiresIn,
  );
  if (error || !data) return null;
  return data.signedUrl;
}

export async function callRpc<T>(
  client: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new PublicError(error.message, 400);
  return data as T;
}
