import type { RewardedAdGateway } from '@/features/ads/rewarded-feature';

export const rewardedAdGateway: RewardedAdGateway = {
  async isReady() { return false; },
  async requestReward() { return { granted: false }; },
};
