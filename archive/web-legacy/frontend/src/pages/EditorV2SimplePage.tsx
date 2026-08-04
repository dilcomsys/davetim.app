/**
 * Editor V2 - Simple & User-Friendly Version
 * Basit, minimalist ve kullanıcı dostu davetiye editörü
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Download, Palette, Type, Image as ImageIcon, Sparkles } from 'lucide-react';
import { templateService, type Template } from '../services/templateService';
import { invitationService } from '../services/invitationService';
import { useAuth } from '../store/authStore';
import type { ColorPalette } from '../types/template';
import { TEMPLATE_FONTS } from '../utils/fonts';
import { colorPresets } from '../utils/colorPresets';
import toast from 'react-hot-toast';

const EditorV2SimplePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // State
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form Data - Basit ve anlaşılır
  const [formData, setFormData] = useState({
    // Text Fields - Template'den gelecek
    title: '',
    subtitle: '',
    date: '',
    time: '',
    location: '',
    message: ''
  });

  // Styling - Basit kontroller
  const [styling, setStyling] = useState({
    colorPalette: {
      primary: '#2C3E50',
      secondary: '#ECF0F1',
      accent: '#C0A062',
      background: '#FFFFFF',
      text: '#2C3E50'
    } as ColorPalette,
    fontFamily: 'Playfair Display',
    backgroundImage: null as string | null
  });

  // UI State
  const [activePanel, setActivePanel] = useState<'content' | 'style'>('content');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Giriş yapmalısınız');
      navigate('/auth');
      return;
    }
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    setIsLoading(true);
    try {
      const templateId = searchParams.get('template');
      if (!templateId) {
        toast.error('Template seçilmedi');
        navigate('/templates');
        return;
      }

      const tmpl = await templateService.getTemplateById(templateId);
      if (!tmpl) {
        toast.error('Template bulunamadı');
        navigate('/templates');
        return;
      }

      setTemplate(tmpl);
      
      // Template'den default değerleri al
      setStyling({
        colorPalette: tmpl.color_palette,
        fontFamily: tmpl.available_fonts[0] || 'Playfair Display',
        backgroundImage: tmpl.default_image_url
      });

      // Text fields'dan default değerleri al
      const initialData: any = {};
      tmpl.text_fields.forEach(field => {
        const key = field.id;
        initialData[key] = field.defaultValue || '';
      });
      setFormData(initialData);

      toast.success('Template yüklendi');
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Yükleme hatası');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setStyling({
      ...styling,
      colorPalette: { ...styling.colorPalette, [colorKey]: value }
    });
  };

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setStyling({
      ...styling,
      colorPalette: {
        primary: preset.colors.primary,
        secondary: preset.colors.secondary,
        accent: preset.colors.accent,
        background: preset.colors.background,
        text: preset.colors.text
      }
    });
    toast.success('Tema uygulandı');
  };

  const handleSave = async () => {
    if (!template) return;

    // Validation
    if (!formData.title?.trim()) {
      toast.error('Başlık gerekli');
      return;
    }

    setIsSaving(true);
    try {
      const invitationData = {
        template_id: template.id,
        title: formData.title,
        event_date: formData.date || undefined,
        event_time: formData.time || undefined,
        event_location_name: formData.location || undefined,
        content: {
          text_values: formData,
          color_palette: styling.colorPalette,
          font_family: styling.fontFamily,
          background_image: styling.backgroundImage
        }
      };

      const result = await invitationService.createInvitation(invitationData);
      
      if (result) {
        toast.success('Davetiye kaydedildi!');
        navigate(`/dashboard`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kaydetme hatası');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Template bulunamadı</p>
          <button
            onClick={() => navigate('/templates')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Template'lere Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Minimalist */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/templates')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{template.name}</h1>
                <p className="text-xs text-gray-500">{template.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Editor Panel */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex gap-2">
              <button
                onClick={() => setActivePanel('content')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activePanel === 'content'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Type className="h-4 w-4" />
                İçerik
              </button>
              <button
                onClick={() => setActivePanel('style')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activePanel === 'style'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Palette className="h-4 w-4" />
                Stil
              </button>
            </div>

            {/* Content Panel */}
            {activePanel === 'content' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Davetiye İçeriği</h2>

                {/* Dynamic form based on template text_fields */}
                {template.text_fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.multiline ? (
                      <textarea
                        value={formData[field.id as keyof typeof formData] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || field.defaultValue}
                        maxLength={field.constraints?.maxLength}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      />
                    ) : (
                      <input
                        type={field.id.includes('date') ? 'date' : field.id.includes('time') ? 'time' : 'text'}
                        value={formData[field.id as keyof typeof formData] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || field.defaultValue}
                        maxLength={field.constraints?.maxLength}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    )}
                    {field.constraints?.maxLength && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(formData[field.id as keyof typeof formData] || '').length}/{field.constraints.maxLength}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Style Panel */}
            {activePanel === 'style' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Stil Ayarları</h2>

                {/* Font Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font
                  </label>
                  <select
                    value={styling.fontFamily}
                    onChange={(e) => setStyling({ ...styling, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {template.available_fonts.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                {/* Color Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Hazır Temalar
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {colorPresets.slice(0, 6).map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-left"
                      >
                        <div className="flex gap-1.5 mb-2">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.secondary }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.accent }} />
                        </div>
                        <p className="text-xs font-medium text-gray-700">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Özel Renkler
                  </label>
                  <div className="space-y-3">
                    {Object.entries(styling.colorPalette).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-sm text-gray-600 capitalize">
                          {key === 'primary' ? 'Ana Renk' :
                           key === 'secondary' ? 'İkincil Renk' :
                           key === 'accent' ? 'Vurgu' :
                           key === 'background' ? 'Arka Plan' :
                           key === 'text' ? 'Metin' : key}
                        </label>
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Önizleme</h2>
                <Eye className="h-5 w-5 text-gray-400" />
              </div>

              {/* Preview Card */}
              <div
                className="rounded-lg overflow-hidden shadow-lg relative"
                style={{
                  minHeight: '500px',
                  backgroundColor: styling.colorPalette.background,
                  backgroundImage: styling.backgroundImage ? `url(${styling.backgroundImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Overlay if background image exists */}
                {styling.backgroundImage && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${styling.colorPalette.primary}CC 0%, ${styling.colorPalette.secondary}CC 100%)`
                    }}
                  />
                )}

                <div className="relative z-10 p-8 md:p-12 flex items-center justify-center min-h-[500px]">
                  <div
                    className="text-center space-y-4 max-w-md"
                    style={{ fontFamily: styling.fontFamily }}
                  >
                    {/* Title */}
                    {formData.title && (
                      <h1
                        className="text-3xl md:text-4xl font-bold"
                        style={{ color: styling.colorPalette.text }}
                      >
                        {formData.title}
                      </h1>
                    )}

                    {/* Divider */}
                    <div
                      className="w-24 h-1 mx-auto rounded-full"
                      style={{ backgroundColor: styling.colorPalette.accent }}
                    />

                    {/* Subtitle */}
                    {formData.subtitle && (
                      <p
                        className="text-xl"
                        style={{ color: styling.colorPalette.text }}
                      >
                        {formData.subtitle}
                      </p>
                    )}

                    {/* Date & Time */}
                    {(formData.date || formData.time) && (
                      <div
                        className="p-4 rounded-lg"
                        style={{
                          backgroundColor: styling.colorPalette.background,
                          color: styling.colorPalette.primary
                        }}
                      >
                        {formData.date && (
                          <div className="font-medium">
                            {new Date(formData.date).toLocaleDateString('tr-TR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                        {formData.time && (
                          <div className="mt-1">{formData.time}</div>
                        )}
                      </div>
                    )}

                    {/* Location */}
                    {formData.location && (
                      <>
                        <div
                          className="w-16 h-1 mx-auto rounded-full"
                          style={{ backgroundColor: styling.colorPalette.accent }}
                        />
                        <p style={{ color: styling.colorPalette.text }}>
                          {formData.location}
                        </p>
                      </>
                    )}

                    {/* Message */}
                    {formData.message && (
                      <>
                        <div
                          className="w-16 h-1 mx-auto rounded-full"
                          style={{ backgroundColor: styling.colorPalette.accent }}
                        />
                        <p
                          className="text-sm italic p-4 rounded-lg"
                          style={{
                            backgroundColor: styling.colorPalette.background,
                            color: styling.colorPalette.primary,
                            border: `2px solid ${styling.colorPalette.accent}`
                          }}
                        >
                          "{formData.message}"
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                ⚡ Değişiklikler anında görünür
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorV2SimplePage;

