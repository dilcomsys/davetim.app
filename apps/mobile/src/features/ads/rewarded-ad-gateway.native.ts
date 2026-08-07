import { Platform } from 'react-native';

import { featureFlags } from '@/config/feature-flags';
import type { RewardedAdGateway, RewardedFeatureKey } from '@/features/ads/rewarded-feature';
import { RemoteDataError } from '@/lib/remote-data';
import { requireSupabaseClient } from '@/lib/supabase';

/*
 * react-native-google-mobile-ads is loaded on demand, never at module scope.
 *
 * Its spec files call TurboModuleRegistry.getEnforcing(...) while they are
 * being evaluated, and getEnforcing throws when the native module is absent.
 * Expo Go does not bundle it, so a static import crashed the app on launch:
 * the templates tab imports this gateway, and tabs load at startup.
 *
 * Deferring the import means the module is only touched when someone actually
 * asks for a reward, which cannot happen unless the feature flag is on and a
 * development build is running.
 */
type AdsModule = typeof import('react-native-google-mobile-ads');

let adsModule: Promise<AdsModule> | null = null;
let initialization: Promise<unknown> | null = null;

/*
 * Dynamic `import()` of this package does not always hand back the shape the
 * types promise. It ships CommonJS, and depending on how the bundler applies
 * its interop the namespace can arrive wrapped one level deeper, so `mod.default`
 * is the module object rather than the `MobileAds` function. Calling it then
 * fails with "undefined is not a function" from inside a tap handler, with
 * nothing in the message to say which symbol was missing.
 *
 * Unwrapping first and then checking the handful of symbols this file actually
 * uses turns that into a named failure. The check is cheap and runs once,
 * because the module promise is memoised.
 */
const REQUIRED_SYMBOLS = ['AdsConsent', 'RewardedAd', 'RewardedAdEventType', 'AdEventType'] as const;

function unwrap(module: unknown): AdsModule {
  const candidate = module as { default?: unknown };
  // A correctly interopped namespace has `default` as the MobileAds function.
  // A double-wrapped one has `default` as another namespace object.
  if (candidate?.default && typeof candidate.default === 'object' && 'AdsConsent' in (candidate.default as object)) {
    return candidate.default as AdsModule;
  }
  return module as AdsModule;
}

function assertUsable(ads: AdsModule) {
  const missing = REQUIRED_SYMBOLS.filter((name) => !(ads as unknown as Record<string, unknown>)[name]);
  if (typeof (ads as unknown as { default?: unknown }).default !== 'function') missing.push('MobileAds' as never);
  if (missing.length > 0) {
    throw new RemoteDataError(
      `Reklam bileşeni bu sürümde eksik (${missing.join(', ')}). Uygulamayı mağaza sürümünde deneyin.`,
    );
  }
}

function loadAdsModule(): Promise<AdsModule> {
  adsModule ??= import('react-native-google-mobile-ads')
    .then((module) => {
      const ads = unwrap(module);
      assertUsable(ads);
      return ads;
    })
    .catch((error) => {
      // A failed check already carries a useful message; anything else means the
      // native module is absent, which is the Expo Go case.
      if (error instanceof RemoteDataError) throw error;
      throw new RemoteDataError('Ödüllü reklamlar yalnızca mağaza sürümünde çalışır.');
    });
  return adsModule;
}

function productionUnitId() {
  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_UNIT_ID
    : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_UNIT_ID;
}

/*
 * Always the real ad unit, in development too.
 *
 * TestIds.REWARDED belongs to Google's demo account, not ours, so our
 * server-side verification URL is not attached to it and AdMob never posts a
 * callback. The reward then never leaves `pending`: the ad plays, the poll in
 * waitForServerReceipt runs its full twenty seconds and the feature fails with
 * a timeout that looks like a backend fault but is not one.
 *
 * A real unit keeps the SSV chain intact. Serving *live* ads to a development
 * device would be invalid traffic, so development registers the device as a
 * test device instead — same unit, same callback, test creatives.
 */
function adUnitId() {
  const value = productionUnitId();
  if (!value) throw new RemoteDataError('Ödüllü reklam birimi yapılandırılmamış.');
  return value;
}

function testDeviceIds() {
  return (process.env.EXPO_PUBLIC_ADMOB_TEST_DEVICE_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

type MobileAdsClient = {
  initialize: () => Promise<unknown>;
  setRequestConfiguration: (config: { testDeviceIdentifiers: string[] }) => Promise<unknown>;
};

async function initializeAds(ads: AdsModule) {
  try {
    await ads.AdsConsent.gatherConsent();
  } catch {
    // UMP may reuse a valid response from an earlier session.
  }
  const consent = await ads.AdsConsent.getConsentInfo();
  if (!consent.canRequestAds) throw new RemoteDataError('Reklam tercihi tamamlanmadan reklam gösterilemez.');
  const mobileAds = (ads as unknown as { default: () => MobileAdsClient }).default;
  initialization ??= (async () => {
    if (__DEV__) {
      const identifiers = testDeviceIds();
      if (identifiers.length === 0) {
        // The SDK logs the device's own identifier on the first ad request;
        // copy it into EXPO_PUBLIC_ADMOB_TEST_DEVICE_IDS.
        console.warn(
          '[ads] EXPO_PUBLIC_ADMOB_TEST_DEVICE_IDS boş. Geliştirme cihazına gerçek reklam '
          + 'servis edilir; AdMob bunu geçersiz trafik sayabilir.',
        );
      } else {
        await mobileAds().setRequestConfiguration({ testDeviceIdentifiers: identifiers });
      }
    }
    await mobileAds().initialize();
  })();
  await initialization;
}

function showRewardedAd(ads: AdsModule, userId: string, customData: string) {
  return new Promise<void>((resolve, reject) => {
    const ad = ads.RewardedAd.createForAdRequest(adUnitId(), {
      requestNonPersonalizedAdsOnly: true,
      serverSideVerificationOptions: { customData, userId },
    });
    let earned = false;
    let settled = false;
    let loadTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => finish(new RemoteDataError('Reklam zamanında yüklenemedi.')), 30_000);
    const listeners: (() => void)[] = [];

    function cleanup() {
      if (loadTimer) clearTimeout(loadTimer);
      listeners.forEach((unsubscribe) => unsubscribe());
    }

    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    }

    listeners.push(ad.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
      if (loadTimer) clearTimeout(loadTimer);
      loadTimer = null;
      void ad.show().catch((error) => finish(new RemoteDataError('Reklam gösterilemedi.', error)));
    }));
    listeners.push(ad.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => { earned = true; }));
    listeners.push(ad.addAdEventListener(ads.AdEventType.ERROR, (error) => finish(new RemoteDataError('Reklam yüklenemedi.', error))));
    listeners.push(ad.addAdEventListener(ads.AdEventType.CLOSED, () => finish(earned ? undefined : new RemoteDataError('Ödül kazanmak için reklamı tamamlamalısınız.'))));
    ad.load();
  });
}

function intent(value: unknown): { customData: string; intentId: string } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.customData === 'string' && typeof candidate.intentId === 'string'
    ? { customData: candidate.customData, intentId: candidate.intentId }
    : null;
}

async function waitForServerReceipt(intentId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await requireSupabaseClient().rpc('get_reward_intent_status', { p_intent_id: intentId });
    if (error) throw new RemoteDataError('Ödül doğrulaması sorgulanamadı.', error);
    const candidate = Array.isArray(data) ? data[0] : data;
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      const status = (candidate as Record<string, unknown>).status;
      const receiptId = (candidate as Record<string, unknown>).receipt_id;
      if (status === 'granted' && typeof receiptId === 'string') return receiptId;
      if (status === 'rejected' || status === 'expired') throw new RemoteDataError('Reklam ödülü doğrulanamadı.');
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new RemoteDataError('Ödül doğrulaması gecikti. Hak tanımlandığında tekrar deneyin.');
}

export const rewardedAdGateway: RewardedAdGateway = {
  async isReady() {
    return featureFlags.rewardedAds && Boolean(productionUnitId());
  },
  async requestReward(feature: RewardedFeatureKey, context) {
    if (!featureFlags.rewardedAds) throw new RemoteDataError('Ödüllü reklamlar şu anda kapalı.');
    const supabase = requireSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new RemoteDataError('Ödül için oturum açmanız gerekiyor.', authError);
    const { data, error } = await supabase.functions.invoke('create-reward-intent', {
      body: { context: context ?? {}, feature, platform: Platform.OS === 'ios' ? 'ios' : 'android' },
    });
    if (error) throw new RemoteDataError('Ödül isteği oluşturulamadı.', error);
    const createdIntent = intent(data);
    if (!createdIntent) throw new RemoteDataError('Ödül isteği yanıtı geçersiz.');
    const ads = await loadAdsModule();
    await initializeAds(ads);
    await showRewardedAd(ads, authData.user.id, createdIntent.customData);
    const receiptId = await waitForServerReceipt(createdIntent.intentId);
    return { granted: true, receiptId };
  },
};
