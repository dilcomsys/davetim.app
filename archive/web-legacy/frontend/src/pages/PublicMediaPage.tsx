import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Video, Image as ImageIcon, Calendar, Eye, QrCode, Loader2, AlertTriangle, Download, Upload, Mic, MessageSquare, User, FileText, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { mediaService, type Media, type GuestUploadRecord } from '../services/mediaService';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const PublicMediaPage: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [media, setMedia] = useState<Media | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestUploads, setGuestUploads] = useState<GuestUploadRecord[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestNote, setGuestNote] = useState('');
  const [guestFile, setGuestFile] = useState<File | null>(null);
  const [guestFilePreview, setGuestFilePreview] = useState<string | null>(null);
  const [isGuestUploading, setIsGuestUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (qrCode) {
      loadMedia();
    }
  }, [qrCode]);

  const loadMedia = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await mediaService.getMediaByQRCode(qrCode!);
      
      if (!data) {
        setError('Medya bulunamadı veya süresi dolmuş');
        return;
      }

      // If bucket is private, generate signed URL from storage_path
      if (data.storage_path) {
        const { data: signed } = await supabase.storage
          .from('qr-media')
          .createSignedUrl(data.storage_path, 60 * 60); // 1 hour
        if (signed?.signedUrl) {
          data.storage_url = signed.signedUrl as any;
        }
      }
      setMedia(data);
      // Load guest uploads if allowed
      if (data.allow_guest_upload) {
        const uploads = await mediaService.getGuestUploads(qrCode!);
        
        // Generate signed URLs for guest uploads
        const uploadsWithSignedUrls = await Promise.all(
          uploads.map(async (upload) => {
            // Always try to create signed URL from storage_path
            if (upload.storage_path) {
              const { data: signed, error } = await supabase.storage
                .from('qr-media')
                .createSignedUrl(upload.storage_path, 60 * 60); // 1 hour
              
              if (error || !signed?.signedUrl) {
                // Return upload without storage_url to show placeholder
                return { ...upload, storage_url: undefined };
              }
              
              return { ...upload, storage_url: signed.signedUrl };
            }
            
            // Return upload without storage_url to show placeholder
            return { ...upload, storage_url: undefined };
          })
        );
        
        setGuestUploads(uploadsWithSignedUrls);
      }

      // Increment view count
      await mediaService.incrementViewCount(data.id);
    } catch (err: any) {
      console.error('Load media error:', err);
      setError('Medya yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) {
      setGuestFile(null);
      setGuestFilePreview(null);
      return;
    }

    // Validate file
    const validation = mediaService.validateMediaFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      e.target.value = ''; // Reset input
      return;
    }

    setGuestFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setGuestFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGuestUpload = async () => {
    if (!qrCode || !guestFile) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    // Check upload limit
    if (media && media.guest_uploads_count >= (media.guest_uploads_limit || 50)) {
      toast.error('Yükleme limiti doldu');
      return;
    }

    try {
      setIsGuestUploading(true);
      const record = await mediaService.uploadGuestMedia({
        qrCode,
        file: guestFile,
        guestName: guestName || undefined,
        note: guestNote || undefined,
      });
      
      // Generate signed URL for the newly uploaded media
      let recordWithSignedUrl = record;
      if (record.storage_path) {
        const { data: signed } = await supabase.storage
          .from('qr-media')
          .createSignedUrl(record.storage_path, 60 * 60); // 1 hour
        
        if (signed?.signedUrl) {
          recordWithSignedUrl = { ...record, storage_url: signed.signedUrl };
        }
      }
      
      setGuestUploads(prev => [recordWithSignedUrl, ...prev]);
      setGuestFile(null);
      setGuestFilePreview(null);
      setGuestName('');
      setGuestNote('');
      setUploadSuccess(true);
      
      // Update media count
      if (media) {
        setMedia({ ...media, guest_uploads_count: (media.guest_uploads_count || 0) + 1 });
      }
      
      // Reset success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
      
      toast.success('Medyanız başarıyla yüklendi!');
    } catch (err) {
      // toast already shown
    } finally {
      setIsGuestUploading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDownload = () => {
    if (!media) return;

    const link = document.createElement('a');
    link.href = media.storage_url;
    link.download = media.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('İndirme başlatıldı');
  };

  // Loading State - Modern
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex p-4 bg-white rounded-2xl shadow-lg mb-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          </div>
          <p className="text-gray-900 text-lg font-semibold">Medya yükleniyor...</p>
          <p className="text-gray-600 text-sm mt-1">Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  // Error State - Modern
  if (error || !media) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 text-center max-w-md border border-gray-200">
          <div className="inline-flex p-4 bg-red-100 rounded-2xl mb-4">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Medya Bulunamadı
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            {error || 'Bu QR kod geçersiz veya medyanın süresi dolmuş olabilir.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            <span>Ana Sayfaya Dön</span>
          </a>
        </div>
      </div>
    );
  }

  // Success: Display Media
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* Header - Modern & Compact */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow-md mb-3">
            <QrCode className="h-4 w-4" />
            <span className="font-bold text-sm">QR Medya</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {media.title}
          </h1>
          {media.description && (
            <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
              {media.description}
            </p>
          )}
        </div>

        {/* Host Message - Modern */}
        {media.owner_message_url && (
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg">
                <Mic className="h-4 w-4 text-pink-700" />
              </div>
              <h3 className="text-gray-900 font-bold text-sm">Davet Sahibi Mesajı</h3>
            </div>
            {media.owner_message_type === 'audio' && (
              <audio src={media.owner_message_url} controls className="w-full" />
            )}
            {media.owner_message_type === 'video' && (
              <video src={media.owner_message_url} controls className="w-full rounded-xl" />
            )}
            {media.owner_message_type === 'image' && (
              <img src={media.owner_message_url} alt={media.owner_message_title || 'Mesaj'} className="w-full rounded-xl" />
            )}
            {media.owner_message_title && (
              <p className="text-gray-600 mt-2 text-sm">{media.owner_message_title}</p>
            )}
          </div>
        )}

        {/* Media Viewer - Modern */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6 border border-gray-200">
          {media.type === 'video' ? (
            <video
              src={media.storage_url}
              controls
              autoPlay
              className="w-full max-h-[70vh] mx-auto bg-black"
              poster={media.thumbnail_url}
            >
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>
          ) : (
            <img
              src={media.storage_url}
              alt={media.title || 'Media'}
              className="w-full max-h-[70vh] object-contain mx-auto bg-gray-50"
            />
          )}
        </div>

        {/* Info Cards - Modern & Compact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          {/* Type */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${media.type === 'video' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {media.type === 'video' ? (
                  <Video className="h-3.5 w-3.5 text-blue-700" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5 text-green-700" />
                )}
              </div>
              <h3 className="text-gray-900 font-bold text-xs">Tür</h3>
            </div>
            <p className="text-gray-600 text-sm">
              {media.type === 'video' ? 'Video' : 'Görsel'}
            </p>
          </div>

          {/* Views */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Eye className="h-3.5 w-3.5 text-purple-700" />
              </div>
              <h3 className="text-gray-900 font-bold text-xs">Görüntülenme</h3>
            </div>
            <p className="text-gray-600 text-sm">
              {media.view_count} kez
            </p>
          </div>

          {/* Date */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Calendar className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <h3 className="text-gray-900 font-bold text-xs">Yükleme</h3>
            </div>
            <p className="text-gray-600 text-sm">
              {formatDate(media.created_at)}
            </p>
          </div>
        </div>

        {/* Guest Upload Section - Modern & User-Friendly */}
        {media.allow_guest_upload && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 md:p-6 border border-green-200 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-200 to-emerald-200 rounded-lg">
                  <Upload className="h-4 w-4 text-green-700" />
                </div>
                <h3 className="text-gray-900 font-bold text-sm">Fotoğraf/Video Paylaş</h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                (media.guest_uploads_count || 0) >= (media.guest_uploads_limit || 50)
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {media.guest_uploads_count || 0}/{media.guest_uploads_limit || 50}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4 text-sm">
              Etkinlikten çektiğiniz fotoğraf veya videoları paylaşın 📸
            </p>

            {/* Success Message */}
            {uploadSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-xl flex items-center gap-2 animate-slideUp">
                <CheckCircle2 className="h-4 w-4 text-green-700 flex-shrink-0" />
                <p className="text-green-800 text-sm font-semibold">Medyanız başarıyla yüklendi! 🎉</p>
              </div>
            )}

            {/* Upload Limit Warning */}
            {(media.guest_uploads_count || 0) >= (media.guest_uploads_limit || 50) && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-xl flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-700 flex-shrink-0" />
                <p className="text-red-800 text-sm font-semibold">Yükleme limiti doldu</p>
              </div>
            )}

            {/* Form */}
            {(media.guest_uploads_count || 0) < (media.guest_uploads_limit || 50) && (
              <div className="space-y-3">
                {/* Name & Note Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      <User className="h-3 w-3 inline mr-1" />
                      İsminiz (opsiyonel)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Ahmet Yılmaz"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      maxLength={50}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      <FileText className="h-3 w-3 inline mr-1" />
                      Kısa Not (opsiyonel)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Düğün töreni"
                      value={guestNote}
                      onChange={e => setGuestNote(e.target.value)}
                      maxLength={100}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* File Input with Preview */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Fotoğraf/Video Seç <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleGuestFileChange}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                    />
                    <button
                      onClick={handleGuestUpload}
                      disabled={isGuestUploading || !guestFile}
                      className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                    >
                      {isGuestUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Yükle</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Maksimum dosya boyutu: 50MB (Fotoğraf) / 100MB (Video)
                  </p>
                </div>

                {/* File Preview */}
                {guestFilePreview && guestFile && (
                  <div className="p-3 bg-white rounded-xl border border-gray-200">
                    <p className="text-xs font-bold text-gray-700 mb-2">Önizleme:</p>
                    {guestFile.type.startsWith('video/') ? (
                      <video src={guestFilePreview} controls className="w-full max-h-48 rounded-lg" />
                    ) : (
                      <img src={guestFilePreview} alt="Preview" className="w-full max-h-48 object-contain rounded-lg" />
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      {guestFile.name} ({(guestFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Guest Uploads Gallery - Modern */}
        {guestUploads.length > 0 && (
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                <MessageSquare className="h-4 w-4 text-blue-700" />
              </div>
              <h3 className="text-gray-900 font-bold text-sm">Davetli Paylaşımları</h3>
              <span className="ml-auto text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg">
                {guestUploads.length} paylaşım
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {guestUploads.map(item => (
                <div key={item.id} className="group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                  {item.type === 'video' ? (
                    <video 
                      src={item.storage_url} 
                      controls 
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <img 
                      src={item.storage_url} 
                      alt={item.file_name} 
                      className="w-full h-40 object-cover"
                    />
                  )}
                    {!item.storage_url && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 p-4">
                        <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 text-center">Medya yüklenemedi</p>
                        <p className="text-xs text-gray-400 text-center">Storage path eksik</p>
                      </div>
                    )}
                    <div className="p-2 bg-white border-t border-gray-200">
                      <div className={`text-xs font-bold truncate ${item.guest_name?.trim() ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        👤 {item.guest_name?.trim() || 'Anonim'}
                      </div>
                      {item.note?.trim() && (
                        <div className="text-xs text-gray-600 truncate mt-1">💬 {item.note}</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions - Modern */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2 border border-gray-200"
          >
            <Download className="h-4 w-4" />
            <span>Medyayı İndir</span>
          </button>
          <a
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Davetim ile Oluştur</span>
          </a>
        </div>

        {/* Footer - Modern */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-2">
            Bu medya{' '}
            <a
              href="/"
              className="text-primary-600 hover:text-primary-700 font-bold"
            >
              Davetim
            </a>
            {' '}ile oluşturulmuştur
          </p>
          {media.expires_at && (
            <p className="text-gray-500 text-xs">
              📅 Bu medya {formatDate(media.expires_at)} tarihine kadar erişilebilir
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicMediaPage;

