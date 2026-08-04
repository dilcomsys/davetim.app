import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Share2, Loader2 } from 'lucide-react';
import { invitationService, type Invitation } from '../services/invitationService';
import { mediaService, type Media } from '../services/mediaService';
import { pdfService } from '../services/pdfService';
import { PublicInvitationSkeleton } from '../components/Skeleton/Skeleton';
import toast from 'react-hot-toast';

const PublicInvitationPage: React.FC = () => {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [qrMedia, setQrMedia] = useState<Media | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Prevent duplicate loads and toasts in React Strict Mode
  const hasLoadedRef = useRef(false);
  const hasShownErrorRef = useRef(false);

  useEffect(() => {
    // Skip if already loaded
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadInvitation();
  }, [invitationId]);

  const loadInvitation = async () => {
    if (!invitationId) {
      if (!hasShownErrorRef.current) {
        hasShownErrorRef.current = true;
        toast.error('Geçersiz davetiye');
      }
      navigate('/');
      return;
    }

    setIsLoading(true);
    try {
      const data = await invitationService.getInvitation(invitationId);

      if (!data) {
        if (!hasShownErrorRef.current) {
          hasShownErrorRef.current = true;
          toast.error('Davetiye bulunamadı');
        }
        navigate('/');
        return;
      }

      // Show status badge for non-published invitations
      // But still allow viewing (since they have the link)
      if (data.status !== 'published') {
        console.log('⚠️ Viewing draft invitation:', data.id);
      }

      setInvitation(data);

      // Load QR media if exists
      try {
        const media = await mediaService.getMediaByInvitationId(invitationId);
        if (media) {
          console.log('✅ QR Media loaded:', media);
          console.log('📍 QR Settings:', data.settings);
          setQrMedia(media);
        } else {
          console.log('ℹ️ No QR media found for invitation');
        }
      } catch (error) {
        // QR media is optional, don't show error
        console.log('⚠️ Error loading QR media:', error);
      }

      // Increment view count only for published invitations
      if (data.status === 'published') {
        await invitationService.incrementViewCount(invitationId);
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      if (!hasShownErrorRef.current) {
        hasShownErrorRef.current = true;
        toast.error('Davetiye yüklenirken bir hata oluştu');
      }
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareText = invitation?.title
      ? `${invitation.title} - Davetiye`
      : 'Davetiye';

    if ('share' in navigator) {
      navigator.share({
        title: shareText,
        text: 'Davetiyeyi görüntülemek için tıklayın',
        url: shareUrl
      }).catch(console.error);
    } else {
      const nav = navigator as any;
      if (nav.clipboard && nav.clipboard.writeText) {
        nav.clipboard.writeText(shareUrl)
          .then(() => toast.success('Link kopyalandı!'))
          .catch(() => toast.error('Link kopyalanamadı'));
      } else {
        toast.error('Tarayıcınız panoya kopyalamayı desteklemiyor');
      }
    }
  };

  if (isLoading) {
    return <PublicInvitationSkeleton />;
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Davetiye bulunamadı</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // Extract colors from invitation content
  const colors = invitation.content?.colors || {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#ffffff',
    text: '#ffffff',
    accent: '#f56565'
  };

  // Extract font
  const selectedFont = invitation.custom_design?.font || 'Playfair Display';

  // Extract text elements
  const textElements = invitation.content?.textElements || [];

  // Canvas size (same as editor / preview)
  const canvasWidth = invitation.content?.canvasSize?.width || 480;
  const canvasHeight = invitation.content?.canvasSize?.height || 680;

  const handleDownloadPNG = async () => {
    const previewElement = document.getElementById('invitation-preview');
    if (!previewElement || !invitation) return;

    setIsExporting(true);
    try {
      const blob = await pdfService.exportToImage(previewElement, 5);
      if (blob) {
        pdfService.downloadImage(blob, `${invitation.title || 'davetiye'}.png`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      {/* Draft Banner - Modern */}
      {invitation.status !== 'published' && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200/50 backdrop-blur-sm py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="bg-amber-200 rounded-full p-1.5">
                <span className="text-amber-700 text-xs">⚠️</span>
              </div>
              <p className="text-amber-900">
                <strong className="font-semibold">Önizleme Modu:</strong> Bu davetiye henüz yayınlanmamış
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions - Minimal & Sticky */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
            >
              <span className="text-base">←</span>
              <span className="hidden sm:inline">Ana Sayfa</span>
            </button>
            {/* Paylaş + PNG indirme (editör tuvali ile birebir aynı) */}
            {/* FREE: Sadece PNG indirme, PRO/PREMIUM: Paylaş + PNG */}
            {invitation.status === 'published' && (
              <div className="flex items-center gap-2">
                {/* Share button - PRO ve PREMIUM planlar için */}
                {invitation.owner_subscription_tier !== 'free' && (
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-600 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Paylaş</span>
                  </button>
                )}
                {/* PNG download - Tüm planlar için */}
                <button
                  onClick={handleDownloadPNG}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow disabled:opacity-50"
                  title="PNG olarak indir"
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">PNG</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Compact */}
      <div className="py-6 sm:py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Invitation Preview - Minimal Card (same size & style as editor canvas) */}
          <div
            id="invitation-preview"
            className="shadow-2xl rounded-lg overflow-hidden relative mx-auto"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              maxWidth: '100%'
            }}
          >
            {/* Background (same as editor canvas) */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: invitation.image_url && invitation.content?.imagePosition === 'background'
                  ? `url(${invitation.image_url})`
                  : invitation.content?.colors
                    ? `linear-gradient(135deg, ${invitation.content.colors.primary} 0%, ${invitation.content.colors.secondary} 100%)`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            {/* Gradient overlay for background image (same as editor) */}
            {invitation.content?.imagePosition === 'background' && invitation.image_url && (
              <div
                className="absolute inset-0"
                style={{
                  background: invitation.content?.colors
                    ? `linear-gradient(135deg, ${invitation.content.colors.primary}CC 0%, ${invitation.content.colors.secondary}CC 100%)`
                    : 'linear-gradient(135deg, #667eeaCC 0%, #764ba2CC 100%)',
                  zIndex: 1
                }}
              />
            )}

            {/* FREE Plan watermark kaldırıldı */}

            {/* QR Code - Dynamic Position */}
            {qrMedia?.qr_image_url && invitation.settings?.showQrOnDesign && (
              <img
                src={qrMedia.qr_image_url}
                alt="QR"
                style={{
                  width: `${invitation.settings?.qrSize || 96}px`,
                  height: `${invitation.settings?.qrSize || 96}px`,
                  zIndex: 1000,
                  imageRendering: 'pixelated'
                }}
                className={
                  `absolute bg-white p-2 rounded-md shadow-md ` +
                  (invitation.settings?.qrPosition === 'top-left' ? 'top-4 left-4' : '') +
                  (invitation.settings?.qrPosition === 'top-right' ? 'top-4 right-4' : '') +
                  (invitation.settings?.qrPosition === 'bottom-left' ? 'bottom-4 left-4' : '') +
                  (invitation.settings?.qrPosition === 'bottom-right' ? 'bottom-4 right-4' : '')
                }
                crossOrigin="anonymous"
              />
            )}

            {/* Main content container - All positioned elements here (no padding, same coord system as editor) */}
            <div className="absolute inset-0" style={{ zIndex: 2 }}>
              {/* Profile Image - positioned with transforms (supports rotation) */}
              {invitation.content?.imagePosition === 'profile' && invitation.image_url && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${invitation.content?.imageTransforms?.profile?.position.x || 50}%`,
                    top: `${invitation.content?.imageTransforms?.profile?.position.y || 15}%`,
                    transform: `translate(-50%, -50%) rotate(${invitation.content?.imageTransforms?.profile?.rotation || 0}deg)`,
                    zIndex: invitation.content?.imageLayers?.profile || 200
                  }}
                >
                  <div
                    style={{
                      width: `${invitation.content?.imageTransforms?.profile?.size.width || 160}px`,
                      height: `${invitation.content?.imageTransforms?.profile?.size.height || 160}px`,
                      borderRadius: '50%',
                      border: `4px solid ${colors.accent}`,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <img
                      src={invitation.image_url}
                      alt="Profil"
                      className="w-full h-full object-cover"
                      style={{
                        imageRendering: 'auto',
                        WebkitFontSmoothing: 'antialiased',
                        backfaceVisibility: 'hidden'
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              )}

              {/* Banner Image - positioned with transforms (supports rotation) */}
              {invitation.content?.imagePosition === 'banner' && invitation.image_url && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${invitation.content?.imageTransforms?.banner?.position.x || 50}%`,
                    top: `${invitation.content?.imageTransforms?.banner?.position.y || 8}%`,
                    transform: `translate(-50%, -50%) rotate(${invitation.content?.imageTransforms?.banner?.rotation || 0}deg)`,
                    zIndex: invitation.content?.imageLayers?.banner || 200,
                    width: `${invitation.content?.imageTransforms?.banner?.size.width || 600}px`,
                    height: `${invitation.content?.imageTransforms?.banner?.size.height || 200}px`, // match editor default
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <img
                    src={invitation.image_url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                    style={{
                      imageRendering: 'auto',
                      WebkitFontSmoothing: 'antialiased',
                      backfaceVisibility: 'hidden'
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Watermark - positioned with transforms */}
              {invitation.content?.imagePosition === 'watermark' && invitation.image_url && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${invitation.content?.imageTransforms?.watermark?.position.x || 90}%`,
                    top: `${invitation.content?.imageTransforms?.watermark?.position.y || 90}%`,
                    transform: `translate(-50%, -50%) rotate(${invitation.content?.imageTransforms?.watermark?.rotation || 0}deg)`,
                    zIndex: invitation.content?.imageLayers?.watermark || 200,
                    width: `${invitation.content?.imageTransforms?.watermark?.size.width || 64}px`,
                    height: `${invitation.content?.imageTransforms?.watermark?.size.height || 64}px`,
                    borderRadius: invitation.content?.logoShape === 'circle' ? '50%' : '0',
                    overflow: 'hidden',
                    opacity: 0.6
                  }}
                >
                  <img
                    src={invitation.image_url}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    style={{
                      imageRendering: 'auto',
                      WebkitFontSmoothing: 'antialiased',
                      backfaceVisibility: 'hidden'
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              {/* Text Elements - Generic rendering (same as editor canvas / preview) */}
              {textElements && textElements.length > 0 && textElements.map((elem: any) => {
                if (!elem.visible) return null;

                const isDivider = elem.type === 'divider';
                const opacity = elem.opacity ?? 1;

                const wrapperStyle: React.CSSProperties = {
                  position: 'absolute',
                  left: `${elem.position.x}%`,
                  top: `${elem.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isDivider ? `${elem.size.width}px` : 'auto',
                  maxWidth: `${elem.size.width}px`,
                  zIndex: elem.zIndex || 300,
                  pointerEvents: 'none',
                  opacity
                };

                let content: React.ReactNode;

                if (isDivider) {
                  content = (
                    <div
                      style={{
                        width: '100%',
                        height: `${elem.size.height}px`,
                        backgroundColor: elem.style?.color || colors.accent,
                        borderRadius: '2px'
                      }}
                    />
                  );
                } else {
                  content = (
                    <div
                      style={{
                        fontSize: `${elem.style?.fontSize || 16}px`,
                        fontWeight: elem.style?.fontWeight || 'normal',
                        fontFamily: elem.style?.fontFamily || selectedFont,
                        color: elem.style?.color || colors.text,
                        textAlign: elem.style?.textAlign || 'center',
                        fontStyle: elem.style?.fontStyle || 'normal',
                        textDecoration: elem.style?.textDecoration || 'none',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {elem.content}
                    </div>
                  );
                }

                return (
                  <div key={elem.id} style={wrapperStyle}>
                    {content}
                  </div>
                );
              })}

              {/* V2: Dynamic Text Fields - Positioned */}
              {invitation.content?.textFields && Array.isArray(invitation.content.textFields) && invitation.content.textFields.length > 0 && invitation.content.textFields.map((field: any) => (
                field.value && field.position && field.size && (
                  <div
                    key={field.id}
                    style={{
                      position: 'absolute',
                      left: `${field.position.x}%`,
                      top: `${field.position.y}%`,
                      width: 'auto',
                      maxWidth: `${field.size.width}px`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${field.style?.fontSize || 24}px`,
                      fontWeight: field.style?.fontWeight || 'normal',
                      color: field.style?.color || colors.text,
                      textAlign: field.style?.textAlign || 'center',
                      fontFamily: field.style?.fontFamily || selectedFont,
                      zIndex: field.zIndex || 310,
                      pointerEvents: 'none'
                    }}
                  >
                    {field.value}
                  </div>
                )
              ))}

              {/* V2: Decorative Elements - Positioned with zIndex */}
              {invitation.content?.decorativeElements && Array.isArray(invitation.content.decorativeElements) && invitation.content.decorativeElements.length > 0 && invitation.content.decorativeElements.map((elem: any) => (
                <div
                  key={elem.id}
                  style={{
                    position: 'absolute',
                    left: `${elem.position.x}%`,
                    top: `${elem.position.y}%`,
                    width: `${elem.size.width}px`,
                    height: `${elem.size.height}px`,
                    transform: `translate(-50%, -50%) rotate(${elem.rotation}deg)`,
                    opacity: elem.opacity,
                    zIndex: elem.zIndex || 250,
                    pointerEvents: 'none'
                  }}
                >
                  <img
                    src={elem.imageUrl}
                    alt={elem.name}
                    className="w-full h-full object-contain"
                    draggable={false}
                    style={{
                      imageRendering: 'auto',
                      WebkitFontSmoothing: 'antialiased',
                      backfaceVisibility: 'hidden'
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
            </div>
          </div> {/* end of invitation-preview */}

          {/* Footer Info - Minimal (outside of invitation card) */}
          <div className="mt-6 space-y-3">
            {/* davetim.app etiketi - FREE planlar için */}
            {invitation.owner_subscription_tier === 'free' && (
              <div className="flex items-center justify-center">
                <a
                  href="https://davetim.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-gray-200 shadow-sm hover:shadow-md hover:bg-white transition-all text-xs font-semibold text-gray-800"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                    D
                  </span>
                  <span>davetim.app ile hazırlandı</span>
                </a>
              </div>
            )}

            {/* Genel footer bilgisi */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 p-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center">
                  <a href="/" className="flex items-center gap-2 group">
                    <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center group-hover:shadow-md transition-all">
                      <span className="text-white font-bold text-sm">D</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      Davetim
                    </span>
                  </a>
                </div>
                <div className="pt-2 border-t border-gray-200/50">
                  <p className="text-xs text-gray-600">
                    Kendi davetiyenizi oluşturmak için{' '}
                    <a
                      href="/auth"
                      className="text-primary-600 hover:text-primary-700 font-semibold transition-colors inline-flex items-center gap-0.5"
                    >
                      ücretsiz kayıt olun
                      <span className="text-sm">→</span>
                    </a>
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

export default PublicInvitationPage;
