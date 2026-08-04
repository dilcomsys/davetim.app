import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Star, Zap, Sparkles, MessageCircle, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { PLAN_CONFIGS, type PlanTier } from '../config/plans';
import PaymentModal from '../components/Payment/PaymentModal';
import toast from 'react-hot-toast';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    planTier: 'pro' | 'premium';
    amount: number;
  }>({
    isOpen: false,
    planTier: 'pro',
    amount: 0,
  });

  // Planları plans.ts'den al ve display için formatla
  const plans = [
    {
      id: 'free' as PlanTier,
      name: PLAN_CONFIGS.free.name,
      price: PLAN_CONFIGS.free.price,
      description: 'Tek kullanım',
      icon: <Star className="h-5 w-5" />,
      color: 'gray',
      features: [
        `${PLAN_CONFIGS.free.limits.invitationsLifetime} davetiye`,
        `${PLAN_CONFIGS.free.limits.basicTemplatesCount} temel şablon`,
        'PDF + PNG indirme',
        'Link paylaşımı',
        `Max ${PLAN_CONFIGS.free.limits.maxGuestsPerInvitation} kişi RSVP`,
        `${PLAN_CONFIGS.free.limits.storageMB}MB depolama`
      ],
      limitations: [
        'Premium şablonlar yok',
        'Görsel yükleme yok',
        'Sosyal medya yok',
        'Watermark var'
      ],
      popular: false,
      cta: 'Ücretsiz Başla',
      badge: null,
      hasYearly: false
    },
    {
      id: 'pro' as PlanTier,
      name: PLAN_CONFIGS.pro.name,
      price: PLAN_CONFIGS.pro.price,
      description: 'Düzenli kullanım',
      icon: <Zap className="h-5 w-5" />,
      color: 'primary',
      features: [
        `${PLAN_CONFIGS.pro.limits.invitationsPerMonth} davetiye/ay`,
        'Tüm PRO şablonlar',
        'Görsel yükleme',
        'WhatsApp, Telegram, Instagram',
        'Sınırsız RSVP',
        'Excel export',
        `${PLAN_CONFIGS.pro.limits.storageMB}MB depolama`
      ],
      limitations: [],
      popular: true,
      cta: 'PRO\'ya Başla',
      badge: 'Sadece Aylık',
      hasYearly: false
    },
    {
      id: 'premium' as PlanTier,
      name: PLAN_CONFIGS.premium.name,
      price: PLAN_CONFIGS.premium.price,
      description: 'Sınırsız + QR Medya',
      icon: <Crown className="h-5 w-5" />,
      color: 'gradient',
      features: [
        'Sınırsız davetiye',
        'PRO\'nun tüm özellikleri',
        '🎥 QR medya (3 ay)',
        '🎥 Yıllıkta 1 yıl saklanır',
        '7/24 öncelikli destek',
        'Watermark\'sız yayın',
        `${PLAN_CONFIGS.premium.limits.storageMB}MB depolama`
      ],
      limitations: [],
      popular: false,
      cta: 'PREMIUM\'a Başla',
      badge: 'Yıllık: Medya 1 yıl',
      hasYearly: true
    }
  ];

  const handlePlanSelect = (planId: string, planPrice: { monthly: number; yearly: number }, hasYearly?: boolean) => {
    if (planId === 'free') {
      if (!user) {
        navigate('/signup');
      } else {
        toast.info('Zaten ücretsiz plandasınız');
      }
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast.error('Ödeme yapmak için giriş yapmalısınız');
      navigate('/auth');
      return;
    }

    // Calculate amount based on plan and billing period
    const amount = hasYearly === false ? planPrice.monthly : planPrice[billingPeriod];

    // Open payment modal
    setPaymentModal({
      isOpen: true,
      planTier: planId as 'pro' | 'premium',
      amount,
    });
  };

  const getPlanCardClass = (plan: any) => {
    if (plan.popular) {
      return 'border-2 border-primary-500 relative shadow-xl ring-2 ring-primary-200';
    }
    return 'border border-gray-200 hover:border-primary-300 shadow-md hover:shadow-lg transition-all';
  };

  const getButtonClass = (plan: any) => {
    switch (plan.color) {
      case 'primary':
        return 'w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm';
      case 'gradient':
        return 'w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm';
      default:
        return 'w-full px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary-300 transition-all text-sm';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Compact */}
        <div className="text-center mb-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-primary-200/50 mb-4">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-semibold text-gray-700">Esnek Fiyatlandırma</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Size Uygun Planı Seçin
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            İhtiyacınıza göre tasarlanmış planlar. İstediğiniz zaman yükseltebilir, 3 gün içinde iptal edebilirsiniz.
          </p>
        </div>

        {/* Billing Toggle - Compact */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Yıllık
            </button>
          </div>
        </div>

        {/* Pricing Cards - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan: any) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 ${getPlanCardClass(plan)}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                    En Popüler
                  </span>
                </div>
              )}
              
              {/* Plan Badge */}
              {plan.badge && !plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header - Compact */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${
                  plan.color === 'primary' ? 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600' :
                  plan.color === 'gradient' ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600' :
                  'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {plan.description}
                </p>
              </div>

              {/* Pricing - Compact */}
              <div className="text-center mb-6">
                <div className="flex items-end justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    ₺{plan.hasYearly === false || !plan.price.yearly ? plan.price.monthly : plan.price[billingPeriod]}
                  </span>
                  {(plan.hasYearly === false || !plan.price.yearly ? plan.price.monthly : plan.price[billingPeriod]) > 0 && (
                    <span className="text-gray-600 ml-1 text-sm">
                      /{plan.hasYearly === false ? 'ay' : billingPeriod === 'monthly' ? 'ay' : 'yıl'}
                    </span>
                  )}
                </div>
                {billingPeriod === 'yearly' && plan.hasYearly !== false && plan.price.yearly > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    (₺{Math.round(plan.price.yearly / 12)}/ay)
                  </p>
                )}
                {plan.hasYearly === false && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sadece aylık
                  </p>
                )}
              </div>

              {/* Features - Compact */}
              <div className="mb-6">
                <ul className="space-y-2.5">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handlePlanSelect(plan.id, plan.price, plan.hasYearly)}
                className={getButtonClass(plan)}
              >
                {plan.cta}
              </button>

              {/* Limitations - Compact */}
              {plan.limitations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">Sınırlamalar:</p>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start text-xs text-gray-500">
                        <X className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ Section - Compact */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 mb-8 border border-gray-200 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-6">
            Sık Sorulan Sorular
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">
                Otomatik yenileme var mı?
              </h3>
              <p className="text-sm text-gray-600">
                Hayır, abonelikler tek seferlik ödemedir. Dönem bitiminde manuel olarak yenileme yapmanız gerekir.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">
                İptal ve İade Politikası
              </h3>
              <p className="text-sm text-gray-600">
                ✅ <strong>3 gün içinde:</strong> Tam iade, FREE plana düşersiniz.<br/>
                ❌ <strong>3 gün sonra:</strong> İade yok, dönem sonuna kadar kullanabilirsiniz.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">
                Planımı değiştirebilir miyim?
              </h3>
              <p className="text-sm text-gray-600">
                Evet, yükseltme anında geçerli olur. Düşürme ise mevcut dönem sonunda devreye girer.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">
                Hangi ödeme yöntemleri?
              </h3>
              <p className="text-sm text-gray-600">
                Kredi kartı ve banka kartı. Tüm ödemeler güvenli ödeme altyapısı (İyzico) ile korunur.
              </p>
            </div>
          </div>
        </div>

        {/* Support CTA - Compact */}
        <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 text-center border border-primary-200/50 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full mb-3">
            <MessageCircle className="h-3.5 w-3.5 text-primary-600" />
            <span className="text-xs font-semibold text-gray-700">Destek</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Hala Karar Veremediniz mi?
          </h2>
          <p className="text-sm text-gray-600 mb-4 max-w-2xl mx-auto">
            Ekibimiz size en uygun planı seçmenizde yardımcı olmaktan mutluluk duyar
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
            >
              Canlı Destek
            </button>
            <button
              onClick={() => window.open('https://wa.me/905359216894?text=Merhaba%20Davetim%2C%20planlar%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.', '_blank')}
              className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary-300 transition-all text-sm"
            >
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}
        planTier={paymentModal.planTier}
        billingPeriod={billingPeriod}
        amount={paymentModal.amount}
      />
    </div>
  );
};

export default PricingPage;
