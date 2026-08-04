import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mediaService, type Media, type GuestUploadRecord } from '../services/mediaService';
import { invitationService, type Invitation } from '../services/invitationService';
import { supabase } from '../services/supabase';
import { Loader2, QrCode, Download, Video, Image as ImageIcon, Trash2, User, Eye, Calendar, HardDrive, Play, Plus, X, Maximize2, ArrowLeft, Sparkles, Users, Upload as UploadIcon, FolderDown } from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const QRManagePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get('invitationId');

  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<Media | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [allowGuest, setAllowGuest] = useState(false);
  const [guestUploads, setGuestUploads] = useState<GuestUploadRecord[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: 'video' | 'image', title: string} | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{type: 'guest', id: string, title: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const toggleVideoPlay = (videoId: string) => {
    setPlayingVideo(playingVideo === videoId ? null : videoId);
  };

  const handleToggleGuest = async () => {
    if (!media) return;
    
    try {
      await mediaService.updateMedia(media.id, { allow_guest_upload: !allowGuest });
      setAllowGuest(!allowGuest);
      toast.success(allowGuest ? 'Davetli yüklemeleri kapatıldı' : 'Davetli yüklemeleri açıldı');
    } catch (error) {
      toast.error('Ayarlar güncellenemedi');
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('İndirme başlatıldı');
    } catch (error) {
      toast.error('Dosya indirilemedi');
    }
  };

  const handleMediaClick = (url: string, type: 'video' | 'image', title: string) => {
    setSelectedMedia({ url, type, title });
  };

  const handleDeleteMedia = async () => {
    if (!deleteDialog || !media) return;
    
    setDeleting(true);
    try {
      if (deleteDialog.type === 'guest') {
        await mediaService.deleteGuestUpload(deleteDialog.id);
        setGuestUploads(prev => prev.filter(upload => upload.id !== deleteDialog.id));
        toast.success('Medya silindi');
        
        if (media) {
          setMedia(prev => prev ? {
            ...prev,
            guest_uploads_count: (prev.guest_uploads_count || 0) - 1
          } : null);
        }
      }
      setDeleteDialog(null);
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!media) return;
    
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('qr-media');
      
      // Ana medya ekle
      if (signedUrls[media.id]) {
        const response = await fetch(signedUrls[media.id]);
        const blob = await response.blob();
        const extension = media.type === 'video' ? 'mp4' : 'jpg';
        folder?.file(`ana-medya.${extension}`, blob);
      }
      
      // Davetli yüklemelerini ekle
      for (let i = 0; i < guestUploads.length; i++) {
        const upload = guestUploads[i];
        if (signedUrls[upload.id]) {
          const response = await fetch(signedUrls[upload.id]);
          const blob = await response.blob();
          const extension = upload.type === 'video' ? 'mp4' : 'jpg';
          const guestName = upload.guest_name || `davetli-${i + 1}`;
          folder?.file(`${guestName}.${extension}`, blob);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `qr-media-${media.qr_code}.zip`);
      toast.success('Tüm medyalar indirildi');
    } catch (error) {
      console.error('Download all error:', error);
      toast.error('Toplu indirme başarısız');
    } finally {
      setDownloadingAll(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!invitationId) {
          toast.error('Davetiye ID bulunamadı');
          navigate('/media');
          return;
        }

        // Load invitation and check if published
        const inv = await invitationService.getInvitation(invitationId);
        setInvitation(inv);
        
        if (inv?.status !== 'published') {
          toast.error('QR medya yönetmek için davetiyeyi önce yayınlayın');
          navigate(`/editor/${invitationId}`);
          return;
        }

        const mediaData = await mediaService.getMediaByInvitationId(invitationId);
        if (!mediaData) {
          toast.error('QR medya bulunamadı');
          navigate('/media');
          return;
        }

        setMedia(mediaData);
        setAllowGuest(mediaData.allow_guest_upload || false);

        const guestUploadsData = await mediaService.getGuestUploads(mediaData.qr_code);
        setGuestUploads(guestUploadsData);

        const urls: Record<string, string> = {};
        
        if (mediaData.storage_path) {
          const signedUrl = await mediaService.generateSignedUrl(mediaData.storage_path);
          urls[mediaData.id] = signedUrl;
        }

        for (const upload of guestUploadsData) {
          if (upload.storage_path) {
            const signedUrl = await mediaService.generateSignedUrl(upload.storage_path);
            urls[upload.id] = signedUrl;
          }
        }

        setSignedUrls(urls);
      } catch (error) {
        console.error('Load error:', error);
        toast.error('Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [invitationId, navigate]);

  const handleAdditionalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !media) return;

    setUploading(true);
    try {
      const result = await mediaService.uploadAdditionalMedia(media.invitation_id!, file);
      setGuestUploads(prev => [...prev, result]);
      
      if (result.storage_path) {
        const signedUrl = await mediaService.generateSignedUrl(result.storage_path);
        setSignedUrls(prev => ({ ...prev, [result.id]: signedUrl }));
      }
      
      setMedia(prev => prev ? {
        ...prev,
        guest_uploads_count: (prev.guest_uploads_count || 0) + 1
      } : null);
      
      toast.success('Medya yüklendi');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Yükleme başarısız');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="h-8 w-8 text-primary-600" />
          </div>
          <p className="text-gray-700 mb-4 font-semibold">Bu davetiye için QR oluşturulmamış</p>
          <button 
            onClick={() => navigate(`/media/upload?invitationId=${invitationId}`)} 
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
          >
            <Plus className="h-4 w-4" />
            QR Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header - Compact */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Geri</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg">
                  <QrCode className="h-5 w-5 text-primary-600" />
                </div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900">QR Medya Galerisi</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadAll}
                disabled={downloadingAll || (!media.qr_image_url && guestUploads.length === 0)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
              >
                {downloadingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">İndiriliyor...</span>
                  </>
                ) : (
                  <>
                    <FolderDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Tümünü İndir</span>
                  </>
                )}
              </button>
              {media.qr_image_url && (
                <button
                  onClick={() => handleDownload(media.qr_image_url, `qr-${media.qr_code}.png`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary-300 transition-all text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">QR İndir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-900">QR Kod</span>
            </div>
            <p className="font-mono text-xs text-blue-700 truncate">{media.qr_code}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-900">Görüntülenme</span>
            </div>
            <p className="text-lg font-bold text-green-700">{media.view_count}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200/50">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-900">Saklama</span>
            </div>
            <p className="text-base font-bold text-purple-700">
              {media.storage_plan === '1_year' ? '1 Yıl' : '3 Ay'}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-bold text-orange-900">Davetli</span>
            </div>
            <p className="text-lg font-bold text-orange-700">{guestUploads.length}</p>
          </div>
        </div>

        {/* Settings - Compact */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={allowGuest} 
              onChange={handleToggleGuest}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-semibold text-gray-700">Davetli yüklemelerine izin ver</span>
          </label>
        </div>

        {/* Host Media Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Davet Sahibi Medyası</h2>
                <p className="text-xs text-gray-600">Ana medya</p>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer text-sm">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Ekle</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleAdditionalUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        
          {/* Main Media Card - Compact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
            <div className="aspect-video bg-gray-100 relative">
              {media.type === 'video' ? (
                <>
                  <video 
                    src={signedUrls[media.id] || media.storage_url} 
                    controls={playingVideo === media.id}
                    className="w-full h-full object-cover"
                    onPlay={() => setPlayingVideo(media.id)}
                    onPause={() => setPlayingVideo(null)}
                  />
                  {playingVideo !== media.id && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <button
                        onClick={() => toggleVideoPlay(media.id)}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-all backdrop-blur-sm"
                      >
                        <Play className="h-8 w-8 text-white" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <img 
                  src={signedUrls[media.id] || media.storage_url} 
                  alt={media.title || 'Media'} 
                  className="w-full h-full object-cover cursor-pointer" 
                  onClick={() => handleMediaClick(signedUrls[media.id] || media.storage_url, media.type, media.title || 'Davet Sahibi Medyası')}
                />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    media.type === 'video' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {media.type === 'video' ? '🎥' : '📸'}
                  </span>
                  <span className="px-2 py-1 text-xs font-bold rounded-full bg-primary-600 text-white">
                    👑 Ana
                  </span>
                </div>
                
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleDownload(signedUrls[media.id] || media.storage_url, `${media.title || 'ana-medya'}.${media.type === 'video' ? 'mp4' : 'jpg'}`)}
                    className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg transition-all"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMediaClick(signedUrls[media.id] || media.storage_url, media.type, media.title || 'Davet Sahibi Medyası')}
                    className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg transition-all"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">
                {media.title || 'Ana Medya'}
              </h3>
              {media.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {media.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>{formatFileSize(media.file_size)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(media.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Uploads Section */}
        {guestUploads.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Davetli Yüklemeleri</h2>
                <p className="text-xs text-gray-600">{guestUploads.length} medya</p>
              </div>
            </div>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guestUploads.map((upload) => (
                <div key={upload.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
                  <div className="aspect-video bg-gray-100 relative">
                    {upload.type === 'video' ? (
                      <>
                        <video 
                          src={signedUrls[upload.id]} 
                          controls={playingVideo === upload.id}
                          className="w-full h-full object-cover"
                          onPlay={() => setPlayingVideo(upload.id)}
                          onPause={() => setPlayingVideo(null)}
                        />
                        {playingVideo !== upload.id && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <button
                              onClick={() => toggleVideoPlay(upload.id)}
                              className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all backdrop-blur-sm"
                            >
                              <Play className="h-6 w-6 text-white" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <img 
                        src={signedUrls[upload.id]} 
                        alt={upload.guest_name || 'Guest upload'} 
                        className="w-full h-full object-cover cursor-pointer" 
                        onClick={() => handleMediaClick(signedUrls[upload.id], upload.type, upload.guest_name || 'Davetli')}
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          upload.type === 'video' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                          {upload.type === 'video' ? '🎥' : '📸'}
                        </span>
                      </div>
                      
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={() => handleDownload(signedUrls[upload.id], `${upload.guest_name || 'davetli'}.${upload.type === 'video' ? 'mp4' : 'jpg'}`)}
                          className="p-1.5 bg-white/90 hover:bg-white text-gray-900 rounded-lg transition-all"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleMediaClick(signedUrls[upload.id], upload.type, upload.guest_name || 'Davetli')}
                          className="p-1.5 bg-white/90 hover:bg-white text-gray-900 rounded-lg transition-all"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ type: 'guest', id: upload.id, title: upload.guest_name || 'Bu medya' })}
                          className="p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <p className={`text-xs font-bold truncate ${upload.guest_name?.trim() ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {upload.guest_name?.trim() || 'Anonim'}
                      </p>
                    </div>
                    
                    {upload.note?.trim() && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        💬 {upload.note}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        <span>{formatFileSize(upload.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(upload.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Media Preview Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">{selectedMedia.title}</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} controls className="w-full rounded-xl" />
            ) : (
              <img src={selectedMedia.url} alt={selectedMedia.title} className="w-full rounded-xl" />
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Medyayı Sil</h3>
            <p className="text-sm text-gray-600 mb-6">
              "{deleteDialog.title}" medyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialog(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteMedia}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  'Evet, Sil'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRManagePage;
