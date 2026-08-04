import { supabase } from './supabase';
import toast from 'react-hot-toast';
import { retry, getUserFriendlyErrorMessage } from '../utils/retry';
import type {
  ColorPalette,
  TextField,
  DecorativeElement
} from '../types/template';

// Legacy Types (for backward compatibility)
export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// V2 Template Type (matches new database schema)
export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string; // V2: text field instead of foreign key
  subcategory: string | null;
  tier: 'free' | 'pro' | 'premium';
  thumbnail_url: string | null;
  default_image_url: string | null;
  color_palette: ColorPalette;
  text_fields: TextField[];
  decorative_elements: DecorativeElement[];
  available_fonts: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserTemplate {
  id: string;
  user_id: string;
  template_id: string;
  custom_name: string | null;
  custom_design_config: any;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;

  // Joined data
  template?: Template;
}

// V2 Template Filters
export interface TemplateFilters {
  category?: string; // V2: direct category name
  subcategory?: string;
  tier?: 'free' | 'pro' | 'premium';
  isFeatured?: boolean;
  search?: string;
}

class TemplateService {
  // =====================================================
  // Template Categories
  // =====================================================

  async getCategories(): Promise<TemplateCategory[]> {
    try {
      return await retry(async () => {
        const { data, error } = await supabase
          .from('template_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('❌ Error fetching categories:', error);
          throw error;
        }

        return data || [];
      }, {
        maxRetries: 3,
        onRetry: (attempt) => {
          console.log(`🔄 Retrying getCategories (attempt ${attempt}/3)...`);
        }
      });
    } catch (error: any) {
      console.error('Get categories error:', error);
      const errorMessage = getUserFriendlyErrorMessage(error);
      toast.error(errorMessage);
      return [];
    }
  }

  async getCategoryBySlug(slug: string): Promise<TemplateCategory | null> {
    try {
      const { data, error } = await supabase
        .from('template_categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('❌ Error fetching category:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Get category by slug error:', error);
      return null;
    }
  }

  // =====================================================
  // Templates
  // =====================================================

  async getTemplates(filters?: TemplateFilters): Promise<Template[]> {
    try {
      return await retry(async () => {
        let query = supabase
          .from('templates')
          .select('*')
          .eq('is_active', true);

        // Apply V2 filters
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }

        if (filters?.subcategory) {
          query = query.eq('subcategory', filters.subcategory);
        }

        if (filters?.tier) {
          query = query.eq('tier', filters.tier);
        }

        if (filters?.isFeatured !== undefined) {
          query = query.eq('is_featured', filters.isFeatured);
        }

        if (filters?.search) {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        // Order by sort_order, then featured
        query = query.order('sort_order', { ascending: true })
          .order('is_featured', { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error('❌ Error fetching templates:', error);
          throw error;
        }

        return data || [];
      }, {
        maxRetries: 3,
        onRetry: (attempt) => {
          console.log(`🔄 Retrying getTemplates (attempt ${attempt}/3)...`);
        }
      });
    } catch (error: any) {
      console.error('Get templates error:', error);
      const errorMessage = getUserFriendlyErrorMessage(error);
      toast.error(errorMessage);
      return [];
    }
  }

  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('❌ Error fetching template:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Get template by ID error:', error);
      return null;
    }
  }

  async getFeaturedTemplates(limit: number = 6): Promise<Template[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching featured templates:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Get featured templates error:', error);
      return [];
    }
  }

  async getTemplatesByCategory(category: string, limit?: number): Promise<Template[]> {
    try {
      let query = supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('sort_order', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching templates by category:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Get templates by category error:', error);
      return [];
    }
  }

  // =====================================================
  // User Templates (Saved/Favorited)
  // =====================================================

  async getUserTemplates(): Promise<UserTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('user_templates')
        .select(`
          *,
          template:templates(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Tablo yoksa sessizce boş array dön
        if (error.code === 'PGRST200' || error.code === '42P01') {
          console.warn('⚠️ user_templates table not found. Please run database/06-user-templates-table.sql');
          return [];
        }
        console.error('❌ Error fetching user templates:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      // Tablo yoksa sessizce boş array dön
      if (error.code === 'PGRST200' || error.code === '42P01') {
        return [];
      }
      console.error('Get user templates error:', error);
      toast.error('Kaydedilen şablonlar yüklenirken hata oluştu');
      return [];
    }
  }

  async saveTemplate(templateId: string): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Oturum açmanız gerekiyor');
        return false;
      }

      const { error } = await supabase
        .from('user_templates')
        .insert({
          user_id: user.id,
          template_id: templateId,
          is_favorite: true
        });

      if (error) {
        if (error.code === '23505') {
          // Already saved
          toast('Bu şablon zaten kaydedilmiş');
          return false;
        }
        console.error('❌ Error saving template:', error);
        throw error;
      }

      toast.success('Şablon kaydedildi');
      return true;
    } catch (error: any) {
      console.error('Save template error:', error);
      toast.error('Şablon kaydedilirken hata oluştu');
      return false;
    }
  }

  async unsaveTemplate(templateId: string): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Oturum açmanız gerekiyor');
        return false;
      }

      const { error } = await supabase
        .from('user_templates')
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error unsaving template:', error);
        throw error;
      }

      toast.success('Şablon kaldırıldı');
      return true;
    } catch (error: any) {
      console.error('Unsave template error:', error);
      toast.error('Şablon kaldırılırken hata oluştu');
      return false;
    }
  }

  async toggleFavorite(templateId: string, isFavorite: boolean): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('user_templates')
        .update({ is_favorite: isFavorite })
        .eq('template_id', templateId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error toggling favorite:', error);
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Toggle favorite error:', error);
      return false;
    }
  }
}

export const templateService = new TemplateService();
