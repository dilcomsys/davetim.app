import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, Star, Crown, Lock } from 'lucide-react';
import type { Template } from '../../services/templateService';
import { useSubscription } from '../../hooks/useSubscription';

interface TemplateCardProps {
  template: Template;
  onSave?: (templateId: string) => void;
  isSaved?: boolean;
  onUpgradeNeeded?: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSave, isSaved = false, onUpgradeNeeded }) => {
  const navigate = useNavigate();
  const subscription = useSubscription();
  
  // Plan kontrolü - Premium şablonlara erişim var mı?
  // Free plan sadece 'free' tier şablonlara erişebilir, PRO ve PREMIUM şablonlar kilitli
  const isPremiumOrProTemplate = template.tier === 'premium' || template.tier === 'pro';
  const canAccessPremium = subscription.planConfig?.limits.premiumTemplates || false;
  const isLocked = isPremiumOrProTemplate && !canAccessPremium;
  
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) {
      onSave(template.id);
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    // Premium şablon ve erişim yoksa engelleyelim
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      if (onUpgradeNeeded) {
        onUpgradeNeeded();
      }
      return false;
    }
    // Erişim varsa normal link çalışır
  };

  const getTierBadge = () => {
    if (template.tier === 'free') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Ücretsiz
        </span>
      );
    } else if (template.tier === 'pro') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Star className="h-3 w-3" />
          Pro
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Crown className="h-3 w-3" />
          Premium
        </span>
      );
    }
  };

  // Kilitli durumlarda Link yerine div kullan
  const WrapperComponent = isLocked ? 'div' : Link;
  const wrapperProps = isLocked 
    ? {
        onClick: handleClick,
        className: `group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer opacity-90`
      }
    : {
        to: `/editor?template=${template.slug}`,
        className: `group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden`
      };

  return (
    <WrapperComponent {...wrapperProps as any}>
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={template.preview_image_url}
          alt={template.name}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isLocked ? 'blur-sm' : 'group-hover:scale-105'
          }`}
          loading="lazy"
        />
        
        {/* Lock Overlay for Premium/PRO Templates */}
        {isLocked && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-white">
            <Lock className="h-12 w-12 mb-3" />
            <div className="text-lg font-semibold mb-1">
              {template.tier === 'premium' ? 'PREMIUM Şablon' : 'PRO Şablon'}
            </div>
            <div className="text-sm text-center px-4">
              {template.tier === 'premium' 
                ? 'PRO veya PREMIUM plana yükseltin' 
                : 'PRO plana yükseltin'}
            </div>
          </div>
        )}
        
        {/* Overlay on hover */}
        {!isLocked && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
              <button className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Önizle
              </button>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {template.is_featured && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Star className="h-3 w-3 fill-current" />
              Öne Çıkan
            </span>
          )}
          {template.is_popular && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              🔥 Popüler
            </span>
          )}
        </div>

        {/* Save/Favorite Button */}
        {onSave && (
          <button
            onClick={handleSaveClick}
            className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
              isSaved
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
            title={isSaved ? 'Kaydedildi' : 'Kaydet'}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
            {template.name}
          </h3>
          {getTierBadge()}
        </div>

        {template.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {template.description}
          </p>
        )}

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Category */}
        {template.category && (
          <p className="text-xs text-gray-500">
            {template.category.name}
          </p>
        )}
      </div>
    </WrapperComponent>
  );
};

export default TemplateCard;
