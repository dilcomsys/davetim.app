declare module '@/features/ads/rewarded-ad-gateway' {
  import type { RewardedAdGateway } from '@/features/ads/rewarded-feature';
  export const rewardedAdGateway: RewardedAdGateway;
}

declare module '@/features/analytics/analytics-gateway' {
  import type { AnalyticsGateway } from '@/features/analytics/analytics-types';
  export const analyticsGateway: AnalyticsGateway;
}

declare module '@/features/notifications/notification-gateway' {
  import type { NotificationGateway } from '@/features/notifications/notification-types';
  export const notificationGateway: NotificationGateway;
}

declare module '@/features/auth/apple-auth' {
  import type { AppleAuthGateway } from '@/features/auth/apple-auth-types';
  export const appleAuth: AppleAuthGateway;
}

declare module '@/lib/local-file' {
  import type { ReadFileBytes, ReadFileSize } from '@/lib/local-file-types';
  export const readFileBytes: ReadFileBytes;
  export const readFileSize: ReadFileSize;
}
