/**
 * useSubscription Hook
 * 
 * Kullanıcının abonelik bilgilerini ve plan kontrollerini
 * kolayca kullanmak için React hook.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/authStore';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { PlanTier, getPlanConfig, DEFAULT_PLAN, PlanConfig, needsUpgrade } from '../config/plans';

export interface UseSubscriptionReturn {
  // Abonelik bilgileri
  subscription: Subscription | null;
  planConfig: PlanConfig | null;
  isLoading: boolean;
  
  // Plan bilgileri
  currentPlan: PlanTier;
  planName: string;
  isFreePlan: boolean;
  isProPlan: boolean;
  isPremiumPlan: boolean;
  isBusinessPlan: boolean;
  
  // Özellik kontrolleri
  canCreateInvitation: () => Promise<{ allowed: boolean; reason?: string }>;
  canAccessPremiumTemplates: () => Promise<{ allowed: boolean; reason?: string }>; // PRO+ şablonlara erişim
  canAccessTemplate: (templateTier: 'free' | 'pro' | 'premium') => boolean; // Belirli tier şablona erişim
  canUploadImage: () => Promise<{ allowed: boolean; reason?: string }>;
  canShareWhatsApp: () => Promise<{ allowed: boolean; reason?: string }>;
  canExportExcel: () => Promise<{ allowed: boolean; reason?: string }>;
  canUseQRMedia: () => Promise<{ allowed: boolean; reason?: string }>;
  canUseAIDesign: () => Promise<{ allowed: boolean; reason?: string }>;
  canUploadImageWithSize: (fileSizeMB: number) => Promise<{ allowed: boolean; reason?: string }>;
  canAddGuest: (invitationId: string, currentGuestCount: number) => Promise<{ allowed: boolean; reason?: string }>;
  
  // Genel kontrol fonksiyonu
  checkFeatureAccess: (feature: string) => Promise<{ allowed: boolean; reason?: string }>;
  
  // Yardımcı fonksiyonlar
  needsUpgradeFor: (feature: string) => boolean;
  getRemainingInvitations: () => number | 'unlimited';
  getStorageUsagePercentage: () => number;
  getRemainingStorageMB: () => number;
  canCancelWithRefund: () => { canRefund: boolean; daysLeft: number };
  
  // Refresh
  refreshSubscription: () => Promise<void>;
}

// Helper to check subscription validity
const checkSubscriptionValidity = (sub: Subscription | null): boolean => {
  if (!sub) return false;
  
  const now = new Date();
  const endDate = sub.endDate ? new Date(sub.endDate) : null;
  const isEndDateValid = endDate && endDate > now;
  
  return sub.status === 'active' || 
         sub.status === 'trialing' ||
         (sub.status === 'cancelled' && isEndDateValid);
};

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState({ lifetime: 0, monthly: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Abonelik bilgilerini yükle
  const loadSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setUsage({ lifetime: 0, monthly: 0 });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const sub = await subscriptionService.getUserSubscription(user.id);
      setSubscription(sub);
      
      // Load real-time usage
      const counts = await subscriptionService.getInvitationUsage(user.id);
      setUsage(counts);
    } catch (error) {
      console.error('❌ Load subscription error:', error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);
  
  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);
  
  // Listen for subscription update events
  useEffect(() => {
    const handleSubscriptionUpdate = (event: any) => {
      console.log('📢 [useSubscription] Received subscription update event:', event.detail);
      loadSubscription();
    };
    
    window.addEventListener('subscription-updated', handleSubscriptionUpdate);
    
    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    };
  }, [loadSubscription]);
  
  // Plan bilgileri - tier field'ini kullan (planId yok)
  // Eğer abonelik geçersizse (expire olmuşsa) FREE olarak davran
  const currentPlan = (subscription && checkSubscriptionValidity(subscription)) 
    ? subscription.tier 
    : DEFAULT_PLAN;
  
  const planConfig = getPlanConfig(currentPlan);
  const planName = planConfig.name;
  
  // Plan tipleri
  const isFreePlan = currentPlan === 'free';
  const isProPlan = currentPlan === 'pro';
  const isPremiumPlan = currentPlan === 'premium';
  const isBusinessPlan = false; // Kurumsal planlar kaldırıldı
  
  // Özellik kontrol fonksiyonları
  const checkFeatureAccess = async (feature: string) => {
    if (!user?.id) {
      return { allowed: false, reason: 'Lütfen giriş yapın' };
    }
    
    // Get current subscription (fresh)
    const currentSubscription = await subscriptionService.getUserSubscription(user.id);
    
    // Effective subscription logic:
    // If no subscription or invalid (expired), treat as FREE tier for feature checks
    const effectiveSubscription = (currentSubscription && checkSubscriptionValidity(currentSubscription))
      ? currentSubscription
      : { ...(currentSubscription || { id: 'mock', userId: user.id }), tier: 'free' } as Subscription;
      
    const allowed = subscriptionService.canAccessFeature(feature, effectiveSubscription);
    
    return { 
      allowed, 
      reason: allowed ? 'Erişim izni var' : 'Bu özellik için premium plan gerekli' 
    };
  };
  
  // Davetiye oluşturma limiti kontrolü - USAGE LIMIT check
  const canCreateInvitation = async (): Promise<{ allowed: boolean; reason?: string }> => {
    if (!user?.id) {
      return { allowed: false, reason: 'Lütfen giriş yapın' };
    }
    
    // Get current subscription
    const currentSubscription = await subscriptionService.getUserSubscription(user.id);
    
    // Eğer abonelik expire ise (veya yoksa), FREE plan limitlerine göre kontrol et
    const tier = (currentSubscription && checkSubscriptionValidity(currentSubscription)) 
      ? currentSubscription.tier 
      : 'free';
    
    // Check invitation creation limit (usage limit) using REAL-TIME counts
    const result = await subscriptionService.checkInvitationLimits(user.id, tier);
    
    return {
      allowed: result.allowed,
      reason: result.reason
    };
  };
  
  const canAccessPremiumTemplates = () => checkFeatureAccess('premium_templates');
  const canUploadImage = () => checkFeatureAccess('image_upload');
  const canShareWhatsApp = () => checkFeatureAccess('whatsapp_sharing');
  const canExportExcel = () => checkFeatureAccess('excel_export');
  const canUseQRMedia = () => checkFeatureAccess('qr_media');
  const canUseAIDesign = () => checkFeatureAccess('ai_design');
  
  // Storage kontrolü
  const canUploadImageWithSize = async (fileSizeMB: number): Promise<{ allowed: boolean; reason?: string }> => {
    if (!subscription) {
      return { allowed: false, reason: 'Abonelik bilgisi bulunamadı' };
    }
    
    // Önce image upload yetkisi var mı kontrol et (Expire durumu checkFeatureAccess içinde yönetiliyor)
    const imageAccess = await canUploadImage();
    if (!imageAccess.allowed) {
      return imageAccess;
    }
    
    // Storage limitini kontrol et
    // Not: storageUsedMb veritabanında snake_case olabilir ama mapped objede camelCase
    // Interface'e göre: storageUsedMb. Ancak kodda bazen storageUsedMB kullanılmış olabilir.
    // subscriptionService'deki mapToSubscription: storageUsedMb
    const remainingStorage = planConfig.limits.storageMB - subscription.storageUsedMb;
    
    if (fileSizeMB > remainingStorage) {
      return {
        allowed: false,
        reason: `Yetersiz depolama alanı. Kalan: ${remainingStorage.toFixed(2)}MB, Gereken: ${fileSizeMB.toFixed(2)}MB. Daha büyük bir plana yükseltin!`
      };
    }
    
    return { allowed: true };
  };
  
  // Guest sayısı kontrolü
  const canAddGuest = async (invitationId: string, currentGuestCount: number): Promise<{ allowed: boolean; reason?: string }> => {
    const maxGuests = planConfig.limits.maxGuestsPerInvitation; // planConfig zaten currentPlan'a göre (expire ise free)
    
    // Unlimited kontrolü
    if (maxGuests === 'unlimited') {
      return { allowed: true };
    }
    
    // Limit kontrolü
    if (currentGuestCount >= maxGuests) {
      return {
        allowed: false,
        reason: `Bu davetiyeye maksimum ${maxGuests} davetli ekleyebilirsiniz. Daha fazla davetli için planınızı yükseltin!`
      };
    }
    
    return { allowed: true };
  };
  
  // Yardımcı fonksiyonlar
  const needsUpgradeFor = (feature: string): boolean => {
    return needsUpgrade(currentPlan, feature as any);
  };
  
  const getRemainingInvitations = (): number | 'unlimited' => {
    const limit = planConfig.limits.invitationsPerMonth; // planConfig expire ise free döner
    
    if (limit === 'unlimited') {
      return 'unlimited';
    }
    
    // Free plan - lifetime limit
    // EĞER planConfig.limits.invitationsPerMonth 0 ise (Free plan)
    // VE lifetime limit tanımlı ise
    if (limit === 0 && planConfig.limits.invitationsLifetime) {
      const remaining = planConfig.limits.invitationsLifetime - usage.lifetime;
      return Math.max(0, remaining);
    }
    
    // Aylık limit (PRO)
    if (typeof limit === 'number') {
      const remaining = limit - usage.monthly;
      return Math.max(0, remaining);
    }
    
    return 0;
  };
  
  const getStorageUsagePercentage = (): number => {
    if (!subscription) return 0;
    
    const used = subscription.storageUsedMb;
    const total = planConfig.limits.storageMB;
    
    return Math.min(100, Math.round((used / total) * 100));
  };
  
  const getRemainingStorageMB = (): number => {
    if (!subscription) return 0;
    
    const used = subscription.storageUsedMb;
    const total = planConfig.limits.storageMB;
    
    return Math.max(0, total - used);
  };
  
  const refreshSubscription = async () => {
    await loadSubscription();
  };
  
  const canCancelWithRefund = () => {
    if (!subscription?.startDate) {
      return { canRefund: false, daysLeft: 0 };
    }
    return subscriptionService.canCancelWithRefund(subscription.startDate);
  };

  /**
   * Belirli bir tier'daki şablona erişebilir mi?
   */
  const canAccessTemplate = (templateTier: 'free' | 'pro' | 'premium'): boolean => {
    // currentPlan zaten expire durumunu içeriyor
    const userAccessLevel = planConfig.limits.templateAccessLevel;
    
    // FREE user
    if (userAccessLevel === 'free') {
      return templateTier === 'free';
    }
    
    // PRO user
    if (userAccessLevel === 'pro') {
      return templateTier === 'free' || templateTier === 'pro';
    }
    
    // PREMIUM user - tüm şablonlara erişebilir
    return true;
  };

  return {
    subscription,
    planConfig,
    isLoading,
    currentPlan,
    planName,
    isFreePlan,
    isProPlan,
    isPremiumPlan,
    isBusinessPlan,
    canCreateInvitation,
    canAccessPremiumTemplates,
    canAccessTemplate,
    canUploadImage,
    canShareWhatsApp,
    canExportExcel,
    canUseQRMedia,
    canUseAIDesign,
    canUploadImageWithSize,
    canAddGuest,
    checkFeatureAccess,
    needsUpgradeFor,
    getRemainingInvitations,
    getStorageUsagePercentage,
    getRemainingStorageMB,
    canCancelWithRefund,
    refreshSubscription,
  };
}