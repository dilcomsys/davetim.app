import React, { useRef, useState } from 'react';
import { X, Download, Share2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { pdfService } from '../../services/pdfService';
import type { Invitation } from '../../services/invitationService';
import { useSubscription } from '../../hooks/useSubscription';
import { SocialShareButtons } from '../Invitation/SocialShareButtons';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: Invitation | null;
  invitationData: {
    title: string;
    eventDate: string;
    eventTime: string;
    location: string;
    message: string;
    imageUrl?: string | null;
    imagePosition?: 'profile' | 'background' | 'banner' | 'watermark';
  };
  colors?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  qrData?: {
    qrImageUrl: string;
    qrPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    qrSize: number;
  } | null;
  textFields?: Array<{
    id: string;
    label: string;
    value: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    zIndex?: number;
    style: {
      fontSize: number;
      fontWeight: string;
      color: string;
      textAlign: 'left' | 'center' | 'right';
      fontFamily?: string;
    };
  }>;
  decorativeElements?: Array<{
    id: string;
    type: string;
    name: string;
    imageUrl: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    opacity: number;
    zIndex?: number;
  }>;
  textElements?: Array<{
    id: string;
    type: string;
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style: any;
    visible: boolean;
    zIndex?: number;
    opacity?: number;
  }>;
  logoShape?: 'circle' | 'square';
  imageTransforms?: {
    profile?: { position: { x: number; y: number }; size: { width: number; height: number }; rotation?: number; opacity?: number };
    banner?: { position: { x: number; y: number }; size: { width: number; height: number }; rotation?: number; opacity?: number };
    watermark?: { position: { x: number; y: number }; size: { width: number; height: number }; rotation?: number; opacity?: number };
  };
  imageLayers?: {
    profile?: number;
    banner?: number;
    watermark?: number;
  };
  selectedFont?: string;
  canvasSize?: { width: number; height: number };
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  invitation,
  invitationData,
  colors = {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#ffffff',
    text: '#ffffff',
    accent: '#f56565'
  },
  qrData = null,
  textFields = [],
  decorativeElements = [],
  textElements = [],
  logoShape = 'circle',
  imageTransforms,
  imageLayers,
  selectedFont = 'Playfair Display',
  canvasSize
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const subscription = useSubscription();

  if (!isOpen) return null;

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    try {
      const targetWidth = canvasSize?.width;
      const targetHeight = canvasSize?.height;

      await pdfService.exportAndDownload(previewRef.current, {
        filename: `${invitationData.title || 'davetiye'}.pdf`,
        quality: 4,
        orientation: 'portrait',
        matchCanvasSize: true,
        targetWidth,
        targetHeight
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    try {
      const targetWidth = canvasSize?.width;
      const targetHeight = canvasSize?.height;
      const blob = await pdfService.exportToImage(previewRef.current, 5, targetWidth, targetHeight);
      if (blob) {
        pdfService.downloadImage(blob, `${invitationData.title || 'davetiye'}.png`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    if (!invitation?.id) return;
    
    // PRO+ kullanıcılar için sosyal medya modal'ı göster
    if (subscription.planConfig?.limits.socialMediaSharing) {
      setShowShareModal(true);
    } else {
      // Free kullanıcılar için sadece link kopyala
      pdfService.copyShareLink(invitation.id);
    }
  };

  const isDraft = invitation?.status !== 'published';

  // Canvas dimensions (fall back to portrait if not provided)
  const canvasWidth = canvasSize?.width || 480;
  const canvasHeight = canvasSize?.height || 680;

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/70 backdrop-blur-sm">
      {/* Backdrop - Modern blur */}
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />

      {/* Modal - Modern & Minimalist - Full screen on mobile */}
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[100vh] sm:max-h-[90vh] overflow-hidden mx-auto border-0 sm:border border-gray-200/50 flex flex-col">
          {/* Close button - Modern - Fixed position for mobile */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2.5 bg-white/95 backdrop-blur-sm rounded-full sm:rounded-xl shadow-lg hover:bg-gray-100 transition-all"
            aria-label="Kapat"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* Header - Modern & Compact */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white">
            <div className="pr-12">
              <h2 className="text-base sm:text-xl font-bold text-gray-900">
                Önizleme
              </h2>
              {isDraft && (
                <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                  <span>⚠️</span> Taslak
                </p>
              )}
            </div>
          </div>

          {/* Preview Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-gray-50 flex items-center justify-center">
            {/* Unified invitation canvas size in preview (same as editor canvas) */}
            <div 
              ref={previewRef}
              className="bg-white rounded-lg shadow-2xl overflow-hidden mx-auto relative"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                maxWidth: 'calc(100vw - 24px)',
                transform: 'scale(1)',
                transformOrigin: 'center center',
                backgroundImage: invitationData.imagePosition === 'background' && invitationData.imageUrl
                  ? `url(${invitationData.imageUrl})`
                  : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Gradient overlay for background image */}
              {invitationData.imagePosition === 'background' && invitationData.imageUrl && (
                <div 
                  className="absolute inset-0" 
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}CC 0%, ${colors.secondary}CC 100%)`,
                    zIndex: 1
                  }}
                />
              )}

              {/* QR Code - Dynamic Position (always on top) */}
              {qrData?.qrImageUrl && (
                <img
                  src={qrData.qrImageUrl}
                  alt="QR"
                  style={{ 
                    width: `${qrData.qrSize}px`, 
                    height: `${qrData.qrSize}px`,
                    zIndex: 1000,
                    imageRendering: 'pixelated'
                  }}
                  className={
                    `absolute bg-white p-2 rounded-md shadow-md ` +
                    (qrData.qrPosition === 'top-left' ? 'top-4 left-4' : '') +
                    (qrData.qrPosition === 'top-right' ? 'top-4 right-4' : '') +
                    (qrData.qrPosition === 'bottom-left' ? 'bottom-4 left-4' : '') +
                    (qrData.qrPosition === 'bottom-right' ? 'bottom-4 right-4' : '')
                  }
                  crossOrigin="anonymous"
                />
              )}
              
              {/* Main content container - All positioned elements here (no padding, same coord system as editor) */}
              <div className="absolute inset-0" style={{ zIndex: 2 }}>
                {/* Profile Image - positioned with transforms (always circular) */}
                {invitationData.imagePosition === 'profile' && invitationData.imageUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${imageTransforms?.profile?.position.x || 50}%`,
                      top: `${imageTransforms?.profile?.position.y || 15}%`,
                    transform: `translate(-50%, -50%) rotate(${imageTransforms?.profile?.rotation || 0}deg)`,
                    zIndex: imageLayers?.profile || 200
                    }}
                  >
                    <div
                      style={{
                        width: `${imageTransforms?.profile?.size.width || 160}px`,
                        height: `${imageTransforms?.profile?.size.height || 160}px`,
                        borderRadius: '50%',
                        border: `4px solid ${colors.accent}`,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    >
                      <img
                        src={invitationData.imageUrl}
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

                {/* Banner Image - positioned with transforms */}
                {invitationData.imagePosition === 'banner' && invitationData.imageUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${imageTransforms?.banner?.position.x || 50}%`,
                      top: `${imageTransforms?.banner?.position.y || 8}%`,
                    transform: `translate(-50%, -50%) rotate(${imageTransforms?.banner?.rotation || 0}deg)`,
                    zIndex: imageLayers?.banner || 200,
                    width: `${imageTransforms?.banner?.size.width || 600}px`,
                    height: `${imageTransforms?.banner?.size.height || 200}px`, // match editor default
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <img
                      src={invitationData.imageUrl}
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

                {/* Watermark - positioned with transforms (circle/square via logoShape) */}
                {invitationData.imagePosition === 'watermark' && invitationData.imageUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${imageTransforms?.watermark?.position.x || 90}%`,
                      top: `${imageTransforms?.watermark?.position.y || 90}%`,
                      transform: `translate(-50%, -50%) rotate(${imageTransforms?.watermark?.rotation || 0}deg)`,
                      zIndex: imageLayers?.watermark || 200,
                      width: `${imageTransforms?.watermark?.size.width || 64}px`,
                      height: `${imageTransforms?.watermark?.size.height || 64}px`,
                      borderRadius: logoShape === 'circle' ? '50%' : '0',
                      overflow: 'hidden',
                      opacity: 0.6
                    }}
                  >
                    <img
                      src={invitationData.imageUrl}
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


              {/* Text Elements - Generic rendering (same logic as editor canvas) */}
              {textElements && textElements.length > 0 && textElements.map((elem) => {
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

                {/* V2: Dynamic Text Fields (PRO/PREMIUM templates) - Positioned */}
                {textFields && textFields.length > 0 && textFields.map((field) => (
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
                {decorativeElements && decorativeElements.length > 0 && decorativeElements.map((elem) => (
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

            </div>
          </div>

        {/* Actions - Mobile-First Grid Layout */}
        <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
          {/* Draft Warning - Mobile Optimized */}
          {isDraft && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 text-center font-medium">
                ⚠️ Yayınlamadan paylaşım ve indirme yapılamaz
              </p>
            </div>
          )}
          
          {/* Action Buttons - 3 Column Grid on Mobile */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Share Button */}
            <button
              onClick={isDraft ? undefined : handleShare}
              disabled={isDraft || !invitation?.id}
              className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 sm:py-3.5 rounded-xl font-medium transition-all ${
                isDraft || !invitation?.id
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
              }`}
              title={isDraft ? 'Paylaşmak için önce yayınlayın' : 'Paylaş'}
            >
              <Share2 className="h-5 w-5 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-semibold">Paylaş</span>
            </button>

            {/* PNG Export Button */}
            <button
              onClick={isDraft ? undefined : handleExportImage}
              disabled={isDraft || isExporting}
              className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 sm:py-3.5 rounded-xl font-medium transition-all ${
                isDraft || isExporting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
              title={isDraft ? 'İndirmek için önce yayınlayın' : 'PNG olarak indir'}
            >
              {isExporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5 sm:h-5 sm:w-5" />
              )}
              <span className="text-xs sm:text-sm font-semibold">PNG</span>
            </button>

            {/* PDF Export Button */}
            <button
              onClick={isDraft ? undefined : handleExportPDF}
              disabled={isDraft || isExporting}
              className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 sm:py-3.5 rounded-xl font-medium transition-all ${
                isDraft || isExporting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg'
              }`}
              title={isDraft ? 'İndirmek için önce yayınlayın' : 'PDF olarak indir'}
            >
              {isExporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5 sm:h-5 sm:w-5" />
              )}
              <span className="text-xs sm:text-sm font-semibold">PDF</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Share Modal - PRO+ Feature - Mobile Optimized */}
      {showShareModal && invitation?.id && (
        <div className="fixed inset-0 z-[10001] overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setShowShareModal(false)}
          />
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-4 sm:p-6 animate-scale-in">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="pt-2">
                <SocialShareButtons
                  invitationUrl={`${window.location.origin}/i/${invitation.id}`}
                  title={invitationData.title}
                  message={invitationData.message || 'Size özel davetiyem!'}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewModal;
