import React, { useState, useEffect } from 'react';
import { Plus, Video, Image as ImageIcon, Download, Trash2, QrCode, Eye, Calendar, HardDrive, Loader2, Users } from 'lucide-react';
import { mediaService, type Media, type MediaStats } from '../../services/mediaService';
import { useSubscription } from '../../hooks/useSubscription';
import toast from 'react-hot-toast';
import ConfirmDialog from '../Common/ConfirmDialog';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';

interface MediaGalleryProps {
  invitationId?: string; // If set, only show media for this invitation
  showUploadButton?: boolean;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  invitationId,
  showUploadButton = true,
}) => {
  const subscription = useSubscription();
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [invitationTitles, setInvitationTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMedia();
    loadStats();
  }, []);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const data = await mediaService.getUserMedia();
      
      // Filter by invitation if specified
      const filteredData = invitationId
        ? data.filter(m => m.invitation_id === invitationId)
        : data;
      
      setMediaList(filteredData);
      
      // Generate signed URLs for all media
      const urlMap: Record<string, string> = {};
      for (const media of filteredData) {
        if (media.storage_path) {
          const { data: signed } = await supabase.storage
            .from('qr-media')
            .createSignedUrl(media.storage_path, 60 * 60);
          if (signed?.signedUrl) {
            urlMap[media.id] = signed.signedUrl;
          }
        }
      }
      setSignedUrls(urlMap);
      
      // Load invitation titles for media with invitation_id
      const invitationIds = [...new Set(filteredData.map(m => m.invitation_id).filter(Boolean))];
      if (invitationIds.length > 0) {
        const { data: invitations } = await supabase
          .from('invitations')
          .select('id, title')
          .in('id', invitationIds);
        
        if (invitations) {
          const titleMap: Record<string, string> = {};
          invitations.forEach(inv => {
            titleMap[inv.id] = inv.title;
          });
          setInvitationTitles(titleMap);
        }
      }
    } catch (error) {
      console.error('Load media error:', error);
      toast.error('Medya yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await mediaService.getUserMediaStats();
      setMediaStats(stats);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleDeleteClick = (media: Media) => {
    setMediaToDelete(media);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mediaToDelete) return;

    setIsDeleting(true);
    try {
      const success = await mediaService.deleteMedia(mediaToDelete.id);
      if (success) {
        await loadMedia();
        await loadStats();
        setShowDeleteDialog(false);
        setMediaToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadQR = (media: Media) => {
    if (!media.qr_image_url) {
      toast.error('QR kod resmi bulunamadı');
      return;
    }

    // Download QR code
    const link = document.createElement('a');
    link.href = media.qr_image_url;
    link.download = `qr-${media.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('QR kod indirildi');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiration = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if user can upload media
  const [canUploadMedia, setCanUploadMedia] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await subscription.canUseQRMedia();
      setCanUploadMedia(access.allowed);
    };
    checkAccess();
  }, [subscription]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      {mediaStats && !invitationId && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Medya İstatistikleri</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary-600 mb-1">
                <HardDrive className="h-4 w-4" />
                <span className="text-xs font-medium">Toplam Medya</span>
              </div>
              <p className="text-2xl font-bold text-primary-900">{mediaStats.totalCount}</p>
              <p className="text-xs text-primary-600 mt-1">{mediaStats.totalStorageMB} MB</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Video className="h-4 w-4" />
                <span className="text-xs font-medium">Video</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{mediaStats.videoCount}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs font-medium">Görsel</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{mediaStats.imageCount}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">Toplam Scan</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{mediaStats.totalScans}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {invitationId ? 'Davetiye Medyası' : 'QR Medya Galerim'}
        </h2>
        <div className="text-sm text-gray-600">
          {canUploadMedia ? (
            <span>💡 QR medya oluşturmak için davetiye editörünü kullanın</span>
          ) : (
            <Link
              to="/pricing"
              className="btn-primary inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Plus className="h-5 w-5" />
              Premium'a Geç
            </Link>
          )}
        </div>
      </div>

      {/* Media Grid */}
      {mediaList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaList.map((media) => {
            const daysLeft = media.expires_at ? getDaysUntilExpiration(media.expires_at) : null;
            const isExpiringSoon = daysLeft !== null && daysLeft <= 30;

            return (
              <div
                key={media.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100">
                  {media.type === 'video' ? (
                    <>
                      <video
                        src={signedUrls[media.id] || media.storage_url}
                        className="w-full h-full object-cover"
                        controls={false}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <Video className="h-12 w-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={signedUrls[media.id] || media.storage_url}
                      alt={media.title || 'Media'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        media.type === 'video'
                          ? 'bg-blue-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {media.type === 'video' ? '🎥 Video' : '📸 Görsel'}
                    </span>
                  </div>

                  {/* Expiration Warning */}
                  {isExpiringSoon && daysLeft && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500 text-white">
                        ⚠️ {daysLeft} gün kaldı
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-2">
                    {media.title || 'İsimsiz Medya'}
                  </h3>

                  {media.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {media.description}
                    </p>
                  )}

                  {/* Invitation Info */}
                  {media.invitation_id && invitationTitles[media.invitation_id] && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-3 bg-blue-50 px-2 py-1 rounded">
                      <Users className="h-3 w-3" />
                      <span className="truncate">
                        Davetiye: {invitationTitles[media.invitation_id]}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3 w-3" />
                      <span>{formatFileSize(media.file_size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Yüklendi: {formatDate(media.created_at)}</span>
                    </div>
                    {media.expires_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Son Kullanma: {formatDate(media.expires_at)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <QrCode className="h-3 w-3" />
                        <span>{media.scan_count} scan</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{media.view_count} görüntüleme</span>
                      </div>
                      {media.guest_uploads_count && media.guest_uploads_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{media.guest_uploads_count} davetli yüklemesi</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/media/${media.qr_code}`}
                      className="btn-outline text-sm py-2 flex-1"
                      target="_blank"
                    >
                      <Eye className="h-4 w-4 mr-1 inline" />
                      Görüntüle
                    </Link>
                    {media.invitation_id && (
                      <Link
                        to={`/media/manage?invitationId=${media.invitation_id}`}
                        className="btn-outline text-sm py-2 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                        title="QR Yönet"
                      >
                        <QrCode className="h-4 w-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleDownloadQR(media)}
                      className="btn-outline text-sm py-2 px-3"
                      title="QR Kodu İndir"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(media)}
                      className="btn-outline text-sm py-2 px-3 text-red-600 border-red-200 hover:bg-red-50"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <QrCode className="h-10 w-10 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {canUploadMedia ? 'Henüz QR medya oluşturulmadı' : 'QR Medya Premium Özelliği'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {canUploadMedia
              ? 'Davetiyeleriniz için QR kod oluşturun ve medya paylaşın. Davetiye editöründen başlayın!'
              : 'Video ve fotoğraflarınızı QR kod ile paylaşmak için Premium plana yükseltin.'}
          </p>
          {canUploadMedia ? (
            <Link
              to="/dashboard"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Davetiyelerime Git
            </Link>
          ) : (
            <Link
              to="/pricing"
              className="btn-primary inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Premium'a Geç
            </Link>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setMediaToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Medyayı Sil"
        message={`"${mediaToDelete?.title}" medyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve QR kodu artık çalışmayacaktır.`}
        confirmText="Evet, Sil"
        cancelText="İptal"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};