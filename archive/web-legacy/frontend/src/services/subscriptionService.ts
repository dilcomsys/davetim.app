import { supabase } from './supabase';
import toast from 'react-hot-toast';
import { PLAN_CONFIGS } from '../config/plans';
import type { PlanTier } from '../config/plans';

export interface Subscription {
  id: string;
  userId: string;
  tier: PlanTier;
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  startDate: string;
  endDate?: string;
  cancelledAt?: string;
  invitationsCreatedThisMonth: number;
  invitationsCreatedLifetime: number;
  storageUsedMb: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  transactionId: string;
  providerTransactionId?: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  planTier: PlanTier;
  billingPeriod: 'monthly' | 'yearly';
  description?: string;
  errorMessage?: string;
  processedAt: string;
  createdAt: string;
}

class SubscriptionService {
  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription found - this should not happen if triggers are working
          // But create one as fallback
          console.warn('⚠️ Subscription not found, creating free tier (trigger may not be working)');
          return this.createFreeSubscription(userId);
        }
        throw error;
      }

      return data ? this.mapToSubscription(data) : null;
    } catch (error: any) {
      console.error('❌ Get subscription error:', error);
      return null;
    }
  }

  /**
   * Create free tier subscription for new users
   */
  async createFreeSubscription(userId: string): Promise<Subscription> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          status: 'active',
          start_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Ücretsiz hesabınız oluşturuldu!');
      return this.mapToSubscription(data);
    } catch (error: any) {
      console.error('❌ Create free subscription error:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription after successful payment
   */
  async upgradeSubscription(
    userId: string,
    tier: 'pro' | 'premium',
    billingPeriod: 'monthly' | 'yearly',
    _transactionId: string
  ): Promise<Subscription> {
    try {
      console.log('🔄 Upgrading subscription:', { userId, tier, billingPeriod });
      
      const endDate = new Date();
      if (billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const updateData = {
        tier,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        cancelled_at: null,
      };

      console.log('📝 Update data:', updateData);

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Subscription updated:', data);
      
      // Also update auth user metadata for consistency (optional, as we don't use it)
      try {
        console.log('🔄 Updating auth user metadata...');
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { subscription_tier: tier }
        });
        if (metadataError) {
          console.warn('⚠️ Could not update auth metadata:', metadataError);
        } else {
          console.log('✅ Auth metadata updated');
        }
      } catch (metadataError) {
        console.warn('⚠️ Auth metadata update failed:', metadataError);
      }
      
      // Note: Success toast is shown in PaymentModal.tsx to avoid duplicate messages
      return this.mapToSubscription(data);
    } catch (error: any) {
      console.error('❌ Upgrade subscription error:', error);
      toast.error('Abonelik güncellenemedi');
      throw error;
    }
  }

  /**
   * Cancel subscription with optional refund
   */
  async cancelSubscription(userId: string, shouldRefund: boolean = false): Promise<Subscription> {
    try {
      console.log('🔄 Cancelling subscription:', { userId, shouldRefund });
      
      // Get subscription first to check dates
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('Abonelik bulunamadı');
      }

      // If refund is requested, get latest payment and process refund
      if (shouldRefund) {
        console.log('💰 Processing refund...');
        
        // Get latest successful payment for this user
        const { data: paymentHistory, error: paymentError } = await supabase
          .from('payment_history')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'SUCCESS')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (paymentError) {
          console.warn('⚠️ No payment found for refund:', paymentError);
        } else if (paymentHistory) {
          console.log('💳 Found payment for refund:', {
            transactionId: paymentHistory.transaction_id,
            amount: paymentHistory.amount,
            currency: paymentHistory.currency,
          });

          // Import paymentService to request refund
          const { paymentService } = await import('./paymentService');
          
          try {
            await paymentService.refundPayment({
              paymentTransactionId: paymentHistory.transaction_id,
              amount: paymentHistory.amount,
              currency: paymentHistory.currency,
              reason: 'Abonelik iptali (3 gün içinde)',
            });
            
            console.log('✅ Refund request sent to İyzico');
            
            // Update payment history to mark as refunded
            await supabase
              .from('payment_history')
              .update({
                status: 'REFUNDED',
                description: (paymentHistory.description || '') + ' - İade Yapıldı',
              })
              .eq('transaction_id', paymentHistory.transaction_id);
            
          } catch (refundError: any) {
            console.error('❌ Refund failed:', refundError);
            // Don't throw error - still cancel subscription
            toast.error('İade işlemi başarısız oldu. Lütfen destek ile iletişime geçin.');
          }
        }
      }

      // Update subscription based on refund status
      let updateData: any;
      
      if (shouldRefund) {
        // ✅ İADE YAPILIYORSA: Hemen FREE'ye düşür
        updateData = {
          tier: 'free',
          status: 'active', // Free is always active
          cancelled_at: new Date().toISOString(),
          end_date: null, // Free has no end date
          start_date: new Date().toISOString(),
        };
        console.log('💰 Refund processed - downgrading to FREE immediately');
      } else {
        // ❌ İADE YAPILMIYORSA: Cancelled olarak işaretle, dönem sonuna kadar kullan
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          // Keep tier and end_date - user keeps access until end_date
        };
        console.log('📅 No refund - keeping tier until end_date');
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      if (shouldRefund) {
        toast.success('Aboneliğiniz iptal edildi, ücret iadesi işleme alındı ve FREE plana geçirildiniz');
      } else {
        toast.success('Aboneliğiniz iptal edildi. Mevcut dönemin sonuna kadar kullanmaya devam edebilirsiniz.');
      }
      
      return this.mapToSubscription(data);
    } catch (error: any) {
      console.error('❌ Cancel subscription error:', error);
      toast.error('Abonelik iptal edilemedi');
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId: string): Promise<Subscription> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          cancelled_at: null,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Aboneliğiniz yeniden aktif edildi!');
      return this.mapToSubscription(data);
    } catch (error: any) {
      console.error('❌ Reactivate subscription error:', error);
      toast.error('Abonelik aktif edilemedi');
      throw error;
    }
  }

  /**
   * Increment invitation counter
   */
  async incrementInvitationCount(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_invitation_count', {
        p_user_id: userId,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('❌ Increment invitation count error:', error);
    }
  }

  /**
   * Update storage usage
   */
  async updateStorageUsage(userId: string, usageMb: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ storage_used_mb: usageMb })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('❌ Update storage usage error:', error);
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToPaymentHistory);
    } catch (error: any) {
      console.error('❌ Get payment history error:', error);
      return [];
    }
  }

  /**
   * Save payment to history
   */
  async savePaymentHistory(
    userId: string,
    transactionId: string,
    providerTransactionId: string | undefined,
    provider: string,
    amount: number,
    currency: string,
    status: string,
    planTier: 'pro' | 'premium',
    billingPeriod: 'monthly' | 'yearly',
    description?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_history')
        .insert({
          user_id: userId,
          transaction_id: transactionId,
          provider_transaction_id: providerTransactionId,
          provider,
          amount,
          currency,
          status,
          plan_tier: planTier,
          billing_period: billingPeriod,
          description,
          error_message: errorMessage,
          processed_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('❌ Save payment history error:', error);
    }
  }

  /**
   * Map database subscription to typed object
   */
  private mapToSubscription(data: any): Subscription {
    return {
      id: data.id,
      userId: data.user_id,
      tier: data.tier,
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      cancelledAt: data.cancelled_at,
      invitationsCreatedThisMonth: data.invitations_created_this_month || 0,
      invitationsCreatedLifetime: data.invitations_created_lifetime || 0,
      storageUsedMb: data.storage_used_mb || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Check if user can access a specific feature
   * NOTE: This is for FEATURE access, not USAGE LIMIT checks!
   * For usage limits (invitation count, storage, etc.), use separate methods.
   */
  canAccessFeature(feature: string, subscription?: Subscription | null): boolean {
    if (!subscription) return false;

    switch (feature) {
      // QR Media - Only PREMIUM
      case 'qr_media':
        return subscription.tier === 'premium';
      
      // Premium Templates - PRO+
      case 'premium_templates':
        return subscription.tier === 'pro' || subscription.tier === 'premium';
      
      // Image Upload - PRO+
      case 'image_upload':
        return subscription.tier === 'pro' || subscription.tier === 'premium';
      
      // WhatsApp Sharing - PRO+
      case 'whatsapp_sharing':
        return subscription.tier === 'pro' || subscription.tier === 'premium';
      
      // Excel Export - PRO+
      case 'excel_export':
        return subscription.tier === 'pro' || subscription.tier === 'premium';
      
      // AI Design - PREMIUM only
      case 'ai_design':
        return subscription.tier === 'premium';
      
      // Unlimited Invitations - PREMIUM only
      case 'unlimited_invitations':
        return subscription.tier === 'premium';
      
      default:
        return false;
    }
  }

  /**
   * Get real-time invitation usage counts from DB
   */
  async getInvitationUsage(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    try {
      // 1. Lifetime Published Count (status = 'published')
      const { count: lifetimeCount } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'published');

      // 2. Monthly Published Count (status = 'published' AND published_at >= startOfMonth)
      const { count: monthlyCount } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'published')
        .gte('published_at', startOfMonth);

      return {
        lifetime: lifetimeCount || 0,
        monthly: monthlyCount || 0
      };
    } catch (error) {
      console.error('Error fetching invitation counts:', error);
      return { lifetime: 0, monthly: 0 };
    }
  }

  /**
   * Check creation limits using REAL-TIME counts
   */
  async checkInvitationLimits(userId: string, tier: PlanTier): Promise<{ allowed: boolean; reason?: string; remaining?: number | 'unlimited' }> {
    // PREMIUM - Unlimited
    if (tier === 'premium') {
      return { allowed: true, remaining: 'unlimited' };
    }

    const planConfig = PLAN_CONFIGS[tier];
    const usage = await this.getInvitationUsage(userId);

    // PRO - Monthly limit
    if (tier === 'pro') {
      const limit = planConfig.limits.invitationsPerMonth as number;
      const remaining = Math.max(0, limit - usage.monthly);

      if (remaining <= 0) {
        return {
          allowed: false,
          reason: `Bu ay ${limit} davetiye hakkınızı kullandınız (Yayınlanan: ${usage.monthly}). Yeni ayda sıfırlanacaktır.`,
          remaining: 0
        };
      }
      return { allowed: true, remaining };
    }

    // FREE - Lifetime limit
    if (tier === 'free') {
      const limit = planConfig.limits.invitationsLifetime || 1;
      const remaining = Math.max(0, limit - usage.lifetime);

      if (remaining <= 0) {
        return {
          allowed: false,
          reason: `Ücretsiz planda ${limit} davetiye hakkınızı kullandınız.`,
          remaining: 0
        };
      }
      return { allowed: true, remaining };
    }

    return { allowed: false, reason: 'Plan bilgisi hatalı' };
  }

  /**
   * Check if user can cancel with refund (3 day policy)
   */
  canCancelWithRefund(subscriptionStartDate: string): { canRefund: boolean; daysLeft: number } {
    const startDate = new Date(subscriptionStartDate);
    const now = new Date();
    
    // Calculate days since subscription started
    // Use floor instead of ceil to not count partial days as full days
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const REFUND_PERIOD_DAYS = 3;
    
    // Days left = 3 - completed days
    // If subscription started today (diffDays = 0), you have 3 days left
    // If subscription started 1 day ago (diffDays = 1), you have 2 days left
    // If subscription started 2 days ago (diffDays = 2), you have 1 day left
    // If subscription started 3 days ago (diffDays = 3), you have 0 days left (no refund)
    const daysLeft = Math.max(0, REFUND_PERIOD_DAYS - diffDays);
    const canRefund = diffDays < REFUND_PERIOD_DAYS;
    
    console.log('🔍 Refund check:', {
      subscriptionStartDate,
      startDateFormatted: startDate.toISOString(),
      nowFormatted: now.toISOString(),
      diffTime,
      diffDays,
      daysLeft,
      canRefund,
      explanation: `Started ${diffDays} day(s) ago. ${canRefund ? `You have ${daysLeft} day(s) left for refund.` : 'Refund period expired.'}`,
    });
    
    return { canRefund, daysLeft };
  }

  /**
   * Map database payment history to typed object
   */
  private mapToPaymentHistory(data: any): PaymentHistory {
    return {
      id: data.id,
      userId: data.user_id,
      transactionId: data.transaction_id,
      providerTransactionId: data.provider_transaction_id,
      provider: data.provider,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      planTier: data.plan_tier,
      billingPeriod: data.billing_period,
      description: data.description,
      errorMessage: data.error_message,
      processedAt: data.processed_at,
      createdAt: data.created_at,
    };
  }
}

export const subscriptionService = new SubscriptionService();
