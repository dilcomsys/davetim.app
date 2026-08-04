/**
 * Template V2 Type Definitions
 * Enhanced template system with dynamic text fields and decorative elements
 */

export type TemplateCategory = 
  | 'birthday'
  | 'wedding'
  | 'engagement'
  | 'baby_shower'
  | 'graduation'
  | 'anniversary'
  | 'party'
  | 'corporate'
  | 'other';

export type TemplateSubcategory =
  | 'classic'
  | 'modern'
  | 'vintage'
  | 'retro'
  | 'elegant'
  | 'minimal'
  | 'luxury'
  | 'boho'
  | 'romantic'
  | 'fun'
  | 'professional';

export type FontFamily =
  | 'Playfair Display'
  | 'Montserrat'
  | 'Dancing Script'
  | 'Cinzel'
  | 'Poppins';

export type DecorativeElementType =
  | 'balloon'
  | 'confetti'
  | 'flower'
  | 'heart'
  | 'star'
  | 'ribbon'
  | 'candle'
  | 'party_hat'
  | 'gift'
  | 'cake';

export interface Position {
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
}

export interface Size {
  width: number; // Pixels or percentage
  height: number; // Pixels or percentage
}

export interface TextStyle {
  fontSize: number;
  fontFamily: FontFamily;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  lineHeight?: number;
}

export interface TextField {
  id: string;
  label: string;
  defaultValue: string;
  position: Position;
  style: TextStyle;
  maxLength?: number;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
}

export interface DecorativeElement {
  id: string;
  type: DecorativeElementType;
  position: Position;
  size: Size;
  color?: string;
  rotation?: number; // Degrees
  opacity?: number; // 0-1
  zIndex?: number;
  svgPath?: string; // Custom SVG path
  imageUrl?: string; // Or image URL
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  [key: string]: string; // Allow additional colors
}

export interface TemplateV2 {
  id: number;
  name: string;
  description: string;
  category: TemplateCategory;
  subcategory?: TemplateSubcategory;
  tier: 'free' | 'pro' | 'premium';
  thumbnail_url: string;
  preview_url: string;
  default_image_url?: string;
  color_palette: ColorPalette;
  text_fields: TextField[];
  decorative_elements: DecorativeElement[];
  available_fonts: FontFamily[];
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * User's customized invitation based on a template
 */
export interface InvitationCustomization {
  template_id: number;
  text_values: Record<string, string>; // field_id -> value
  text_styles: Record<string, Partial<TextStyle>>; // field_id -> style overrides
  text_positions: Record<string, Position>; // field_id -> position overrides
  decorative_elements: DecorativeElement[]; // User can add/remove/modify
  color_overrides: Partial<ColorPalette>;
  custom_image_url?: string;
}

/**
 * Template filter options
 */
export interface TemplateFilters {
  category?: TemplateCategory;
  tier?: 'free' | 'pro' | 'premium';
  subcategory?: TemplateSubcategory;
  featured?: boolean;
  search?: string;
}

/**
 * Predefined decorative element library
 */
export interface DecorativeElementLibrary {
  [key: string]: {
    type: DecorativeElementType;
    svgPath: string;
    defaultSize: Size;
    defaultColor: string;
    category: string;
  };
}

