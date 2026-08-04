import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Video, Image as ImageIcon, Loader2, CheckCircle, AlertTriangle, ArrowLeft, Sparkles, QrCode, Clock, Shield } from 'lucide-react';
import { mediaService, type Media, type GuestUploadRecord } from '../services/mediaService';
import { invitationService, type Invitation } from '../services/invitationService';
import { supabase } from '../services/supabase';
import { useSubscription } from '../hooks/useSubscription';
import toast from 'react-hot-toast';

const MediaUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subscription = useSubscription();
  const invitationId = searchParams.get('invitationId') || undefined;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [canUpload, setCanUpload] = useState(false);
  const [existingMedia, setExistingMedia] = useState<Media | null>(null);
  const [guestUploads, setGuestUploads] = useState<GuestUploadRecord[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  // Check if user can upload media
  useEffect(() => {
    const checkAccess = async () => {
      const access = await subscription.canUseQRMedia();
      setCanUpload(access.allowed);
    };
    checkAccess();
  }, [subscription]);

  // Load invitation and check if published
  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationId) return;
      try {
        const inv = await invitationService.getInvitation(invitationId);
        setInvitation(inv);
        
        if (inv?.status !== 'published') {
          toast.error('QR medya oluşturmak için davetiyeyi önce yayınlayın');
          navigate(`/editor/${invitationId}`);
        }
      } catch (error) {
        console.error('Error loading invitation:', error);
        toast.error('Davetiye yüklenemedi');
        navigate('/dashboard');
      }
    };
    loadInvitation();
  }, [invitationId, navigate]);

  // Load existing QR media and guest uploads
  useEffect(() => {
    const loadExisting = async () => {
      if (!invitationId || !invitation) return;
      try {
        const media = await mediaService.getMediaByInvitationId(invitationId);
        setExistingMedia(media);
        if (media?.qr_code) {
          const uploads = await mediaService.getGuestUploads(media.qr_code);
          setGuestUploads(uploads);
          
          // Generate signed URLs
          const urlMap: Record<string, string> = {};
          
          // Host media signed URL
          if (media.storage_path) {
            const { data: signed } = await supabase.storage
              .from('qr-media')
              .createSignedUrl(media.storage_path, 60 * 60);
            if (signed?.signedUrl) {
              urlMap[media.id] = signed.signedUrl;
            }
          }
          
          // Guest uploads signed URLs
          for (const upload of uploads) {
            if (upload.storage_path) {
              const { data: signed } = await supabase.storage
                .from('qr-media')
                .createSignedUrl(upload.storage_path, 60 * 60);
              if (signed?.signedUrl) {
                urlMap[upload.id] = signed.signedUrl;
              }
            }
          }
          
          setSignedUrls(urlMap);
        }
      } catch {}
    };
    loadExisting();
  }, [invitationId, invitation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = mediaService.validateMediaFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill title from filename
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Simulate file input
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      
      handleFileSelect({ target: input } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    if (!title.trim()) {
      toast.error('Lütfen bir başlık girin');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const media = await mediaService.createMedia({
        file: selectedFile,
        title: title.trim(),
        description: description.trim() || undefined,
        invitation_id: invitationId,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show success and redirect
      toast.success('Medya başarıyla yüklendi!');
      
      setTimeout(() => {
        navigate(invitationId ? `/editor/${invitationId}` : '/media');
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Premium Access Required
  if (!canUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-purple-600" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full mb-4">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-xs font-bold text-purple-900">Premium Özellik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              QR Medya Yükleme
            </h1>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Video ve fotoğraflarınızı QR kod ile paylaşmak için Premium plana yükseltin
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
            >
              <Sparkles className="h-4 w-4" />
              Premium'a Geç
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header - Compact */}
        <div className="mb-6">
          <button
            onClick={() => navigate(invitationId ? `/editor/${invitationId}` : '/media')}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Geri Dön</span>
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {existingMedia ? 'QR Medya Güncelle' : 'Yeni Medya Yükle'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {existingMedia 
                  ? 'Mevcut QR kodunuza yeni medya ekleyin' 
                  : 'Video veya fotoğraf yükleyin ve QR kod ile paylaşın'}
              </p>
            </div>
            {existingMedia && existingMedia.qr_image_url && (
              <div className="hidden sm:block">
                <img src={existingMedia.qr_image_url} alt="QR" className="w-16 h-16 rounded-lg border-2 border-gray-200" />
              </div>
            )}
          </div>
        </div>

        {/* Existing Media Info - Compact */}
        {existingMedia && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <QrCode className="h-5 w-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-blue-900">Mevcut QR Medya</h3>
                <p className="text-xs text-blue-700">
                  Kod: <span className="font-mono font-semibold">{existingMedia.qr_code}</span> • {guestUploads.length} davetli yüklemesi
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left & Center: Upload Area - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload - Compact */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary-600" />
                Dosya Seç
              </h2>
              
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 text-center hover:border-primary-500 hover:bg-primary-50/50 transition-all cursor-pointer group"
                >
                  <input
                    type="file"
                    id="media-file"
                    accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="media-file" className="cursor-pointer">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-primary-600" />
                    </div>
                    <p className="text-base font-bold text-gray-900 mb-2">
                      Dosya yükle veya sürükle-bırak
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      Video: MP4, MOV, WebM (max 100MB)<br />
                      Görsel: JPG, PNG, WEBP, GIF (max 10MB)
                    </p>
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm">
                      Dosya Seç
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview - Compact */}
                  <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                    {selectedFile.type.startsWith('video/') ? (
                      <video
                        src={preview || ''}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={preview || ''}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* File Info - Compact */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedFile.type.startsWith('video/') ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {selectedFile.type.startsWith('video/') ? (
                          <Video className="h-5 w-5 text-blue-600" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Details Form - Compact */}
            {selectedFile && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-4">Detaylar</h2>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📝 Başlık *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Örn: Düğün Davetiyesi Videosu"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                      maxLength={255}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      💬 Açıklama (Opsiyonel)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Medya hakkında kısa bir açıklama..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {description.length}/500 karakter
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button - Compact */}
            {selectedFile && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !title.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Yükleniyor... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Medyayı Yükle ve QR Oluştur
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-primary-700 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Info Cards - 1 column */}
          <div className="space-y-4">
            {/* How It Works - Compact */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200/50">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">Nasıl Çalışır?</h3>
                  <ul className="space-y-1.5 text-xs text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>Video/fotoğraf yükle</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>QR kod otomatik oluşturulur</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>Davetiyene QR ekle</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>Misafirler tarayarak görüntüler</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Storage Info - Compact */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-200 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-purple-900 mb-2">Saklama Süresi</h3>
                  <p className="text-xs text-purple-800">
                    {subscription.currentPlan === 'premium' 
                      ? subscription.billingPeriod === 'yearly'
                        ? '🎉 Yıllık plan: 1 yıl saklanır'
                        : '📅 Aylık plan: 3 ay saklanır'
                      : '📅 Planınıza göre otomatik belirlenir'}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notes - Compact */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-yellow-900 mb-2">Önemli Notlar</h3>
                  <ul className="space-y-1.5 text-xs text-yellow-800">
                    <li>• Süre sonunda otomatik silinir</li>
                    <li>• QR silinince çalışmaz</li>
                    <li>• Video optimize edilebilir</li>
                    <li>• Telif haklı içerik yasak</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security - Compact */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-200 rounded-lg">
                  <Shield className="h-5 w-5 text-green-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-green-900 mb-1">Güvenli Depolama</h3>
                  <p className="text-xs text-green-800">
                    Medyanız şifreli ve güvenli sunucularda saklanır
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadPage;
