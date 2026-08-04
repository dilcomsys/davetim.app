export type RewardedFeatureKey =
  | 'single_watermark_free_export'
  | 'single_premium_template'
  | 'single_hd_export';

export type RewardedFeature = {
  key: RewardedFeatureKey;
  title: string;
  description: string;
  rewardLabel: string;
};

export const rewardedFeatures: RewardedFeature[] = [
  {
    key: 'single_watermark_free_export',
    title: 'Filigransız dışa aktar',
    description: 'Bir davet için tek kullanımlık temiz çıktı hakkı.',
    rewardLabel: '1 reklam · 1 çıktı',
  },
  {
    key: 'single_premium_template',
    title: 'Premium şablon kullan',
    description: 'Seçtiğin şablonu bir davette kullanıma aç.',
    rewardLabel: '1 reklam · 1 davet',
  },
  {
    key: 'single_hd_export',
    title: 'HD çıktı al',
    description: 'Bir tasarımı yüksek çözünürlükte dışa aktar.',
    rewardLabel: '1 reklam · 1 çıktı',
  },
];

export type RewardedAdGateway = {
  isReady(feature: RewardedFeatureKey): Promise<boolean>;
  requestReward(feature: RewardedFeatureKey, context?: { invitationId?: string; templateId?: string }): Promise<{ granted: boolean; receiptId?: string }>;
};

export const developmentRewardedAdGateway: RewardedAdGateway = {
  async isReady() {
    return false;
  },
  async requestReward() {
    return { granted: false };
  },
};

export async function consumeRewardReceipt(receiptId: string, feature: RewardedFeatureKey, invitationId?: string) {
  const { requireSupabaseClient } = await import('@/lib/supabase');
  const { RemoteDataError } = await import('@/lib/remote-data');
  const { data, error } = await requireSupabaseClient().rpc('consume_reward_receipt', {
    p_feature: feature,
    p_invitation_id: invitationId ?? null,
    p_receipt_id: receiptId,
  });
  if (error) throw new RemoteDataError('Ödül hakkı kullanılamadı.', error);
  if (data !== true) throw new RemoteDataError('Ödül hakkı geçersiz veya daha önce kullanılmış.');
}
