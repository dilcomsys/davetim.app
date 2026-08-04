export const featureFlags = {
  backendWrites: process.env.EXPO_PUBLIC_ENABLE_BACKEND_WRITES === 'true',
  rewardedAds: process.env.EXPO_PUBLIC_ENABLE_REWARDED_ADS === 'true',
} as const;

export const publicAppOrigin = process.env.EXPO_PUBLIC_PUBLIC_APP_URL?.replace(/\/$/, '') ?? null;

export class WritesDisabledError extends Error {
  constructor() {
    super('Veritabanı yazımları staging güvenlik kontrolleri tamamlanana kadar kapalı.');
    this.name = 'WritesDisabledError';
  }
}

export function assertBackendWritesEnabled() {
  if (!featureFlags.backendWrites) throw new WritesDisabledError();
}
