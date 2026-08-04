// Color presets for different invitation themes

export interface ColorPreset {
  id: string;
  name: string;
  category: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
}

export const colorPresets: ColorPreset[] = [
  // Düğün Temaları
  {
    id: 'wedding-classic',
    name: 'Klasik Düğün',
    category: 'wedding',
    colors: {
      primary: '#8B4513',
      secondary: '#D4AF37',
      background: '#FFFFFF',
      text: '#333333',
      accent: '#FFD700'
    }
  },
  {
    id: 'wedding-romantic',
    name: 'Romantik Düğün',
    category: 'wedding',
    colors: {
      primary: '#FF69B4',
      secondary: '#FFB6C1',
      background: '#FFF5F7',
      text: '#4A4A4A',
      accent: '#FF1493'
    }
  },
  {
    id: 'wedding-elegant',
    name: 'Zarif Düğün',
    category: 'wedding',
    colors: {
      primary: '#2C3E50',
      secondary: '#95A5A6',
      background: '#ECF0F1',
      text: '#2C3E50',
      accent: '#3498DB'
    }
  },
  {
    id: 'wedding-royal',
    name: 'Kraliyet Düğünü',
    category: 'wedding',
    colors: {
      primary: '#4B0082',
      secondary: '#9370DB',
      background: '#F8F8FF',
      text: '#2F2F2F',
      accent: '#FFD700'
    }
  },
  
  // Nişan Temaları
  {
    id: 'engagement-spring',
    name: 'Bahar Nişanı',
    category: 'engagement',
    colors: {
      primary: '#98D8C8',
      secondary: '#F7DC6F',
      background: '#FDFEFE',
      text: '#34495E',
      accent: '#85C1E9'
    }
  },
  {
    id: 'engagement-sunset',
    name: 'Gün Batımı',
    category: 'engagement',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FFA07A',
      background: '#FFF8F0',
      text: '#4A4A4A',
      accent: '#FFD93D'
    }
  },
  
  // Doğum Günü Temaları
  {
    id: 'birthday-party',
    name: 'Parti Zamanı',
    category: 'birthday',
    colors: {
      primary: '#FF6B9D',
      secondary: '#C44569',
      background: '#FFF0F5',
      text: '#2C3A47',
      accent: '#FFC312'
    }
  },
  {
    id: 'birthday-fun',
    name: 'Eğlenceli Doğum Günü',
    category: 'birthday',
    colors: {
      primary: '#00D2FF',
      secondary: '#3A7BD5',
      background: '#F0F8FF',
      text: '#333333',
      accent: '#FFD700'
    }
  },
  {
    id: 'birthday-kids',
    name: 'Çocuk Doğum Günü',
    category: 'birthday',
    colors: {
      primary: '#FFA500',
      secondary: '#FF6347',
      background: '#FFFACD',
      text: '#333333',
      accent: '#32CD32'
    }
  },
  
  // Baby Shower Temaları
  {
    id: 'babyshower-boy',
    name: 'Erkek Bebek',
    category: 'babyshower',
    colors: {
      primary: '#4A90E2',
      secondary: '#89CFF0',
      background: '#F0F8FF',
      text: '#2C3E50',
      accent: '#87CEEB'
    }
  },
  {
    id: 'babyshower-girl',
    name: 'Kız Bebek',
    category: 'babyshower',
    colors: {
      primary: '#FFB6C1',
      secondary: '#FFC0CB',
      background: '#FFF0F5',
      text: '#4A4A4A',
      accent: '#FF69B4'
    }
  },
  {
    id: 'babyshower-neutral',
    name: 'Nötr Baby Shower',
    category: 'babyshower',
    colors: {
      primary: '#F0E68C',
      secondary: '#FAFAD2',
      background: '#FFFEF0',
      text: '#5D4E37',
      accent: '#FFD700'
    }
  },
  
  // Modern/Minimalist Temalar
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'modern',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      background: '#F5F5F5',
      text: '#1A1A1A',
      accent: '#FF6B6B'
    }
  },
  {
    id: 'modern-gradient',
    name: 'Modern Degrade',
    category: 'modern',
    colors: {
      primary: '#667EEA',
      secondary: '#764BA2',
      background: '#FFFFFF',
      text: '#2D3748',
      accent: '#F56565'
    }
  },
  {
    id: 'modern-ocean',
    name: 'Okyanus',
    category: 'modern',
    colors: {
      primary: '#0077BE',
      secondary: '#00A8E8',
      background: '#E8F4F8',
      text: '#1A365D',
      accent: '#48BB78'
    }
  }
];

// Helper functions
export const getPresetsByCategory = (category: string): ColorPreset[] => {
  return colorPresets.filter(preset => preset.category === category);
};

export const getPresetById = (id: string): ColorPreset | undefined => {
  return colorPresets.find(preset => preset.id === id);
};

export const categories = [
  { id: 'wedding', name: 'Düğün', emoji: '💍' },
  { id: 'engagement', name: 'Nişan', emoji: '💑' },
  { id: 'birthday', name: 'Doğum Günü', emoji: '🎂' },
  { id: 'babyshower', name: 'Baby Shower', emoji: '👶' },
  { id: 'modern', name: 'Modern', emoji: '✨' }
];

