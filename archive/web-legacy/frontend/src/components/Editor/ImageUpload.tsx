import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Lock, Info } from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import { useSubscription } from '../../hooks/useSubscription';
import toast from 'react-hot-toast';
import {
  compressImage,
  validateImageFile,
  formatFileSize,
  getImageDimensions,
  calculateAspectRatio
} from '../../utils/imageOptimization';

interface ImageUploadProps {
  invitationId: string;
  userId: string;
  currentImageUrl?: string | null;
  currentPosition?: 'profile' | 'background' | 'banner' | 'watermark';
  currentLogoShape?: 'circle' | 'square';
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  onPositionChange?: (position: 'profile' | 'background' | 'banner' | 'watermark') => void;
  onLogoShapeChange?: (shape: 'circle' | 'square') => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  invitationId,
  userId,
  currentImageUrl,
  currentPosition = 'profile',
  currentLogoShape = 'circle',
  onImageUploaded,
  onImageRemoved,
  onPositionChange,
  onLogoShapeChange
}) => {
  const subscription = useSubscription();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ size: string; dimensions: string; aspectRatio: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Plan kontrolü - görsel yükleme izni var mı?
  const canUpload = subscription.planConfig?.limits.imageUpload || false;

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    // 1️⃣ Validate image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Geçersiz dosya');
      return;
    }
    
    // 2️⃣ Plan kontrolü - Genel upload yetkisi
    const access = await subscription.canUploadImage();
    if (!access.allowed) {
      toast.error(access.reason || 'Görsel yükleme için PRO plana yükseltin!');
      return;
    }
    
    // 3️⃣ Get image information
    try {
      const dimensions = await getImageDimensions(file);
      const aspectRatio = calculateAspectRatio(dimensions.width, dimensions.height);
      setImageInfo({
        size: formatFileSize(file.size),
        dimensions: `${dimensions.width}×${dimensions.height}`,
        aspectRatio
      });
    } catch (error) {
      console.error('Error getting image dimensions:', error);
    }

    // Storage limiti kontrolü
    const fileSizeMB = file.size / (1024 * 1024); // Convert to MB
    const storageCheck = await subscription.canUploadImageWithSize(fileSizeMB);
    if (!storageCheck.allowed) {
      toast.error(storageCheck.reason || 'Yetersiz depolama alanı!');
      return;
    }

    setIsUploading(true);
    setIsCompressing(true);
    
    try {
      let fileToUpload: File | Blob = file;
      
      // 4️⃣ Compress image if it's larger than 1MB or dimensions > 1920px
      const shouldCompress = file.size > 1024 * 1024; // 1MB
      
      if (shouldCompress) {
        toast.loading('Görsel optimize ediliyor...', { id: 'compress' });
        
        try {
          const compressedBlob = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            format: file.type.includes('png') ? 'png' : 'jpeg'
          });
          
          // Create a File from the compressed Blob
          fileToUpload = new File([compressedBlob], file.name, {
            type: compressedBlob.type,
            lastModified: Date.now()
          });
          
          const originalSize = formatFileSize(file.size);
          const compressedSize = formatFileSize(compressedBlob.size);
          const savings = Math.round((1 - compressedBlob.size / file.size) * 100);
          
          toast.success(`Görsel %${savings} küçültüldü (${originalSize} → ${compressedSize})`, { id: 'compress' });
          
          console.log(`📦 Image compression: ${originalSize} → ${compressedSize} (${savings}% smaller)`);
        } catch (error) {
          console.error('Compression failed, using original:', error);
          toast.dismiss('compress');
          // Continue with original file if compression fails
        }
      }
      
      setIsCompressing(false);
      
      // 5️⃣ Upload image
      const imageUrl = await uploadService.uploadImage(fileToUpload, userId, invitationId);
      
      // Update invitation with image URL
      await uploadService.updateInvitationImage(invitationId, imageUrl);
      
      // Notify parent component
      onImageUploaded(imageUrl);
      
      // Refresh subscription to update storage usage
      await subscription.refreshSubscription();
    } catch (error) {
      console.error('Image upload failed:', error);
      setIsCompressing(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      toast.error('Lütfen bir görsel dosyası seçin');
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      setIsUploading(true);
      
      // Check if this is an external image (e.g. from Unsplash, template default)
      const isExternalImage = currentImageUrl.includes('unsplash.com') || 
                              !currentImageUrl.includes('supabase');
      
      if (!isExternalImage) {
        // Only delete from storage if it's our uploaded image
        await uploadService.deleteImage(currentImageUrl, userId);
      }
      
      // Always update invitation to remove image reference
      await uploadService.removeInvitationImage(invitationId);
      
      // Notify parent component
      onImageRemoved();
      
      // Clear image info
      setImageInfo(null);
      
      toast.success('Görsel kaldırıldı');
    } catch (error) {
      console.error('Image removal failed:', error);
      toast.error('Görsel kaldırılırken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Davetiye Görseli
        </label>
        <span className="text-xs text-gray-500">
          JPG, PNG, WebP, GIF (Max 5MB)
        </span>
      </div>

      {currentImageUrl ? (
        // Show current image with remove option
        <div className="relative group">
          <img
            src={currentImageUrl}
            alt="Davetiye görseli"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
            <button
              onClick={handleRemoveImage}
              disabled={isUploading}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Görseli Kaldır
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Show upload area
        <div
          onDragOver={canUpload ? handleDragOver : undefined}
          onDragLeave={canUpload ? handleDragLeave : undefined}
          onDrop={canUpload ? handleDrop : undefined}
          onClick={canUpload ? handleClickUpload : undefined}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${!canUpload ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {!canUpload && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg z-10">
              <Lock className="h-8 w-8 text-gray-400 mb-2" />
              <div className="text-sm font-medium text-gray-600">PRO Özelliği</div>
              <div className="text-xs text-gray-500">Görsel yüklemek için yükseltin</div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
              <p className="text-sm text-gray-600">
                {isCompressing ? 'Görsel optimize ediliyor...' : 'Görsel yükleniyor...'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {isDragging ? (
                <Upload className="h-12 w-12 text-primary-500" />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Görsel yüklemek için tıklayın veya sürükleyin
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Davetiyenizde görüntülenecek fotoğraf veya logo
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🎨 NEW: Modern Image Position Selector */}
      {currentImageUrl && onPositionChange && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <span className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                <span className="text-white text-xs">📍</span>
              </span>
              Görsel Stili
            </label>
            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-bold rounded-full">
              YENİ
            </span>
          </div>

          {/* Position Cards - Modern & Compact */}
          <div className="grid grid-cols-2 gap-2">
            {/* Profile - Circular */}
            <button
              type="button"
              onClick={() => onPositionChange('profile')}
              className={`group relative p-3 rounded-xl border-2 transition-all ${
                currentPosition === 'profile'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
              }`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all ${
                currentPosition === 'profile'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-500'
              }`}>
                <span className="text-sm">●</span>
              </div>
              {/* Label */}
              <div className={`text-xs font-bold text-center ${
                currentPosition === 'profile' ? 'text-purple-700' : 'text-gray-700'
              }`}>
                Profil
              </div>
              {/* Description */}
              <div className="text-xs text-gray-500 text-center mt-1">
                Yuvarlak
              </div>
              {/* Selected Badge */}
              {currentPosition === 'profile' && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </button>

            {/* Banner - Wide Rectangle */}
            <button
              type="button"
              onClick={() => onPositionChange('banner')}
              className={`group relative p-3 rounded-xl border-2 transition-all ${
                currentPosition === 'banner'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-6 mx-auto mb-2 rounded flex items-center justify-center transition-all ${
                currentPosition === 'banner'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500'
              }`}>
                <span className="text-xs">━</span>
              </div>
              {/* Label */}
              <div className={`text-xs font-bold text-center ${
                currentPosition === 'banner' ? 'text-blue-700' : 'text-gray-700'
              }`}>
                Banner
              </div>
              {/* Description */}
              <div className="text-xs text-gray-500 text-center mt-1">
                Geniş
              </div>
              {/* Selected Badge */}
              {currentPosition === 'banner' && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </button>

            {/* Background - Full Cover */}
            <button
              type="button"
              onClick={() => onPositionChange('background')}
              className={`group relative p-3 rounded-xl border-2 transition-all ${
                currentPosition === 'background'
                  ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center transition-all ${
                currentPosition === 'background'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-500'
              }`}>
                <span className="text-xs">⬚</span>
              </div>
              {/* Label */}
              <div className={`text-xs font-bold text-center ${
                currentPosition === 'background' ? 'text-emerald-700' : 'text-gray-700'
              }`}>
                Arka Plan
              </div>
              {/* Description */}
              <div className="text-xs text-gray-500 text-center mt-1">
                Tam Ekran
              </div>
              {/* Selected Badge */}
              {currentPosition === 'background' && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </button>

            {/* Watermark - Small Logo */}
            <button
              type="button"
              onClick={() => onPositionChange('watermark')}
              className={`group relative p-3 rounded-xl border-2 transition-all ${
                currentPosition === 'watermark'
                  ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'
              }`}
            >
              {/* Icon */}
              <div className={`w-6 h-6 mx-auto mb-2 rounded flex items-center justify-center transition-all ${
                currentPosition === 'watermark'
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-500'
              }`}>
                <span className="text-xs">◇</span>
              </div>
              {/* Label */}
              <div className={`text-xs font-bold text-center ${
                currentPosition === 'watermark' ? 'text-amber-700' : 'text-gray-700'
              }`}>
                Logo
              </div>
              {/* Description */}
              <div className="text-xs text-gray-500 text-center mt-1">
                Küçük
              </div>
              {/* Selected Badge */}
              {currentPosition === 'watermark' && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Logo Shape Selector (only for watermark) */}
          {currentPosition === 'watermark' && onLogoShapeChange && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900">Logo Şekli</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onLogoShapeChange('circle')}
                  className={`p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                    currentLogoShape === 'circle'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/40'
                  }`}
                >
                  ● Yuvarlak
                </button>
                <button
                  type="button"
                  onClick={() => onLogoShapeChange('square')}
                  className={`p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                    currentLogoShape === 'square'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/40'
                  }`}
                >
                  ■ Kare
                </button>
              </div>
            </div>
          )}

          {/* Current Selection Info */}
          <div className={`p-2.5 rounded-lg border transition-all ${
            currentPosition === 'profile' ? 'bg-purple-50/50 border-purple-200/50' :
            currentPosition === 'banner' ? 'bg-blue-50/50 border-blue-200/50' :
            currentPosition === 'background' ? 'bg-emerald-50/50 border-emerald-200/50' :
            'bg-amber-50/50 border-amber-200/50'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0">ℹ️</span>
              <div className="text-xs text-gray-700">
                {currentPosition === 'profile' && (
                  <><strong>Profil:</strong> Görsel yuvarlak şekilde, davetiyenin üst ortasında görünür.</>
                )}
                {currentPosition === 'banner' && (
                  <><strong>Banner:</strong> Görsel geniş banner olarak davetiyenin en üstünde görünür.</>
                )}
                {currentPosition === 'background' && (
                  <><strong>Arka Plan:</strong> Görsel tüm davetiyeyi kaplayan arka plan olarak görünür.</>
                )}
                {currentPosition === 'watermark' && (
                  <><strong>Logo:</strong> Görsel küçük logo olarak sağ alt köşede görünür.</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Information */}
      {currentImageUrl && imageInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 space-y-1">
              <div><strong>Boyut:</strong> {imageInfo.size}</div>
              <div><strong>Çözünürlük:</strong> {imageInfo.dimensions}</div>
              <div><strong>En-Boy Oranı:</strong> {imageInfo.aspectRatio}</div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        💡 İpucu: 1MB'dan büyük görseller otomatik olarak optimize edilir. Görsel konumunu değiştirerek farklı görünümler oluşturabilirsiniz.
      </p>
    </div>
  );
};

export default ImageUpload;

