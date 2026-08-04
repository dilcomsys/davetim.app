/**
 * Editor V2 Test Page
 * Yeni V2 component'lerini test etmek için basit bir sayfa
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { TemplateCanvas } from '../components/Editor/TemplateCanvas';
import { FontPicker } from '../components/Editor/FontPicker';
import { DecorativeElementsPanel } from '../components/Editor/DecorativeElementsPanel';
import { ColorPaletteEditor } from '../components/Editor/ColorPaletteEditor';
import { templateService, type Template } from '../services/templateService';
import type { TextField, DecorativeElement, ColorPalette, Position } from '../types/template';
import toast from 'react-hot-toast';

const EditorV2TestPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editor state
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [textPositions, setTextPositions] = useState<Record<string, Position>>({});
  const [decorativeElements, setDecorativeElements] = useState<DecorativeElement[]>([]);
  const [colorPalette, setColorPalette] = useState<ColorPalette>({
    primary: '#2C3E50',
    secondary: '#ECF0F1',
    accent: '#C0A062',
    background: '#FFFFFF',
    text: '#2C3E50'
  });
  
  // Selection state
  const [selectedTextFieldId, setSelectedTextFieldId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingTextFieldId, setEditingTextFieldId] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const tmpl = await templateService.getTemplates();
      setTemplates(tmpl);
      
      // Auto-select first template
      if (tmpl.length > 0) {
        selectTemplate(tmpl[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Template\'ler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setColorPalette(template.color_palette);
    setDecorativeElements([...template.decorative_elements]);
    
    // Initialize text values with defaults
    const initialValues: Record<string, string> = {};
    const initialPositions: Record<string, Position> = {};
    
    template.text_fields.forEach(field => {
      initialValues[field.id] = field.defaultValue || '';
      initialPositions[field.id] = field.position;
    });
    
    setTextValues(initialValues);
    setTextPositions(initialPositions);
    setSelectedTextFieldId(null);
    setSelectedElementId(null);
    setEditingTextFieldId(null);
    
    toast.success(`${template.name} yüklendi`);
  };

  const handleAddElement = (element: Omit<DecorativeElement, 'id'>) => {
    const newElement: DecorativeElement = {
      ...element,
      id: `element-${Date.now()}`
    };
    setDecorativeElements([...decorativeElements, newElement]);
  };

  const handleUpdateElement = (id: string, updates: Partial<DecorativeElement>) => {
    setDecorativeElements(decorativeElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const handleDeleteElement = (id: string) => {
    setDecorativeElements(decorativeElements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleSave = () => {
    const data = {
      template_id: selectedTemplate?.id,
      text_values: textValues,
      text_positions: textPositions,
      decorative_elements: decorativeElements,
      color_palette: colorPalette
    };
    
    console.log('💾 Saving invitation data:', data);
    toast.success('Kaydedildi! (Console\'u kontrol edin)');
  };

  const selectedTextField = selectedTemplate?.text_fields.find(f => f.id === selectedTextFieldId);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/templates')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Editor V2 Test
                </h1>
                <p className="text-xs text-gray-500">
                  {selectedTemplate?.name || 'Template seçin'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Kaydet
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Template Selector */}
        {templates.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Seç
            </label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                if (template) selectTemplate(template);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.tier.toUpperCase()}) - {template.category}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedTemplate ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Tools */}
            <div className="col-span-3 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <ColorPaletteEditor
                  palette={colorPalette}
                  onChange={setColorPalette}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <DecorativeElementsPanel
                  elements={decorativeElements}
                  selectedElementId={selectedElementId}
                  onElementAdd={handleAddElement}
                  onElementUpdate={handleUpdateElement}
                  onElementDelete={handleDeleteElement}
                  onElementSelect={setSelectedElementId}
                />
              </div>
            </div>

            {/* Center - Canvas */}
            <div className="col-span-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <TemplateCanvas
                  backgroundImage={selectedTemplate.default_image_url || undefined}
                  colorPalette={colorPalette}
                  textFields={selectedTemplate.text_fields}
                  textValues={textValues}
                  textPositions={textPositions}
                  decorativeElements={decorativeElements}
                  selectedTextFieldId={selectedTextFieldId}
                  selectedElementId={selectedElementId}
                  editingTextFieldId={editingTextFieldId}
                  onTextValueChange={(id, val) => setTextValues({ ...textValues, [id]: val })}
                  onTextPositionChange={(id, pos) => setTextPositions({ ...textPositions, [id]: pos })}
                  onTextFieldSelect={setSelectedTextFieldId}
                  onElementSelect={setSelectedElementId}
                  onStartEditTextField={setEditingTextFieldId}
                  onEndEditTextField={() => setEditingTextFieldId(null)}
                  aspectRatio={16 / 9}
                />
              </div>
            </div>

            {/* Right Sidebar - Text Editor */}
            <div className="col-span-3 space-y-6">
              {selectedTextField ? (
                <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Yazı Ayarları</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedTextField.label}
                    </label>
                    <input
                      type="text"
                      value={textValues[selectedTextField.id] || ''}
                      onChange={(e) => setTextValues({ ...textValues, [selectedTextField.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={selectedTextField.placeholder || selectedTextField.defaultValue}
                      maxLength={selectedTextField.constraints?.maxLength}
                    />
                    {selectedTextField.constraints?.maxLength && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(textValues[selectedTextField.id] || '').length}/{selectedTextField.constraints.maxLength}
                      </p>
                    )}
                  </div>

                  <FontPicker
                    selectedFont={selectedTextField.style.fontFamily || 'Inter'}
                    availableFonts={selectedTemplate.available_fonts}
                    onFontChange={(font) => {
                      // Font değişikliğini kaydet
                      console.log('Font changed to:', font);
                    }}
                    label="Font"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Boyutu: {selectedTextField.style.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={selectedTextField.style.fontSize}
                      onChange={(e) => {
                        // Font size değişikliğini kaydet
                        console.log('Font size changed to:', e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Renk
                    </label>
                    <input
                      type="color"
                      value={selectedTextField.style.color}
                      onChange={(e) => {
                        // Renk değişikliğini kaydet
                        console.log('Color changed to:', e.target.value);
                      }}
                      className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500">
                  <p className="text-sm">Bir yazı alanı seçin</p>
                </div>
              )}

              {/* Debug Info */}
              <div className="bg-gray-100 rounded-lg p-4 text-xs font-mono">
                <p className="font-bold mb-2">Debug Info:</p>
                <p>Selected Text: {selectedTextFieldId || 'none'}</p>
                <p>Selected Element: {selectedElementId || 'none'}</p>
                <p>Editing: {editingTextFieldId || 'none'}</p>
                <p>Elements: {decorativeElements.length}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">Template yüklenemedi veya bulunamadı</p>
            <button
              onClick={loadTemplates}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Yeniden Yükle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorV2TestPage;

