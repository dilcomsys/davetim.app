import toast from 'react-hot-toast';
import { supabase } from './supabase';
import { subscriptionService } from './subscriptionService';
import QRCode from 'qrcode';

export interface Media {
  id: string;
  user_id: string;
  invitation_id?: string;
  type: 'video' | 'image';
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_url: string;
  thumbnail_url?: string;
  qr_code: string;
  qr_image_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  // Host message for guests
  owner_message_url?: string;
  owner_message_type?: 'audio' | 'video' | 'image';
  owner_message_title?: string;
  expires_at?: string;
  storage_plan?: '3_months' | '1_year';
  view_count: number;
  scan_count: number;
  last_viewed_at?: string;
  // Guest uploads controls
  allow_guest_upload?: boolean;
  guest_uploads_limit?: number;
  guest_uploads_count?: number;
  status: 'active' | 'expired' | 'deleted' | 'processing';
  created_at: string;
  updated_at: string;
}

export interface CreateMediaData {
  file: File;
  invitation_id?: string;
  title?: string;
  description?: string;
  storage_plan?: '3_months' | '1_year'; // optional; auto-detected if missing
}

export interface GuestUploadInput {
  qrCode: string;
  file: File;
  guestName?: string;
  note?: string;
}

export interface GuestUploadRecord {
  id: string;
  media_id: string;
  qr_code: string;
  guest_name?: string;
  note?: string;
  type: 'video' | 'image';
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_url: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface MediaStats {
  totalCount: number;
  totalStorageBytes: number;
  totalStorageMB: number;
  videoCount: number;
  imageCount: number;
  totalViews: number;
  totalScans: number;
}

class MediaService {
  private readonly BUCKET_NAME = 'qr-media';
  private readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validate media file
   */
  validateMediaFile(file: File): { valid: boolean; error?: string } {
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedTypes = [...allowedVideoTypes, ...allowedImageTypes];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Desteklenmeyen dosya formatı. MP4, MOV, JPG, PNG, WEBP veya GIF kullanın.',
      };
    }

    const isVideo = allowedVideoTypes.includes(file.type);
    const maxSize = isVideo ? this.MAX_VIDEO_SIZE : this.MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `Dosya çok büyük. Maksimum ${maxSizeMB}MB olmalıdır.`,
      };
    }

    return { valid: true };
  }

  /**
   * Generate unique QR code
   */
  private generateQRCode(): string {
    return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate QR code image
   */
  private async generateQRImage(qrCode: string): Promise<string> {
    try {
      const publicUrl = `${window.location.origin}/media/${qrCode}`;
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrDataUrl;
    } catch (error) {
      console.error('QR image generation error:', error);
      throw new Error('QR kod resmi oluşturulamadı');
    }
  }

  /**
   * Calculate expiration date based on storage plan
   */
  private calculateExpirationDate(storagePlan: '3_months' | '1_year'): Date {
    const now = new Date();
    if (storagePlan === '3_months') {
      now.setMonth(now.getMonth() + 3);
    } else {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now;
  }

  private async detectStoragePlanForUser(userId: string): Promise<'3_months' | '1_year'> {
    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      if (!subscription || subscription.tier !== 'premium') {
        // Default conservative if not premium (should be blocked earlier by feature checks)
        return '3_months';
      }

      if (subscription.startDate && subscription.endDate) {
        const start = new Date(subscription.startDate).getTime();
        const end = new Date(subscription.endDate).getTime();
        const diffDays = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        // Heuristic: >= 270 days => yearly; else monthly
        return diffDays >= 270 ? '1_year' : '3_months';
      }

      // Fallback: try payment history last billing period
      const history = await subscriptionService.getPaymentHistory(userId);
      const last = history[0];
      if (last && last.billingPeriod === 'yearly') return '1_year';
      return '3_months';
    } catch (e) {
      return '3_months';
    }
  }

  /**
   * Upload media file to Supabase Storage
   */
  private async uploadToStorage(file: File, qrCode: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${qrCode}.${fileExt}`;

      console.log('📤 Uploading media to storage:', fileName);

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Keep path; generate public URL only if bucket public; otherwise signed later
      console.log('✅ Media uploaded path:', fileName);
      return fileName;
    } catch (error: any) {
      console.error('Upload to storage error:', error);
      throw new Error(error.message || 'Dosya yüklenemedi');
    }
  }

  private async uploadGuestToStorage(file: File, qrCode: string): Promise<{ url: string; path: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `guest/${qrCode}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Storage upload (guest) error:', error);
        throw error;
      }

      return { url: `${window.location.origin}/storage/v1/object/public/${this.BUCKET_NAME}/${fileName}`, path: fileName };
    } catch (error: any) {
      console.error('Upload guest to storage error:', error);
      throw new Error(error.message || 'Dosya yüklenemedi');
    }
  }

  /**
   * Create or update QR media for invitation (main media record)
   */
  async createMedia(data: CreateMediaData): Promise<Media> {
    try {
      console.log('🎥 Creating/updating QR media...');

      // Invitation ID is required
      if (!data.invitation_id) {
        toast.error('QR medya sadece davetiye üzerinden oluşturulabilir');
        throw new Error('Invitation ID is required for QR media');
      }

      // Validate file
      const validation = this.validateMediaFile(data.file);
      if (!validation.valid) {
        toast.error(validation.error!);
        throw new Error(validation.error);
      }

      // Check user auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Oturum açmanız gerekiyor');
        throw new Error('User not authenticated');
      }

      // Decide storage plan automatically if not provided
      const resolvedStoragePlan: '3_months' | '1_year' = data.storage_plan || (await this.detectStoragePlanForUser(user.id));

      // Check if QR already exists for this invitation
      const existing = await this.getMediaByInvitationId(data.invitation_id);
      let qrCode: string;
      let qrImageUrl: string | undefined;

      if (existing) {
        // Reuse existing QR code
        qrCode = existing.qr_code;
        qrImageUrl = existing.qr_image_url;
      } else {
        // Generate new QR code
        qrCode = this.generateQRCode();
        qrImageUrl = await this.generateQRImage(qrCode);
      }

      // Upload file
      const storagePath = await this.uploadToStorage(data.file, qrCode);

      // Determine media type
      const mediaType = data.file.type.startsWith('video/') ? 'video' : 'image';

      // Calculate expiration
      const expiresAt = this.calculateExpirationDate(resolvedStoragePlan);

      // Create or update database record (UPSERT based on invitation_id)
      const mediaRecord = {
        user_id: user.id,
        invitation_id: data.invitation_id,
        type: mediaType,
        file_name: data.file.name,
        file_size: data.file.size,
        mime_type: data.file.type,
        storage_url: `${window.location.origin}/storage/v1/object/public/${this.BUCKET_NAME}/${storagePath}`,
        storage_path: storagePath,
        qr_code: qrCode,
        qr_image_url: qrImageUrl,
        title: data.title || data.file.name,
        description: data.description || null,
        expires_at: expiresAt.toISOString(),
        storage_plan: resolvedStoragePlan,
        status: 'active',
      };

      const { data: upserted, error } = await supabase
        .from('media')
        .upsert(mediaRecord, { 
          onConflict: 'invitation_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) {
        console.error('Database upsert error:', error);
        throw error;
      }

      console.log('✅ QR media created/updated:', upserted.id);
      toast.success(existing ? 'Ana medya güncellendi!' : 'QR medya oluşturuldu!');

      return upserted;
    } catch (error: any) {
      console.error('Create media error:', error);
      const errorMessage = error.message || 'Medya oluşturulamadı';
      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Upload additional media to existing QR (as guest upload by owner)
   */
  async uploadAdditionalMedia(invitationId: string, file: File, title?: string, note?: string): Promise<GuestUploadRecord> {
    try {
      console.log('📤 Uploading additional media...');

      // Get QR media for this invitation
      const media = await this.getMediaByInvitationId(invitationId);
      if (!media) {
        toast.error('Bu davetiye için QR medya bulunamadı');
        throw new Error('QR media not found');
      }

      // Validate file
      const validation = this.validateMediaFile(file);
      if (!validation.valid) {
        toast.error(validation.error!);
        throw new Error(validation.error);
      }

      // Check user auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Oturum açmanız gerekiyor');
        throw new Error('User not authenticated');
      }

      // Upload file to guest folder
      const { path: storagePath } = await this.uploadGuestToStorage(file, media.qr_code);

      // Determine media type
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      // Create guest upload record (owner upload)
      const uploadRecord = {
        media_id: media.id,
        qr_code: media.qr_code, // Required field
        guest_name: 'Davet Sahibi',
        note: note || title || null,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_url: `${window.location.origin}/storage/v1/object/public/${this.BUCKET_NAME}/${storagePath}`,
        storage_path: storagePath,
        type: mediaType,
      };

      const { data: inserted, error } = await supabase
        .from('guest_uploads')
        .insert(uploadRecord)
        .select()
        .single();

      if (error) {
        console.error('Additional media upload error:', error);
        throw error;
      }

      // Increment guest uploads count
      await supabase
        .from('media')
        .update({ guest_uploads_count: media.guest_uploads_count + 1 })
        .eq('id', media.id);

      console.log('✅ Additional media uploaded:', inserted.id);
      toast.success('Ek medya yüklendi!');

      return inserted;
    } catch (error: any) {
      console.error('Upload additional media error:', error);
      toast.error(error.message || 'Ek medya yüklenemedi');
      throw error;
    }
  }

  /**
   * Delete guest upload
   */
  async deleteGuestUpload(uploadId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('guest_uploads')
        .delete()
        .eq('id', uploadId);
      
      if (error) {
        console.error('Delete guest upload error:', error);
        throw error;
      }
      
      return true;
    } catch (error: any) {
      console.error('Delete guest upload error:', error);
      toast.error('Medya silinemedi');
      throw error;
    }
  }

  /**
   * Generate signed URL for private storage
   */
  async generateSignedUrl(storagePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(storagePath, 3600); // 1 hour expiry
      
      if (error) {
        console.error('Signed URL generation error:', error);
        throw error;
      }
      
      return data.signedUrl;
    } catch (error: any) {
      console.error('Signed URL generation error:', error);
      throw error;
    }
  }

  /**
   * Get user's media list
   */
  async getUserMedia(): Promise<Media[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'processing'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get user media error:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Get user media error:', error);
      throw error;
    }
  }

  /**
   * Get media by ID
   */
  async getMediaById(mediaId: string): Promise<Media | null> {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (error) {
        console.error('Get media by ID error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get media by ID error:', error);
      return null;
    }
  }

  async getMediaByInvitationId(invitationId: string): Promise<Media | null> {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('invitation_id', invitationId)
        .maybeSingle();
      if (error) {
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get media by QR code (public access)
   */
  async getMediaByQRCode(qrCode: string): Promise<Media | null> {
    try {
      console.log('🔍 Getting media by QR code:', qrCode);

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('qr_code', qrCode)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Get media by QR code error:', error);
        return null;
      }

      // Increment scan count
      await this.incrementScanCount(qrCode);

      return data;
    } catch (error) {
      console.error('Get media by QR code error:', error);
      return null;
    }
  }

  async getGuestUploads(qrCode: string): Promise<GuestUploadRecord[]> {
    try {
      const { data, error } = await supabase
        .from('guest_uploads')
        .select('*')
        .eq('qr_code', qrCode)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get guest uploads error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get guest uploads error:', error);
      return [];
    }
  }

  async uploadGuestMedia(input: GuestUploadInput): Promise<GuestUploadRecord> {
    try {
      // Validate
      const validation = this.validateMediaFile(input.file);
      if (!validation.valid) {
        toast.error(validation.error!);
        throw new Error(validation.error);
      }

      // Check media by qr and permissions
      const media = await this.getMediaByQRCode(input.qrCode);
      if (!media) throw new Error('Geçersiz QR kod');
      if (!media.allow_guest_upload) throw new Error('Bu QR için misafir yüklemeleri kapalı');
      if (
        typeof media.guest_uploads_limit === 'number' &&
        typeof media.guest_uploads_count === 'number' &&
        media.guest_uploads_count >= media.guest_uploads_limit
      ) {
        throw new Error('Maksimum misafir yükleme limitine ulaşıldı');
      }

      // Upload to storage (public; bucket RLS handles public access)
      const { url, path } = await this.uploadGuestToStorage(input.file, input.qrCode);

      const type: 'video' | 'image' = input.file.type.startsWith('video/') ? 'video' : 'image';

      console.log('📤 Guest upload - URL:', url, 'Path:', path);

      // Insert record
      const { data: inserted, error } = await supabase
        .from('guest_uploads')
        .insert({
          media_id: media.id,
          qr_code: input.qrCode,
          guest_name: input.guestName || null,
          note: input.note || null,
          type,
          file_name: input.file.name,
          file_size: input.file.size,
          mime_type: input.file.type,
          storage_url: url,
          storage_path: path, // ✅ storage_path eklendi!
        })
        .select()
        .single();

      if (error) {
        console.error('Insert guest upload error:', error);
        throw error;
      }

      // Increment counter
      await supabase.rpc('inc_guest_uploads_count', { p_media_id: media.id });

      toast.success('Yükleme alındı, teşekkürler!');
      return inserted as GuestUploadRecord;
    } catch (error: any) {
      console.error('Upload guest media error:', error);
      toast.error(error.message || 'Yükleme başarısız');
      throw error;
    }
  }

  /**
   * Increment scan count
   */
  private async incrementScanCount(qrCode: string): Promise<void> {
    try {
      await supabase.rpc('increment_media_scan_count', {
        qr_code_value: qrCode,
      });
    } catch (error) {
      console.error('Increment scan count error:', error);
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(mediaId: string): Promise<void> {
    try {
      await supabase.rpc('increment_media_view_count', {
        media_id: mediaId,
      });
    } catch (error) {
      console.error('Increment view count error:', error);
    }
  }

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get media to delete file from storage
      const media = await this.getMediaById(mediaId);
      if (!media) {
        toast.error('Medya bulunamadı');
        return false;
      }

      // Delete from storage
      const fileName = media.storage_url.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete media error:', error);
        toast.error('Medya silinemedi');
        return false;
      }

      toast.success('Medya silindi');
      return true;
    } catch (error) {
      console.error('Delete media error:', error);
      toast.error('Medya silinirken hata oluştu');
      return false;
    }
  }

  /**
   * Get user's media statistics
   */
  async getUserMediaStats(): Promise<MediaStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const mediaList = await this.getUserMedia();

      const stats: MediaStats = {
        totalCount: mediaList.length,
        totalStorageBytes: mediaList.reduce((sum, m) => sum + m.file_size, 0),
        totalStorageMB: 0,
        videoCount: mediaList.filter(m => m.type === 'video').length,
        imageCount: mediaList.filter(m => m.type === 'image').length,
        totalViews: mediaList.reduce((sum, m) => sum + m.view_count, 0),
        totalScans: mediaList.reduce((sum, m) => sum + m.scan_count, 0),
      };

      stats.totalStorageMB = Math.round(stats.totalStorageBytes / (1024 * 1024) * 100) / 100;

      return stats;
    } catch (error) {
      console.error('Get user media stats error:', error);
      return {
        totalCount: 0,
        totalStorageBytes: 0,
        totalStorageMB: 0,
        videoCount: 0,
        imageCount: 0,
        totalViews: 0,
        totalScans: 0,
      };
    }
  }

  /**
   * Update media details
   */
  async updateMedia(mediaId: string, updates: Partial<Pick<Media, 'title' | 'description' | 'invitation_id' | 'allow_guest_upload'>>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('media')
        .update(updates)
        .eq('id', mediaId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Update media error:', error);
        toast.error('Medya güncellenemedi');
        return false;
      }

      toast.success('Medya güncellendi');
      return true;
    } catch (error) {
      console.error('Update media error:', error);
      toast.error('Güncelleme sırasında hata oluştu');
      return false;
    }
  }
}

export const mediaService = new MediaService();

