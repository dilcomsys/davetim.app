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

function loadAdsModule(): Promise<AdsModule> {
  adsModule ??= import('react-native-google-mobile-ads').catch(() => {
    throw new RemoteDataError('Ödüllü reklamlar yalnızca mağaza sürümünde çalışır.');
  });
  return adsModule;
}

function productionUnitId() {
  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_UNIT_ID
    : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_UNIT_ID;
}

function adUnitId(ads: AdsModule) {
  if (__DEV__) return ads.TestIds.REWARDED;
  const value = productionUnitId();
  if (!value) throw new RemoteDataError('Ödüllü reklam birimi yayın için yapılandırılmamış.');
  return value;
}

async function initializeAds(ads: AdsModule) {
  try {
    await ads.AdsConsent.gatherConsent();
  } catch {
    // UMP may reuse a valid response from an earlier session.
  }
  const consent = await ads.AdsConsent.getConsentInfo();
  if (!consent.canRequestAds) throw new RemoteDataError('Reklam tercihi tamamlanmadan reklam gösterilemez.');
  initialization ??= ads.default().initialize();
  await initialization;
}

function showRewardedAd(ads: AdsModule, userId: string, customData: string) {
  return new Promise<void>((resolve, reject) => {
    const ad = ads.RewardedAd.createForAdRequest(adUnitId(ads), {
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
    return featureFlags.rewardedAds && Boolean(__DEV__ || productionUnitId());
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
