import toast from 'react-hot-toast';
import { supabase } from './supabase';

class UploadService {
  private bucketName = 'invitation-images';
  
  /**
   * Upload an image to Supabase Storage
   * @param file - The file to upload
   * @param userId - The user ID (for folder organization)
   * @param invitationId - The invitation ID (for naming)
   * @returns The public URL of the uploaded image
   */
  async uploadImage(file: File, userId: string, invitationId: string): Promise<string> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Sadece JPG, PNG, WebP ve GIF formatları desteklenmektedir.');
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır.');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${userId}/${invitationId}_${timestamp}.${fileExt}`;

      console.log('📤 Uploading image:', fileName);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Upload error:', error);
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('✅ Upload successful:', urlData.publicUrl);
      toast.success('Görsel başarıyla yüklendi!');

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('❌ Upload service error:', error);
      const errorMessage = error.message || 'Görsel yüklenirken bir hata oluştu';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete an image from Supabase Storage
   * @param imageUrl - The full URL of the image to delete
   * @param userId - The user ID (for verification)
   */
  async deleteImage(imageUrl: string, userId: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split(`${this.bucketName}/`);
      if (urlParts.length < 2) {
        throw new Error('Geçersiz görsel URL');
      }
      
      const filePath = urlParts[1];

      // Verify user owns this file
      if (!filePath.startsWith(userId)) {
        throw new Error('Bu görseli silme yetkiniz yok');
      }

      console.log('🗑️ Deleting image:', filePath);

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('❌ Delete error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Image deleted successfully');
      toast.success('Görsel silindi');
      return true;
    } catch (error: any) {
      console.error('❌ Delete service error:', error);
      const errorMessage = error.message || 'Görsel silinirken bir hata oluştu';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Update invitation with image URL
   * @param invitationId - The invitation ID
   * @param imageUrl - The image URL
   */
  async updateInvitationImage(invitationId: string, imageUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ image_url: imageUrl })
        .eq('id', invitationId);

      if (error) {
        console.error('❌ Update invitation image error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Invitation image URL updated');
    } catch (error: any) {
      console.error('❌ Update invitation image error:', error);
      throw error;
    }
  }

  /**
   * Remove image from invitation
   * @param invitationId - The invitation ID
   */
  async removeInvitationImage(invitationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ image_url: null })
        .eq('id', invitationId);

      if (error) {
        console.error('❌ Remove invitation image error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Invitation image URL removed');
    } catch (error: any) {
      console.error('❌ Remove invitation image error:', error);
      throw error;
    }
  }

  /**
   * Get image URL from invitation
   * @param invitationId - The invitation ID
   */
  async getInvitationImage(invitationId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('image_url')
        .eq('id', invitationId)
        .single();

      if (error) {
        console.error('❌ Get invitation image error:', error);
        return null;
      }

      return data?.image_url || null;
    } catch (error: any) {
      console.error('❌ Get invitation image error:', error);
      return null;
    }
  }
}

export const uploadService = new UploadService();

