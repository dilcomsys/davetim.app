/**
 * Davetim - Subscription Plan Configuration
 * 
 * Bu dosya tüm plan tiplerini, limitlerini ve özelliklerini tanımlar.
 * Plan kontrolleri için tek merkezi kaynak.
 */

export type PlanTier = 'free' | 'pro' | 'premium';
export type UserType = 'individual';

export interface PlanLimits {
  // Davetiye limitleri
  invitationsPerMonth: number | 'unlimited';
  invitationsLifetime?: number; // Sadece free için (tek kullanım)
  
  // Şablon erişimi
  templateAccessLevel: 'free' | 'pro' | 'premium'; // Hangi tier şablonlara erişebilir
  basicTemplatesCount?: number; // Free için
  
  // RSVP & Davetli limitleri
  maxGuestsPerInvitation: number | 'unlimited';
  rsvpSystem: boolean;
  guestListManagement: boolean;
  
  // Özellikler
  imageUpload: boolean;
  imagePositioning: boolean;
  colorCustomization: boolean;
  
  // Paylaşım & Export
  socialMediaSharing: boolean; // WhatsApp, Telegram, Instagram vb. direkt butonlar (PRO+)
  excelExport: boolean;
  pdfDownloads: number | 'unlimited'; // Herkes sınırsız indirebilir
  pngDownloads: boolean; // Herkes indirebilir
  
  // Gelişmiş özellikler
  qrMediaUpload: boolean;
  qrMediaStorageDays?: number; // QR medya saklama süresi (gün)
  aiDesign: boolean;
  brandLogo: boolean;
  whiteLabel: boolean;
  
  // Depolama
  storageMB: number;
  
  // Destek
  support: 'basic' | 'priority' | '24/7' | 'dedicated';
  
  // Kurumsal özellikler
  multipleClients?: boolean;
  subAccounts?: number;
  apiAccess?: boolean;
  webhooks?: boolean;
  customDomain?: boolean;
  bulkSending?: boolean;
  analytics?: boolean;
  
  // Watermark
  watermark: boolean;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  userType: UserType;
  price: {
    monthly: number;
    yearly?: number;
  };
  limits: PlanLimits;
}

/**
 * Tüm Plan Konfigürasyonları
 */
export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  // ========================================
  // BİREYSEL PLANLAR
  // ========================================
  
  'free': {
    id: 'free',
    name: 'Ücretsiz',
    userType: 'individual',
    price: {
      monthly: 0,
    },
    limits: {
      // Tek kullanımlık
      invitationsPerMonth: 0, // Aylık yenileme yok
      invitationsLifetime: 1, // Toplam 1 davetiye hakkı
      
      // Sadece temel şablonlar
      templateAccessLevel: 'free',
      basicTemplatesCount: 5,
      
      // RSVP limiti
      maxGuestsPerInvitation: 50,
      rsvpSystem: true,
      guestListManagement: true,
      
      // Özellikler - Kısıtlı
      imageUpload: false,
      imagePositioning: false,
      colorCustomization: false, // Sadece preset'ler
      
      // Paylaşım & Export - Temel (Link kopyalama)
      socialMediaSharing: false, // Sadece link kopyalama
      excelExport: false,
      pdfDownloads: 'unlimited', // Herkes sınırsız indirebilir
      pngDownloads: true, // Herkes indirebilir
      
      // Gelişmiş özellikler - Yok
      qrMediaUpload: false,
      aiDesign: false,
      brandLogo: false,
      whiteLabel: false,
      
      // Depolama
      storageMB: 5,
      
      // Destek
      support: 'basic',
      
      // Watermark var
      watermark: true,
    }
  },
  
  'pro': {
    id: 'pro',
    name: 'PRO',
    userType: 'individual',
    price: {
      monthly: 79,
    },
    limits: {
      // Aylık 3 davetiye
      invitationsPerMonth: 3,
      
      // Free + PRO şablonlar (Premium şablonlar YOK)
      templateAccessLevel: 'pro',
      
      // Sınırsız RSVP
      maxGuestsPerInvitation: 'unlimited',
      rsvpSystem: true,
      guestListManagement: true,
      
      // Özellikler - Tam erişim
      imageUpload: true,
      imagePositioning: true,
      colorCustomization: true,
      
      // Paylaşım & Export - Gelişmiş
      socialMediaSharing: true, // WhatsApp, Telegram, Instagram butonları
      excelExport: true,
      pdfDownloads: 'unlimited',
      pngDownloads: true,
      
      // Gelişmiş özellikler - Yok
      qrMediaUpload: false,
      aiDesign: false,
      brandLogo: false,
      whiteLabel: false,
      
      // Depolama
      storageMB: 100,
      
      // Destek
      support: 'priority',
      
      // Watermark yok
      watermark: false,
    }
  },
  
  'premium': {
    id: 'premium',
    name: 'PREMIUM',
    userType: 'individual',
    price: {
      monthly: 129,
      yearly: 1290,
    },
    limits: {
      // Sınırsız davetiye
      invitationsPerMonth: 'unlimited',
      
      // Tüm şablonlar (Free + PRO + Premium)
      templateAccessLevel: 'premium',
      
      // Sınırsız RSVP
      maxGuestsPerInvitation: 'unlimited',
      rsvpSystem: true,
      guestListManagement: true,
      
      // Özellikler - Tam erişim
      imageUpload: true,
      imagePositioning: true,
      colorCustomization: true,
      
      // Paylaşım & Export - Gelişmiş + Sosyal Medya
      socialMediaSharing: true, // WhatsApp, Telegram, Instagram butonları
      excelExport: true,
      pdfDownloads: 'unlimited',
      pngDownloads: true,
      
      // Gelişmiş özellikler - Var
      qrMediaUpload: true,
      qrMediaStorageDays: 90, // Aylık: 3 ay, Yıllık: 365 gün (kod içinde kontrol)
      aiDesign: false, // Henüz geliştirilmedi
      brandLogo: false, // Sadece kurumsal
      whiteLabel: false,
      
      // Depolama
      storageMB: 500,
      
      // Destek
      support: '24/7',
      
      // Watermark yok
      watermark: false,
    }
  },
};

/**
 * Helper: Planı ID'ye göre getir
 */
export function getPlanConfig(planId: PlanTier): PlanConfig {
  return PLAN_CONFIGS[planId];
}

/**
 * Helper: Plan limiti kontrol et
 */
export function checkPlanLimit(
  planId: PlanTier, 
  feature: keyof PlanLimits
): boolean | number | string | undefined {
  const config = getPlanConfig(planId);
  return config.limits[feature] as boolean | number | string | undefined;
}

/**
 * Helper: Plan yükseltme gerekiyor mu?
 */
export function needsUpgrade(
  currentPlan: PlanTier,
  requiredFeature: keyof PlanLimits
): boolean {
  const config = getPlanConfig(currentPlan);
  const featureValue = config.limits[requiredFeature];
  
  // Boolean özellikler için
  if (typeof featureValue === 'boolean') {
    return !featureValue;
  }
  
  // Unlimited kontrolü
  if (featureValue === 'unlimited') {
    return false;
  }
  
  // Sayısal limitler için (0 = kapalı)
  if (typeof featureValue === 'number') {
    return featureValue === 0;
  }
  
  return false;
}

/**
 * Helper: İki planı karşılaştır (hangisi daha üst düzey?)
 */
export function comparePlans(planA: PlanTier, planB: PlanTier): number {
  const hierarchy: PlanTier[] = [
    'free',
    'pro',
    'premium'
  ];
  
  const indexA = hierarchy.indexOf(planA);
  const indexB = hierarchy.indexOf(planB);
  
  return indexA - indexB; // Negatif: A < B, Pozitif: A > B, 0: Eşit
}

/**
 * Helper: Yükseltme önerileri
 */
export function getUpgradeRecommendations(currentPlan: PlanTier): PlanTier[] {
  switch (currentPlan) {
    case 'free':
      return ['pro', 'premium'];
    case 'pro':
      return ['premium'];
    case 'premium':
      return [];
    default:
      return [];
  }
}

/**
 * Helper: Plan adını kullanıcı dostu formatta getir
 */
export function getPlanDisplayName(planId: PlanTier): string {
  const config = getPlanConfig(planId);
  return config.name;
}

/**
 * Default plan (yeni kullanıcılar için)
 */
export const DEFAULT_PLAN: PlanTier = 'free';

