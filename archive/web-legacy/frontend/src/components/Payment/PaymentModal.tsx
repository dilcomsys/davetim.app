import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { analyticsService } from '../../services/analyticsService';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { useSubscription } from '../../hooks/useSubscription';
import { generateDistanceSalesContractText } from '../../legal';
import toast from 'react-hot-toast';
import type { CardInfo, AddressInfo } from '../../types/payment';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planTier: 'pro' | 'premium';
  billingPeriod: 'monthly' | 'yearly';
  amount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planTier,
  billingPeriod,
  amount,
}) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [useTestCard, setUseTestCard] = useState(false);

  // Form state
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: '',
  });

  const [billingAddress, setBillingAddress] = useState<AddressInfo>({
    contactName: user?.fullName || '',
    city: '',
    country: 'Turkey',
    address: '',
    zipCode: '',
  });

  // Track checkout begin
  useEffect(() => {
    if (isOpen) {
      analyticsService.trackBeginCheckout(planTier, amount);
    }
  }, [isOpen, planTier, amount]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contractAccepted, setContractAccepted] = useState(false);

  if (!isOpen || !user) return null;

  // Generate Distance Sales Contract with user-specific data
  const distanceSalesContract = generateDistanceSalesContractText({
    userName: user.fullName,
    userEmail: user.email,
    planName: planTier.toUpperCase(),
    planPeriod: billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık',
    amount: amount
  });


  const handleTestCardToggle = () => {
    if (!useTestCard) {
      const testCard = paymentService.getTestCards().success;
      setCardInfo(testCard);
      setUseTestCard(true);
      toast.success('Test kartı bilgileri yüklendi');
    } else {
      setCardInfo({
        cardHolderName: '',
        cardNumber: '',
        expireMonth: '',
        expireYear: '',
        cvc: '',
      });
      setUseTestCard(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate card info
    if (!cardInfo.cardHolderName.trim()) {
      newErrors.cardHolderName = 'Kart sahibi adı gerekli';
    }
    if (!cardInfo.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      newErrors.cardNumber = 'Geçerli bir kart numarası girin';
    }
    if (!cardInfo.expireMonth.match(/^(0[1-9]|1[0-2])$/)) {
      newErrors.expireMonth = 'Geçerli ay (01-12)';
    }
    if (!cardInfo.expireYear.match(/^\d{4}$/)) {
      newErrors.expireYear = 'Geçerli yıl (YYYY)';
    }
    if (!cardInfo.cvc.match(/^\d{3}$/)) {
      newErrors.cvc = 'Geçerli CVV (3 hane)';
    }

    // Validate billing address
    if (!billingAddress.contactName.trim()) {
      newErrors.contactName = 'İsim gerekli';
    }
    if (!billingAddress.city.trim()) {
      newErrors.city = 'Şehir gerekli';
    }
    if (!billingAddress.address.trim()) {
      newErrors.address = 'Adres gerekli';
    }

    // Validate contract acceptance
    if (!contractAccepted) {
      newErrors.contract = 'Mesafeli Satış Sözleşmesini kabul etmelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Lütfen tüm alanları doğru doldurun');
      return;
    }

    setLoading(true);

    try {
      // Process payment
      const result = await paymentService.processSubscriptionPayment({
        planTier,
        billingPeriod,
        customerId: user.id,
        customerName: user.fullName.split(' ')[0] || 'User',
        customerSurname: user.fullName.split(' ').slice(1).join(' ') || 'Name',
        customerEmail: user.email,
        customerPhone: user.phone || '+905551234567',
        billingAddress,
        cardInfo: {
          ...cardInfo,
          cardNumber: cardInfo.cardNumber.replace(/\s/g, ''),
        },
        installment: 1,
      });
      // Status codes: 0 = SUCCESS, 1 = PENDING, 2 = FAILED, 3 = WAITING_3D_SECURE
      // Compare as strings since result.status can be string or number from API
      const statusStr = String(result.status);
      if (result.success && (statusStr === 'WAITING_3D' || statusStr === '1' || statusStr === '3')) {
        // Save pending payment data and transaction ID for callback
        const pendingPaymentData = {
          planTier,
          billingPeriod,
          amount,
        };
        sessionStorage.setItem('pending_payment', JSON.stringify(pendingPaymentData));
        sessionStorage.setItem('last_transaction_id', result.transactionId);

        console.log('💾 Saved payment data to sessionStorage:', {
          transactionId: result.transactionId,
          planTier,
          billingPeriod,
          amount,
        });

        // ✅ DOĞRU: HTML'i frontend'te render et
        if (!result.threeDSecureHtmlContent) {
          toast.error('3D Secure HTML içeriği alınamadı');
          console.error('❌ threeDSecureHtmlContent eksik:', result);
          return;
        }

        console.log('✅ 3D Secure HTML alındı, render ediliyor...');
        toast.success('3D Secure doğrulama ekranı açılıyor...');

        // Render 3D Secure HTML in modal (frontend'te direkt render)
        paymentService.handle3DSecure(result.threeDSecureHtmlContent);

        // Close payment modal (3D Secure modal is now open)
        onClose();
      } else if (result.success && statusStr === '0') {
        // Direct success (without 3D Secure)
        await subscriptionService.upgradeSubscription(
          user.id,
          planTier,
          billingPeriod,
          result.transactionId
        );

        await subscriptionService.savePaymentHistory(
          user.id,
          result.transactionId,
          result.providerTransactionId,
          'iyzico',
          amount,
          'TRY',
          'SUCCESS',
          planTier,
          billingPeriod
        );

        // Track purchase
        analyticsService.trackPurchase(
          result.transactionId,
          planTier,
          amount
        );

        // Force refresh auth state without page reload
        console.log('🔄 Force refreshing auth state...');
        sessionStorage.removeItem('pending_payment');

        // Wait a bit for database to settle
        console.log('⏳ Waiting 1 second for database to settle...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get fresh user data from Supabase
        console.log('🔄 Fetching fresh user data from database...');
        const freshUser = await authService.getCurrentUser();
        console.log('📊 Fresh user data:', freshUser);
        console.log('📊 Fresh subscription tier:', freshUser?.subscriptionTier);

        // Update auth store with fresh data
        if (freshUser) {
          console.log('🔄 Updating auth store with fresh data...');
          updateUser(freshUser);

          // Force storage to persist immediately
          const currentState = useAuthStore.getState();
          localStorage.setItem('auth-store', JSON.stringify({
            state: {
              user: freshUser,
              session: currentState.session,
              isInitialized: currentState.isInitialized
            },
            version: 0
          }));

          console.log('✅ Auth store updated');
          console.log('✅ Updated user:', useAuthStore.getState().user);

          // Dispatch custom event to force re-render
          console.log('📢 Dispatching subscription update event...');
          window.dispatchEvent(new CustomEvent('subscription-updated', {
            detail: { user: freshUser }
          }));
        }

        // Refresh subscription hook
        console.log('🔄 Refreshing subscription hook...');
        await refreshSubscription();
        console.log('✅ Subscription hook refreshed');

        // Small delay to ensure UI updates propagate
        await new Promise(resolve => setTimeout(resolve, 800));

        toast.success('Ödeme başarılı! 🎉');
        onClose();

        // Navigate to account page (no reload)
        navigate('/account');
      } else {
        // Payment failed or unknown status
        console.error('❌ Payment failed or unknown status:', result);
        console.error('  - success:', result.success);
        console.error('  - status:', result.status);
        console.error('  - errorMessage:', result.errorMessage);
        toast.error(result.errorMessage || 'Ödeme başarısız');
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      toast.error('Ödeme sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* Backdrop with blur - no click to close for payment security */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in max-h-[95vh] flex flex-col">
          {/* Close button - Modern floating style */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 flex items-center justify-center hover:rotate-90 disabled:opacity-50"
            disabled={loading}
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Split Layout: Left = Info, Right = Form */}
          <div className="grid md:grid-cols-5 flex-1 overflow-hidden">
            {/* Left Side - Order Summary (2 cols on desktop) - COMPACT */}
            <div className="md:col-span-2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-white flex flex-col justify-between">
              {/* Header - Compact */}
              <div>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm mb-4">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold mb-1">Sipariş Özeti</h2>
                <p className="text-primary-100 text-xs">Güvenli ödeme</p>
              </div>

              {/* Order Details - Compact */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white/80 text-xs mb-0.5">Seçilen Plan</p>
                      <p className="text-lg font-bold">{planTier.toUpperCase()}</p>
                    </div>
                    <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/20">
                    <div className="flex items-baseline justify-between">
                      <span className="text-white/80 text-xs">Toplam</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold">₺{amount}</span>
                        <span className="text-white/60 text-xs ml-1">
                          / {billingPeriod === 'monthly' ? 'ay' : 'yıl'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security & Payment Methods - Compact */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <Lock className="h-4 w-4 flex-shrink-0" />
                    <p>256-bit SSL şifreleme</p>
                  </div>

                  {/* Payment Infrastructure Logo */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <img
                      src="/images/bank_band_logo.png"
                      alt="Desteklenen Ödeme Yöntemleri"
                      className="w-full h-auto object-contain opacity-90"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Payment Form (3 cols on desktop) - COMPACT & SCROLLABLE */}
            <div className="md:col-span-3 p-6 overflow-y-auto">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Ödeme Bilgileri</h3>
                <p className="text-gray-600 text-xs">Kart bilgilerinizi güvenle girebilirsiniz</p>
              </div>

              {/* Test Card Toggle (Development) */}
              {import.meta.env.DEV && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <button
                    type="button"
                    onClick={handleTestCardToggle}
                    className="text-xs text-yellow-800 hover:text-yellow-900 font-medium flex items-center gap-1.5"
                  >
                    <span>🧪</span>
                    <span>{useTestCard ? 'Test kartını temizle' : 'Test kartı kullan'}</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Card Information Section - COMPACT */}
                <div className="space-y-3">
                  {/* Card Holder Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                      Kart Üzerindeki İsim
                    </label>
                    <input
                      type="text"
                      value={cardInfo.cardHolderName}
                      onChange={(e) => setCardInfo({ ...cardInfo, cardHolderName: e.target.value.toUpperCase() })}
                      className={`w-full px-3 py-2.5 bg-gray-50 border-2 ${errors.cardHolderName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'} rounded-lg text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      placeholder="AHMET YILMAZ"
                      disabled={loading}
                      autoComplete="cc-name"
                    />
                    {errors.cardHolderName && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.cardHolderName}
                      </p>
                    )}
                  </div>

                  {/* Card Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                      Kart Numarası
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCardNumber(cardInfo.cardNumber)}
                        onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: e.target.value.replace(/\s/g, '') })}
                        className={`w-full px-3 py-2.5 pr-10 bg-gray-50 border-2 ${errors.cardNumber ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'} rounded-lg text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        disabled={loading}
                        autoComplete="cc-number"
                      />
                      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.cardNumber && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.cardNumber}
                      </p>
                    )}
                  </div>

                  {/* Expiry & CVV - COMPACT */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">Ay</label>
                      <input
                        type="text"
                        value={cardInfo.expireMonth}
                        onChange={(e) => setCardInfo({ ...cardInfo, expireMonth: e.target.value })}
                        className={`w-full px-3 py-2.5 bg-gray-50 border-2 ${errors.expireMonth ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'} rounded-lg text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100 disabled:cursor-not-allowed text-center`}
                        placeholder="MM"
                        maxLength={2}
                        disabled={loading}
                        autoComplete="cc-exp-month"
                      />
                      {errors.expireMonth && <p className="text-xs text-red-600 mt-1">{errors.expireMonth}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">Yıl</label>
                      <input
                        type="text"
                        value={cardInfo.expireYear}
                        onChange={(e) => setCardInfo({ ...cardInfo, expireYear: e.target.value })}
                        className={`w-full px-3 py-2.5 bg-gray-50 border-2 ${errors.expireYear ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'} rounded-lg text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100 disabled:cursor-not-allowed text-center`}
                        placeholder="YYYY"
                        maxLength={4}
                        disabled={loading}
                        autoComplete="cc-exp-year"
                      />
                      {errors.expireYear && <p className="text-xs text-red-600 mt-1">{errors.expireYear}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-0.5">
                        CVV
                        <span className="text-xs text-gray-500 font-normal">(Arka)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardInfo.cvc}
                          onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value })}
                          className={`w-full px-3 py-2.5 pr-8 bg-gray-50 border-2 ${errors.cvc ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'} rounded-lg text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100 disabled:cursor-not-allowed text-center`}
                          placeholder="123"
                          maxLength={3}
                          disabled={loading}
                          autoComplete="cc-csc"
                        />
                        <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.cvc && <p className="text-xs text-red-600 mt-1">{errors.cvc}</p>}
                    </div>
                  </div>
                </div>

                {/* Billing Address Section - COMPACT */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Fatura Adresi</h4>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 mb-1.5">Ad Soyad</label>
                        <input
                          type="text"
                          value={billingAddress.contactName}
                          onChange={(e) => setBillingAddress({ ...billingAddress, contactName: e.target.value })}
                          className={`w-full px-3 py-2.5 bg-gray-50 border-2 ${errors.contactName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'} rounded-lg text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                          disabled={loading}
                          autoComplete="name"
                        />
                        {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 mb-1.5">Şehir</label>
                        <input
                          type="text"
                          value={billingAddress.city}
                          onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                          className={`w-full px-3 py-2.5 bg-gray-50 border-2 ${errors.city ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'} rounded-lg text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                          placeholder="İstanbul"
                          disabled={loading}
                          autoComplete="address-level2"
                        />
                        {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">Adres</label>
                      <textarea
                        value={billingAddress.address}
                        onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                        className={`w-full px-3 py-2.5 bg-gray-50 border-2 ${errors.address ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'} rounded-lg text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none`}
                        rows={2}
                        placeholder="Cadde, Sokak, No, Daire"
                        disabled={loading}
                        autoComplete="street-address"
                      />
                      {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                    </div>
                  </div>
                </div>

                {/* Mesafeli Satış Sözleşmesi - COMPACT */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-xs font-semibold text-gray-900 mb-2">
                    Mesafeli Satış Sözleşmesi
                  </label>
                  <textarea
                    value={distanceSalesContract}
                    readOnly
                    className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-xs text-gray-700 font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-100"
                    rows={12}
                  />

                  {/* Contract Acceptance Checkbox */}
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={contractAccepted}
                        onChange={(e) => setContractAccepted(e.target.checked)}
                        disabled={loading}
                        className="mt-0.5 w-5 h-5 text-primary-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-900 leading-tight group-hover:text-gray-700 transition-colors">
                        <strong>Mesafeli Satış Sözleşmesi</strong>'ni okudum, anladım ve kabul ediyorum.
                        <span className="block mt-1 text-xs text-amber-700">
                          * Bu sözleşmeyi kabul etmeden ödeme yapamazsınız.
                        </span>
                      </span>
                    </label>
                    {errors.contract && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.contract}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button - COMPACT */}
                <div className="pt-4 space-y-2.5">
                  <button
                    type="submit"
                    disabled={loading || !contractAccepted}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">İşleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span>₺{amount} Güvenli Ödeme Yap</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    İptal
                  </button>
                </div>

                {/* Terms & Security - COMPACT */}
                <div className="pt-3 space-y-2">
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    Ödeme yaparak{' '}
                    <a href="/terms" className="text-primary-600 hover:text-primary-700 underline">Kullanım Koşulları</a>
                    {' '}ve{' '}
                    <a href="/privacy" className="text-primary-600 hover:text-primary-700 underline">Gizlilik Politikası</a>
                    'nı kabul etmiş olursunuz.
                  </p>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3 text-green-600" />
                      <span>SSL Korumalı</span>
                    </div>
                    <span>•</span>
                    <span>PCI DSS Uyumlu</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

