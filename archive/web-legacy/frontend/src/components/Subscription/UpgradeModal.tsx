import React from 'react';
import { X, Check, Crown, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlanTier, getPlanConfig } from '../../config/plans';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  featureDescription: string;
  currentPlan: PlanTier;
  recommendedPlan?: 'free' | 'pro' | 'premium';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  feature,
  featureDescription,
  currentPlan,
  recommendedPlan
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Önerilen planı belirle - Premium şablonlar için sadece PREMIUM plan öner
  const suggestedPlan = recommendedPlan || (
    feature === 'premium_templates' && currentPlan !== 'premium' ? 'premium' :
      currentPlan === 'free' ? 'pro' :
        currentPlan === 'pro' ? 'premium' :
          'premium'
  ) as PlanTier;

  const planConfig = getPlanConfig(suggestedPlan);
  const currentPlanConfig = getPlanConfig(currentPlan);

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  const getFeatureIcon = () => {
    switch (feature) {
      case 'create_invitation':
        return '📝';
      case 'premium_templates':
        return '🎨';
      case 'image_upload':
        return '🖼️';
      case 'whatsapp_sharing':
        return '📱';
      case 'excel_export':
        return '📊';
      case 'qr_media':
        return '🎥';
      case 'ai_design':
        return '🤖';
      default:
        return '✨';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{getFeatureIcon()}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bu Özellik {planConfig.name} ile Kullanılabilir
            </h2>
            <p className="text-gray-600">
              {featureDescription}
            </p>
          </div>

          {/* Current vs Recommended Plan */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Mevcut Planınız</div>
                <div className="font-semibold text-gray-900">{currentPlanConfig.name}</div>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />

              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Önerilen Plan</div>
                <div className="font-semibold text-primary-600 flex items-center">
                  {suggestedPlan === 'premium' ? (
                    <Crown className="h-4 w-4 mr-1" />
                  ) : (
                    <Zap className="h-4 w-4 mr-1" />
                  )}
                  {planConfig.name}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                ₺{planConfig.price.monthly}
                <span className="text-lg font-normal text-gray-600">/ay</span>
              </div>
              {planConfig.price.yearly && (
                <div className="text-sm text-gray-500 mt-1">
                  veya ₺{planConfig.price.yearly}/yıl
                </div>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              {planConfig.name} Planının Avantajları:
            </h3>
            <ul className="space-y-2">
              {suggestedPlan === 'pro' && (
                <>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Aylık 3 davetiye oluşturma</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Tüm premium şablonlar</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Görsel yükleme ve özelleştirme</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">WhatsApp paylaşım ve Excel export</span>
                  </li>
                </>
              )}
              {suggestedPlan === 'premium' && (
                <>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Sınırsız davetiye oluşturma</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">🎥 QR kodlu medya yükleme (3 ay / yıllıkta 1 yıl saklanır)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">🤖 AI destekli tasarım önerileri</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">7/24 öncelikli destek</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {suggestedPlan === 'premium' ? (
                <Crown className="h-5 w-5" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              <span>{planConfig.name} Planına Yükselt</span>
            </button>

            <button
              onClick={onClose}
              className="w-full btn-outline flex items-center justify-center"
            >
              <span>Şimdi Değil</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                <span>3 gün içinde iptal hakkı</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-1" />
                <span>Güvenli ödeme</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;

