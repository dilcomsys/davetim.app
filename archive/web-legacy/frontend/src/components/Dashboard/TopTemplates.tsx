import React from 'react';
import { Star, TrendingUp, Eye } from 'lucide-react';

export interface TemplateUsage {
  templateId: string;
  templateName: string;
  previewImage?: string;
  usageCount: number;
  averageViews: number;
  tier: 'free' | 'pro' | 'premium';
}

interface TopTemplatesProps {
  templates: TemplateUsage[];
}

const tierColors = {
  free: 'bg-gray-100 text-gray-700',
  pro: 'bg-blue-100 text-blue-700',
  premium: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700',
};

const tierLabels = {
  free: 'Ücretsiz',
  pro: 'PRO',
  premium: 'PREMIUM',
};

export const TopTemplates: React.FC<TopTemplatesProps> = ({ templates }) => {
  if (!templates || templates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">En Popüler Şablonlar</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Henüz şablon kullanımı yok</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">En Popüler Şablonlarınız</h3>
        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
      </div>

      <div className="space-y-3 sm:space-y-4">
        {templates.map((template, index) => (
          <div
            key={template.templateId}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/60 transition-all"
          >
            {/* Rank */}
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                  index === 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : index === 1
                    ? 'bg-gray-100 text-gray-700'
                    : index === 2
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
            </div>

            {/* Template preview */}
            {template.previewImage ? (
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={template.previewImage}
                  alt={template.templateName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              </div>
            )}

            {/* Template info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                  {template.templateName}
                </h4>
                <span
                  className={`px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${
                    tierColors[template.tier]
                  }`}
                >
                  {tierLabels[template.tier]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {template.usageCount} kullanım
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Ort. {template.averageViews} görüntüleme
                </span>
              </div>
            </div>

            {/* Medal for top 3 */}
            {index < 3 && (
              <div className="flex-shrink-0 self-start sm:self-auto">
                {index === 0 && <span className="text-xl sm:text-2xl">🥇</span>}
                {index === 1 && <span className="text-xl sm:text-2xl">🥈</span>}
                {index === 2 && <span className="text-xl sm:text-2xl">🥉</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

