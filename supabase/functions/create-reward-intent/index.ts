// Opens a rewarded-ad intent. Grants nothing.
//
// The intent's nonce becomes the AdMob `custom_data` value. The reward itself
// is created only when the signed AdMob server-side verification callback
// arrives at the admob-ssv function.

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

const FEATURES = new Set([
  "single_watermark_free_export",
  "single_premium_template",
  "single_hd_export",
]);

// Remote kill switch. Set REWARDED_ADS_DISABLED_PLATFORMS to "ios",
// "android", or "ios,android" to stop issuing intents without shipping a build.
function platformDisabled(platform: string) {
  const disabled = (Deno.env.get("REWARDED_ADS_DISABLED_PLATFORMS") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return disabled.includes(platform) || disabled.includes("all");
}

serve(async (request) => {
  if (Deno.env.get("REWARDED_ADS_ENABLED") !== "true") {
    throw new PublicError("rewarded_ads_disabled", 403);
  }

  const userId = await requireUserId(request);
  const body = await readJson(request);
  const feature = requireString(body, "feature", 64);
  if (!FEATURES.has(feature)) throw new PublicError("unsupported_feature", 400);

  const platform = String(body.platform ?? "").toLowerCase() === "ios"
    ? "ios"
    : "android";
  if (platformDisabled(platform)) {
    throw new PublicError("rewarded_ads_disabled", 403);
  }

  const adUnitId = Deno.env.get(
    platform === "ios"
      ? "ADMOB_REWARDED_IOS_UNIT_ID"
      : "ADMOB_REWARDED_ANDROID_UNIT_ID",
  );
  if (!adUnitId) throw new PublicError("rewarded_ads_disabled", 403);

  const rawContext = body.context;
  const context =
    rawContext && typeof rawContext === "object" && !Array.isArray(rawContext)
      ? rawContext as Record<string, unknown>
      : {};

  const client = adminClient();
  const intent = await callRpc<{ intentId: string; customData: string }>(
    client,
    "mobile_create_reward_intent",
    {
      p_user_id: userId,
      p_feature: feature,
      p_platform: platform,
      p_ad_unit_id: adUnitId,
      p_context: context,
    },
  );

  return jsonResponse(intent);
});
