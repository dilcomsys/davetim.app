import React from 'react';
import { Palette, Image, Sparkles, RotateCw } from 'lucide-react';
import ColorPicker from './ColorPicker';
import ImageUpload from './ImageUpload';
import { ALL_FONTS, type FontFamily, getFontFamily } from '../../utils/fonts';

interface DesignPanelProps {
  formData: {
    title: string;
    eventDate: string;
    eventTime: string;
    location: string;
    customMessage: string;
    imageUrl: string | null;
    imagePosition: 'profile' | 'background' | 'banner' | 'watermark';
    logoShape: 'circle' | 'square';
  };
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  onColorsChange: (colors: any) => void;
  defaultColors?: any;
  selectedFont: FontFamily;
  onFontChange: (font: FontFamily) => void;
  invitationId: string;
  userId: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  onPositionChange: (position: 'profile' | 'background' | 'banner' | 'watermark') => void;
  onLogoShapeChange: (shape: 'circle' | 'square') => void;
  onOpenGallery: () => void;
  onResetToTemplate?: () => void;
  hasTemplateOriginal?: boolean;
  currentPlan: 'free' | 'pro' | 'premium';
}

export const DesignPanel: React.FC<DesignPanelProps> = ({
  formData,
  onFormChange,
  colors,
  onColorsChange,
  defaultColors,
  selectedFont,
  onFontChange,
  invitationId,
  userId,
  onImageUploaded,
  onImageRemoved,
  onPositionChange,
  onLogoShapeChange,
  onOpenGallery,
  onResetToTemplate,
  hasTemplateOriginal,
  currentPlan
}) => {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1.5">
            ✏️ Başlık
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onFormChange}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
            placeholder="Etkinlik başlığı"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1.5">
              📅 Tarih
            </label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={onFormChange}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1.5">
              🕐 Saat
            </label>
            <input
              type="time"
              name="eventTime"
              value={formData.eventTime}
              onChange={onFormChange}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1.5">
            📍 Konum
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={onFormChange}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
            placeholder="Etkinlik konumu"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1.5">
            💬 Mesaj
          </label>
          <textarea
            name="customMessage"
            value={formData.customMessage}
            onChange={onFormChange}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none text-sm"
            rows={3}
            placeholder="Özel mesajınız"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Colors */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-900 flex items-center gap-1">
              <Palette className="h-4 w-4" />
              Renkler
            </label>
          </div>
          <ColorPicker
            colors={colors}
            onChange={onColorsChange}
            defaultColors={defaultColors}
          />
        </div>

        {/* Font */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1.5">
            Yazı Tipi
          </label>
          <select
            value={selectedFont}
            onChange={(e) => onFontChange(e.target.value as FontFamily)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white"
            style={{ fontFamily: getFontFamily(selectedFont) }}
          >
            {ALL_FONTS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: getFontFamily(font) }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Image Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-900 flex items-center gap-1">
              <Image className="h-4 w-4" />
              Görsel
            </label>
          </div>
          <ImageUpload
            invitationId={invitationId}
            userId={userId}
            currentImageUrl={formData.imageUrl}
            currentPosition={formData.imagePosition}
            currentLogoShape={formData.logoShape}
            onImageUploaded={onImageUploaded}
            onImageRemoved={onImageRemoved}
            onPositionChange={onPositionChange}
            onLogoShapeChange={onLogoShapeChange}
          />
        </div>

        {/* Decorative Elements (PREMIUM only) */}
        {currentPlan === 'premium' && (
          <>
            <div className="border-t border-gray-200 my-4" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-900 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Dekoratif Öğeler
                </label>
                <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  PREMIUM
                </span>
              </div>
              <button
                onClick={onOpenGallery}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Öğe Galerisi
              </button>
            </div>
          </>
        )}

        {/* Reset to Template */}
        {hasTemplateOriginal && onResetToTemplate && (
          <>
            <div className="border-t border-gray-200 my-4" />
            <button
              onClick={onResetToTemplate}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-amber-700" />
                <div className="text-left">
                  <p className="text-xs font-bold text-amber-900">Varsayılana Dön</p>
                  <p className="text-xs text-amber-700">Şablonun orijinal tasarımı</p>
                </div>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

