import React, { useState, useEffect } from 'react';
import { User, CreditCard, Download, Calendar, Settings, Shield, Lock, HardDrive, Users, FileText, Crown, Zap, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/authStore';
import { useSubscription } from '../hooks/useSubscription';
import { PLAN_CONFIGS } from '../config/plans';
import { authService } from '../services/authService';
import { invitationService } from '../services/invitationService';
import { guestService } from '../services/guestService';
import { subscriptionService, type PaymentHistory } from '../services/subscriptionService';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import { formatFileSize } from '../utils/imageOptimization';
import { LEGAL_DOCUMENTS } from '../legal';
import { pdfExportService } from '../services/pdfExportService';
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  CANCELLATION_REFUND_POLICY,
  KVKK_CLARIFICATION,
  COMMERCIAL_ELECTRONIC_MESSAGE,
} from '../legal';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const subscription = useSubscription();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    fullName: authUser?.fullName || '',
    phone: authUser?.phone || '',
  });
  
  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Subscription cancellation
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Usage stats
  const [usageStats, setUsageStats] = useState({
    invitationCount: 0,
    totalGuests: 0,
    storageUsed: 0,
  });

  // Payment history
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profil', icon: <User className="h-5 w-5" /> },
    { id: 'subscription', name: 'Abonelik', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'payments', name: 'Ödemeler', icon: <FileText className="h-5 w-5" /> },
      { id: 'contracts', name: 'Sözleşmeler', icon: <Shield className="h-5 w-5" /> },
    { id: 'usage', name: 'Kullanım', icon: <Download className="h-5 w-5" /> },
    { id: 'settings', name: 'Ayarlar', icon: <Settings className="h-5 w-5" /> },
  ];

  // Load usage stats
  useEffect(() => {
    loadUsageStats();
  }, []);

  // Load payment history when needed (for payments tab or subscription tab)
  useEffect(() => {
    if ((activeTab === 'payments' || activeTab === 'subscription') && authUser?.id && paymentHistory.length === 0) {
      loadPaymentHistory();
    }
  }, [activeTab, authUser?.id]);

  const loadPaymentHistory = async () => {
    if (!authUser?.id) return;
    
    setLoadingPayments(true);
    try {
      const history = await subscriptionService.getPaymentHistory(authUser.id);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
      toast.error('Ödeme geçmişi yüklenemedi');
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadUsageStats = async () => {
    if (!authUser?.id) return;
    
    try {
      const invitations = await invitationService.getUserInvitations();
      
      let totalGuests = 0;
      for (const inv of invitations) {
        const guestCount = await guestService.getGuestCount(inv.id);
        totalGuests += guestCount;
      }
      
      setUsageStats({
        invitationCount: invitations.length,
        totalGuests,
        storageUsed: subscription.subscription?.storageUsedMb || 0,
      });
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  // Helper: Get legal document by ID
  const getLegalDocumentById = (docId: string) => {
    switch (docId) {
      case 'privacy-policy':
        return PRIVACY_POLICY;
      case 'terms-of-service':
        return TERMS_OF_SERVICE;
      case 'cancellation-refund':
        return CANCELLATION_REFUND_POLICY;
      case 'kvkk-clarification':
        return KVKK_CLARIFICATION;
      case 'commercial-message':
        return COMMERCIAL_ELECTRONIC_MESSAGE;
      default:
        return null;
    }
  };

  // Handle PDF download for legal documents
  const handleDownloadLegalDocument = async (docId: string, docTitle: string, docSlug: string) => {
    const loadingToast = toast.loading('PDF oluşturuluyor...');
    
    try {
      const document = getLegalDocumentById(docId);
      if (!document) {
        throw new Error('Belge bulunamadı');
      }
      
      const filename = `${docSlug}-${new Date().toISOString().split('T')[0]}.pdf`;
      await pdfExportService.exportLegalDocumentToPDF(document, filename);
      toast.success(`${docTitle} PDF başarıyla indirildi!`, { id: loadingToast });
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('PDF indirme başarısız oldu', { id: loadingToast });
    }
  };

  // Handle distance sales contract PDF download
  const handleDownloadDistanceSalesContract = async () => {
    if (!authUser || paymentHistory.length === 0) {
      toast.error('Ödeme bilgisi bulunamadı');
      return;
    }

    const loadingToast = toast.loading('Mesafeli satış sözleşmesi oluşturuluyor...');
    
    try {
      // Get the latest successful payment
      const latestPayment = paymentHistory.find(p => p.status === 'SUCCESS');
      if (!latestPayment) {
        throw new Error('Başarılı ödeme bulunamadı');
      }

      const contractData = {
        contractNumber: `MSS-${latestPayment.transactionId}`,
        date: new Date(latestPayment.processedAt).toLocaleDateString('tr-TR'),
        userName: authUser.fullName || authUser.email.split('@')[0],
        userEmail: authUser.email,
        userPhone: authUser.phone || '+90 XXX XXX XX XX',
        userAddress: 'Adres bilgisi güncelleme gerekli', // TODO: Add address field to user profile
        planName: latestPayment.planTier.toUpperCase(),
        planPeriod: latestPayment.billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık',
        amount: latestPayment.amount,
        currency: latestPayment.currency,
        paymentMethod: latestPayment.provider === 'iyzico' ? 'Kredi/Banka Kartı (İyzico)' : 'Kredi Kartı',
        transactionId: latestPayment.transactionId,
      };

      const filename = `mesafeli-satis-sozlesmesi-${latestPayment.transactionId}.pdf`;
      await pdfExportService.exportDistanceSalesContractToPDF(contractData, filename);
      toast.success('Mesafeli satış sözleşmesi başarıyla indirildi!', { id: loadingToast });
    } catch (error) {
      console.error('Contract PDF download error:', error);
      toast.error('Sözleşme indirme başarısız oldu', { id: loadingToast });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.fullName.trim()) {
      toast.error('Ad Soyad gerekli');
      return;
    }
    
    setIsSaving(true);
    try {
      await authService.updateProfile({
        fullName: profileData.fullName,
        phone: profileData.phone || undefined,
      });
      
      // Toast is shown by authService
    } catch (error) {
      console.error('Profile update error:', error);
      // Toast is shown by authService
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    
    setIsSaving(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Toast is shown by authService
    } catch (error: any) {
      console.error('Password change error:', error);
      // Toast is shown by authService
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!authUser?.id) return;
    
    setIsCancelling(true);
    try {
      // Check if refund is available
      const refundInfo = subscription.canCancelWithRefund();
      
      console.log('🔄 Starting cancellation:', {
        userId: authUser.id,
        shouldRefund: refundInfo.canRefund,
        daysLeft: refundInfo.daysLeft,
      });
      
      // Cancel subscription with refund flag
      const success = await subscriptionService.cancelSubscription(authUser.id, refundInfo.canRefund);
      
      if (success) {
        setShowCancelDialog(false);
        await subscription.refreshSubscription();
        
        // Toast message is shown by subscriptionService
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      // Don't show toast here - subscriptionService already shows it
    } finally {
      setIsCancelling(false);
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Crown className="h-5 w-5 text-purple-600" />;
      case 'pro':
        return <Zap className="h-5 w-5 text-primary-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'from-purple-600 to-pink-600';
      case 'pro':
        return 'from-primary-600 to-blue-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Profile Form - Minimal */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Profil Bilgileri</h3>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ad Soyad */}
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        required
                      placeholder="Adınız Soyadınız"
                      />
                  </div>
                  
                  {/* E-posta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      E-posta Adresi
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={authUser?.email || ''}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        disabled
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  </div>
                  
                {/* Telefon */}
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefon <span className="text-gray-500 text-xs">(İsteğe bağlı)</span>
                    </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="05XX XXX XX XX"
                      />
                  </div>
                  
                {/* Save Button */}
                <div className="pt-2">
                    <button 
                      type="submit" 
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      disabled={isSaving}
                    >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
              </form>
            </div>

            {/* Security Section - Minimal */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Güvenlik</h3>
              
              <div className="space-y-3">
                {/* Password */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Şifre</p>
                      <p className="text-xs text-gray-500">Son değişiklik: 30 gün önce</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Değiştir
                  </button>
                </div>
                
                {/* Email Verification */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">E-posta Doğrulandı</p>
                      <p className="text-xs text-gray-500">{authUser?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Current Plan Card */}
            <div className={`bg-gradient-to-br ${getPlanColor(subscription.currentPlan)} rounded-xl p-8 text-white shadow-lg`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      {getPlanIcon(subscription.currentPlan)}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Mevcut Planınız</p>
                    <h4 className="text-3xl font-bold">
                      {subscription.planConfig?.name}
                      </h4>
                    </div>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-bold mb-1">
                    {(() => {
                      if (subscription.currentPlan === 'free') return '₺0';
                      
                      // En son başarılı ödemeyi bul (en yeni tarihli)
                      const successfulPayments = paymentHistory.filter(p => p.status === 'SUCCESS');
                      if (successfulPayments.length > 0) {
                        const latestPayment = successfulPayments.reduce((latest, current) => 
                          new Date(current.processedAt) > new Date(latest.processedAt) ? current : latest
                        );
                        return `₺${latestPayment.amount.toFixed(2)}`;
                      }
                      
                      // Ödeme yoksa planın güncel fiyatını göster
                      return (subscription.planConfig?.price?.monthly || 0) > 0 
                        ? `₺${subscription.planConfig?.price?.monthly}` 
                        : '₺0';
                    })()}
                        </div>
                  {subscription.currentPlan !== 'free' && (
                    <p className="text-white/70 text-sm">
                      {(() => {
                        // En son başarılı ödemeyi bul
                        const successfulPayments = paymentHistory.filter(p => p.status === 'SUCCESS');
                        if (successfulPayments.length > 0) {
                          const latestPayment = successfulPayments.reduce((latest, current) => 
                            new Date(current.processedAt) > new Date(latest.processedAt) ? current : latest
                          );
                          return latestPayment.billingPeriod === 'yearly' ? 'Yıllık abonelik' : 'Aylık abonelik';
                        }
                        return 'Aylık abonelik';
                      })()}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                {subscription.subscription?.startDate && (
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 rounded-lg p-2">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs">Başlangıç</p>
                      <p className="font-semibold">
                        {new Date(subscription.subscription.startDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                      </div>
                    )}
                
                {subscription.subscription?.endDate && (
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 rounded-lg p-2">
                      <Calendar className="h-5 w-5" />
                  </div>
                    <div>
                      <p className="text-white/70 text-xs">
                        {subscription.subscription?.status === 'cancelled' ? 'Son Kullanım' : 'Yenilenme'}
                      </p>
                      <p className="font-semibold">
                        {new Date(subscription.subscription.endDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 rounded-lg p-2">
                    <Shield className="h-5 w-5" />
                    </div>
                  <div>
                    <p className="text-white/70 text-xs">Durum</p>
                    {subscription.subscription?.status === 'active' ? (
                      <p className="font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Aktif
                      </p>
                    ) : subscription.subscription?.status === 'cancelled' ? (
                      <p className="font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        İptal Edildi
                      </p>
                    ) : (
                      <p className="font-semibold">Ücretsiz</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cancelled Subscription Info */}
            {subscription.subscription?.status === 'cancelled' && subscription.subscription?.cancelledAt && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-200 rounded-xl p-3">
                    <AlertCircle className="h-6 w-6 text-orange-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 text-lg mb-3">
                      ⚠️ Abonelik İptal Edildi
                    </h4>
                    <div className="space-y-3 text-sm text-orange-900">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white/50 rounded-lg p-3">
                          <p className="text-orange-700 text-xs font-medium mb-1">İptal Tarihi</p>
                          <p className="font-semibold">
                            {new Date(subscription.subscription.cancelledAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="bg-white/50 rounded-lg p-3">
                          <p className="text-orange-700 text-xs font-medium mb-1">Son Kullanım Tarihi</p>
                          <p className="font-semibold">
                            {new Date(subscription.subscription.endDate!).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3 border-l-4 border-orange-500">
                        <p className="text-orange-800">
                          {new Date(subscription.subscription.endDate!).toLocaleDateString('tr-TR')} tarihine kadar 
                          tüm <strong>{subscription.planConfig?.name}</strong> özelliklerinizi kullanmaya devam edebilirsiniz. 
                          Dönem sonunda otomatik olarak <strong>FREE</strong> plana geçeceksiniz.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="mt-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                    >
                      🔄 Aboneliği Yeniden Aktifleştir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade Options */}
            {subscription.currentPlan !== 'premium' && subscription.subscription?.status !== 'cancelled' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🚀 Daha Fazla Özellik İçin Yükselt
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subscription.currentPlan === 'free' && (
                    <>
                      <div className="relative group bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 hover:border-primary-400 rounded-xl p-6 transition-all hover:shadow-lg">
                        <div className="absolute top-4 right-4">
                          <span className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                            Popüler
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-primary-600 rounded-xl p-3">
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl text-gray-900">{PLAN_CONFIGS.pro.name}</h4>
                            <p className="text-xs text-gray-600">Bireysel kullanım için</p>
                          </div>
                        </div>
                        <ul className="space-y-2 mb-6 text-sm text-gray-700">
                          <li className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            Aylık {PLAN_CONFIGS.pro.limits.invitationsPerMonth} davetiye
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            Tüm PRO şablonlar
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            Görsel yükleme
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            Sosyal medya paylaşımı
                          </li>
                        </ul>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">₺{PLAN_CONFIGS.pro.price.monthly}</span>
                          <span className="text-gray-600 text-sm">/ay</span>
                        </div>
                        <button 
                          onClick={() => navigate('/pricing')}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-xl transition-all transform group-hover:scale-105"
                        >
                          PRO'ya Yükselt →
                        </button>
                      </div>
                      
                      <div className="relative group bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-300 hover:border-purple-500 rounded-xl p-6 transition-all hover:shadow-xl">
                        <div className="absolute top-4 right-4">
                          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                            ⭐ En İyi Değer
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-3">
                            <Crown className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl text-gray-900">{PLAN_CONFIGS.premium.name}</h4>
                            <p className="text-xs text-gray-600">Profesyonel kullanım</p>
                          </div>
                        </div>
                        <ul className="space-y-2 mb-6 text-sm text-gray-700">
                          <li className="flex items-center gap-2">
                            <span className="text-purple-600">✓</span>
                            <strong>Sınırsız</strong> davetiye
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-purple-600">✓</span>
                            QR Media (3 ay saklama)
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-purple-600">✓</span>
                            AI tasarım önerileri
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-purple-600">✓</span>
                            Gelişmiş analitik
                          </li>
                        </ul>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">₺{PLAN_CONFIGS.premium.price.monthly}</span>
                          <span className="text-gray-600 text-sm">/ay</span>
                        </div>
                        <button 
                          onClick={() => navigate('/pricing')}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-xl transition-all transform group-hover:scale-105 shadow-md"
                        >
                          PREMIUM'a Yükselt →
                        </button>
                      </div>
                    </>
                  )}
                  
                  {subscription.currentPlan === 'pro' && (
                    <div className="relative group bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-300 hover:border-purple-500 rounded-xl p-6 transition-all hover:shadow-xl">
                      <div className="absolute top-4 right-4">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          ⭐ Önerilen
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-3">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xl text-gray-900">{PLAN_CONFIGS.premium.name}</h4>
                          <p className="text-xs text-gray-600">Profesyonel kullanım</p>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-6 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span>
                          <strong>Sınırsız</strong> davetiye
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span>
                          QR Media (3 ay saklama)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span>
                          AI tasarım önerileri
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span>
                          Gelişmiş analitik
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span>
                          7/24 öncelikli destek
                        </li>
                      </ul>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">₺{PLAN_CONFIGS.premium.price.monthly}</span>
                        <span className="text-gray-600 text-sm">/ay</span>
                      </div>
                      <button 
                        onClick={() => navigate('/pricing')}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-xl transition-all transform group-hover:scale-105 shadow-md"
                      >
                        PREMIUM'a Yükselt →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cancel Subscription - Minimalist */}
            {subscription.currentPlan !== 'free' && subscription.subscription?.status === 'active' && (
              <details className="group bg-white border border-gray-200 rounded-lg">
                <summary className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors list-none">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Abonelik yönetimi</span>
                  </div>
                  <svg className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">İptal Koşulları</p>
                      <div className="text-xs text-gray-600 space-y-1">
                        {(() => {
                          const refundInfo = subscription.canCancelWithRefund();
                          return refundInfo.canRefund ? (
                            <>
                              <p>✅ <strong>{refundInfo.daysLeft} gün</strong> içinde iptal: Tam iade</p>
                              <p className="text-gray-500">ℹ️ İade sonrası FREE plana geçiş</p>
                    </>
                  ) : (
                    <>
                              <p>• İade süresi doldu</p>
                              <p>• İptal sonrası <strong>{new Date(subscription.subscription?.endDate || '').toLocaleDateString('tr-TR')}</strong> tarihine kadar kullanım devam eder</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                <button 
                  onClick={() => setShowCancelDialog(true)}
                        className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors underline"
                >
                        Aboneliği iptal et
                </button>
              </div>
                  </div>
                </div>
              </details>
            )}
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6 animate-fade-in">
              {loadingPayments ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                <p className="text-gray-600 mt-4">Ödeme geçmişi yükleniyor...</p>
                </div>
              ) : paymentHistory.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="bg-gray-200 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Henüz Ödeme Geçmişiniz Yok
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Premium özelliklerden faydalanmak ve davetiyelerinizi profesyonel hale getirmek için bir plan seçin
                  </p>
                  <button
                    onClick={() => navigate('/pricing')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                  🚀 Planları Keşfet
                  </button>
                </div>
              ) : (
              <>
                {/* Payment Summary - Wide Total Card */}
                <div className="space-y-4 mt-6">
                  {/* Toplam Harcama - Full Width */}
                  <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-primary-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-primary-600 to-blue-700 rounded-2xl p-4 shadow-lg">
                          <CreditCard className="h-8 w-8 text-white" />
                        </div>
                         <div>
                           <p className="text-sm text-primary-700 font-semibold mb-1 uppercase tracking-wide">Toplam Harcama</p>
                           <p className="text-4xl font-bold text-primary-900">
                            ₺{paymentHistory
                              .filter((p) => p.status === 'SUCCESS')
                              .reduce((sum, p) => sum + p.amount, 0)
                              .toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Toplam İşlem</p>
                        <p className="text-3xl font-bold text-gray-900">{paymentHistory.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Other Stats - 3 Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-semibold mb-1">✓ Başarılı</p>
                          <p className="text-3xl font-bold text-green-900">
                            {paymentHistory.filter((p) => p.status === 'SUCCESS').length}
                          </p>
                        </div>
                        <div className="bg-green-200 rounded-xl p-3">
                          <span className="text-2xl">✓</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-700 font-semibold mb-1">↩ İade Edildi</p>
                          <p className="text-3xl font-bold text-orange-900">
                            {paymentHistory.filter((p) => p.status === 'REFUNDED').length}
                          </p>
                        </div>
                        <div className="bg-orange-200 rounded-xl p-3">
                          <span className="text-2xl">↩</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-700 font-semibold mb-1">✗ Başarısız</p>
                          <p className="text-3xl font-bold text-red-900">
                            {paymentHistory.filter((p) => p.status === 'FAILURE').length}
                          </p>
                        </div>
                        <div className="bg-red-200 rounded-xl p-3">
                          <span className="text-2xl">✗</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Tarih
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Plan
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Tutar
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Durum
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          İşlem No
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paymentHistory.map((payment) => (
                        <tr 
                          key={payment.id} 
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium">
                            {new Date(payment.processedAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(payment.processedAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {payment.planTier.toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {payment.billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-sm font-bold ${
                              payment.status === 'REFUNDED' 
                                ? 'text-orange-600' 
                                : 'text-gray-900'
                            }`}>
                              {payment.status === 'REFUNDED' && '-'}
                            ₺{payment.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                            {payment.status === 'SUCCESS' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 w-fit">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                  Başarılı
                                </span>
                              ) : payment.status === 'REFUNDED' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 w-fit">
                                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                  İade Edildi
                              </span>
                            ) : payment.status === 'FAILURE' ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 w-fit">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    Başarısız
                              </span>
                                  {payment.errorMessage && (
                                    <div className="group relative">
                                      <AlertCircle className="h-4 w-4 text-red-500 cursor-help" />
                                      <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-64 shadow-lg whitespace-normal">
                                        {payment.errorMessage}
                                        <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                            ) : payment.status === 'PENDING' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 w-fit">
                                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                                  Beklemede
                              </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 w-fit">
                                {payment.status}
                              </span>
                            )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                            {payment.transactionId}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
              </>
            )}

            {/* Failed Payments Alert - Minimalist */}
            {paymentHistory.filter(p => p.status === 'FAILURE').length > 0 && (
              <details className="group bg-white border border-gray-200 rounded-lg">
                <summary className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors list-none">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-700">
                      {paymentHistory.filter(p => p.status === 'FAILURE').length} başarısız ödeme girişimi
                    </span>
                    </div>
                  <svg className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                
                <div className="px-3 pb-3 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mb-2">
                    Yaygın sebepler: Yetersiz bakiye, yanlış kart bilgileri, 3D Secure iptali
                  </p>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Tekrar dene →
                  </button>
                    </div>
              </details>
            )}
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-6 animate-fade-in">
              {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-600 rounded-xl p-3">
                    <FileText className="h-6 w-6 text-white" />
                    </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-blue-900">{usageStats.invitationCount}</p>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">📋 Davetiyeler</h4>
                <p className="text-xs text-blue-700">
                  {subscription.planConfig?.limits.invitationsPerMonth === 'unlimited' ? (
                    '✨ Sınırsız kullanım'
                  ) : subscription.planConfig?.limits.invitationsPerMonth === 0 ? (
                    `${subscription.planConfig?.limits.invitationsLifetime || 1} toplam limit`
                  ) : (
                    `${subscription.planConfig?.limits.invitationsPerMonth} / ay limit`
                  )}
                  </p>
                </div>
                
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-600 rounded-xl p-3">
                    <Users className="h-6 w-6 text-white" />
                    </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-green-900">{usageStats.totalGuests}</p>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-green-900 mb-1">👥 Toplam Misafir</h4>
                <p className="text-xs text-green-700">
                    Tüm davetiyelerinizde
                  </p>
                </div>
                
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-600 rounded-xl p-3">
                    <HardDrive className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-purple-900">
                        {formatFileSize(usageStats.storageUsed * 1024 * 1024)}
                      </p>
                    </div>
                  </div>
                <h4 className="text-sm font-semibold text-purple-900 mb-1">💾 Depolama</h4>
                <p className="text-xs text-purple-700">
                  {subscription.planConfig?.limits.storageMB}MB limit
                  </p>
                </div>
              </div>

              {/* Storage Progress Bar */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-600 rounded-lg p-2">
                    <HardDrive className="h-5 w-5 text-white" />
                </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Depolama Kullanımı</h4>
                    <p className="text-xs text-gray-600">Dosya ve medya depolama alanı</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((usageStats.storageUsed / (subscription.planConfig?.limits.storageMB || 1)) * 100)}%
                  </p>
                  <p className="text-xs text-gray-600">Kullanılan</p>
                </div>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600 rounded-full transition-all duration-500 shadow-lg"
                    style={{
                    width: `${Math.min((usageStats.storageUsed / (subscription.planConfig?.limits.storageMB || 1)) * 100, 100)}%`
                    }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-700">
                  <strong>{formatFileSize(usageStats.storageUsed * 1024 * 1024)}</strong> kullanıldı
                </p>
                <p className="text-sm text-gray-700">
                  <strong>{subscription.planConfig?.limits.storageMB}MB</strong> toplam
                </p>
              </div>
            </div>
          </div>
        );

      case 'contracts':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Legal Documents List - Compact */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Yasal Belgeler</h3>
              
              <div className="space-y-2">
                {LEGAL_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/legal/${doc.slug}`}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Görüntüle"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDownloadLegalDocument(doc.id, doc.title, doc.slug)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="PDF İndir"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment-specific contracts - Compact */}
            {subscription.currentPlan !== 'free' && paymentHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-5">Ödeme Belgeleri</h3>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
            <div>
                      <p className="font-medium text-gray-900 text-sm">Mesafeli Satış Sözleşmesi</p>
                      <p className="text-xs text-gray-500">Abonelik sözleşmeniz</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadDistanceSalesContract}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="PDF İndir"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Info Note - Compact */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Tüm belgelerimiz Türkiye Cumhuriyeti yasalarına (KVKK, E-Ticaret Kanunu, Tüketicinin Korunması Hakkında Kanun) uygun olarak hazırlanmıştır.
                </p>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Notifications */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Bildirim Tercihleri</h3>
              
              <div className="space-y-2">
                {[
                  { id: 'email_updates', label: 'E-posta güncellemeleri', description: 'Yeni şablonlar ve özellikler', enabled: true },
                  { id: 'rsvp_notifications', label: 'RSVP bildirimleri', description: 'Yeni katılım yanıtları', enabled: true },
                  { id: 'marketing', label: 'Pazarlama e-postaları', description: 'Özel teklifler ve kampanyalar', enabled: false },
                  { id: 'monthly_summary', label: 'Aylık özet', description: 'İstatistikler ve başarılar', enabled: true },
                ].map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{setting.label}</p>
                      <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        defaultChecked={setting.enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Language & Region */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Dil ve Bölge</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dil
                  </label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white">
                    <option>🇹🇷 Türkçe</option>
                    <option>🇬🇧 English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Saat Dilimi
                  </label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white">
                    <option>🇹🇷 Turkey (GMT+3)</option>
                    <option>🌍 UTC (GMT+0)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Modern */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl p-4 shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Hesap Ayarları
          </h1>
              <p className="text-gray-600">
            Profil bilgilerinizi ve hesap ayarlarınızı yönetin
          </p>
            </div>
            {subscription.currentPlan !== 'free' && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-blue-50 px-4 py-2 rounded-xl border-2 border-primary-200">
                {getPlanIcon(subscription.currentPlan)}
                <span className="font-bold text-primary-900">
                  {subscription.planConfig?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Modern */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 sticky top-4 bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all touch-target group ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-500 to-blue-600 text-white shadow-md scale-105'
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-white' : 'text-gray-500 group-hover:text-primary-600'}>
                  {tab.icon}
                  </span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content - Modern */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal - Modern */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => setShowPasswordModal(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in border border-gray-200">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
                  <Lock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">🔐 Şifre Değiştir</h3>
                  <p className="text-sm text-gray-600">Hesap güvenliğinizi koruyun</p>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mevcut Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                    required
                    autoComplete="current-password"
                      placeholder="Mevcut şifrenizi girin"
                  />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                    required
                    minLength={6}
                    autoComplete="new-password"
                      placeholder="En az 6 karakter"
                  />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>ℹ️</span> En az 6 karakter içermelidir
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Yeni Şifre (Tekrar)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                    required
                    autoComplete="new-password"
                      placeholder="Yeni şifrenizi tekrar girin"
                  />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
                    disabled={isSaving}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Kaydediliyor...
                      </span>
                    ) : (
                      '✓ Şifreyi Değiştir'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        title="Aboneliği İptal Et"
        message={(() => {
          const refundInfo = subscription.canCancelWithRefund();
          const endDate = new Date(subscription.subscription?.endDate || '').toLocaleDateString('tr-TR');
          return refundInfo.canRefund
            ? `${subscription.planConfig?.name} aboneliğinizi iptal etmek istediğinize emin misiniz?\n\n✅ ${refundInfo.daysLeft} gün içinde iptal ettiğiniz için ödediğiniz tutar kartınıza iade edilecek.\n\n ⚠️ İade sonrası HEMEN FREE plana düşeceksiniz ve tüm premium özelliklerinizi kaybedeceksiniz.`
            : `${subscription.planConfig?.name} aboneliğinizi iptal etmek istediğinize emin misiniz?\n\n❌ 3 günlük iade süresi geçtiği için ödediğiniz tutar iade edilmeyecek.\n\n İptal etseniz bile ${endDate} tarihine kadar tüm ${subscription.planConfig?.name} özelliklerini kullanmaya devam edebilirsiniz.\n\n İptal sonrası: ${endDate} tarihinde otomatik olarak FREE plana geçeceksiniz.`;
        })()}
        confirmText="Evet, İptal Et"
        cancelText="Vazgeç"
        type="warning"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default AccountPage;
