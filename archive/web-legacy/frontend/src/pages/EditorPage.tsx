import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Eye, Save, Palette, Loader2, FileText, Users, QrCode, Sparkles, Plus, AlignCenter, Type } from 'lucide-react';
import { mediaService, type Media } from '../services/mediaService';
import { templateService, type Template } from '../services/templateService';
import { invitationService, type Invitation } from '../services/invitationService';
import { useAuth } from '../store/authStore';
import { useSubscription } from '../hooks/useSubscription';
import { pdfService } from '../services/pdfService';
import PreviewModal from '../components/Editor/PreviewModal';
import ColorPicker from '../components/Editor/ColorPicker';
import ImageUpload from '../components/Editor/ImageUpload';
import GuestList from '../components/Editor/GuestList';
import { DraggableElement } from '../components/Editor/DraggableElement';
import { DecorativeElementsGallery } from '../components/Editor/DecorativeElementsGallery';
import { AccordionSection } from '../components/Editor/AccordionSection';
import toast from 'react-hot-toast';
import { validateTitle, validateLocation, validateTime, validateFutureDate } from '../utils/validation';
import { ALL_FONTS, type FontFamily, getFontFamily } from '../utils/fonts';
import { getTemplateFullUrl } from '../utils/templateImageUrl';

const EditorPage: React.FC = () => {
  const { templateId: invitationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const subscription = useSubscription();

  // State
  const [template, setTemplate] = useState<Template | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'guests'>('details');
  const [qrMedia, setQrMedia] = useState<Media | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  // Use ref to prevent duplicate creation across re-renders
  const isCreatingRef = useRef(false);
  const hasCreatedRef = useRef(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    eventDate: '',
    eventTime: '',
    location: '',
    customMessage: '',
    imageUrl: '' as string | null,
    imagePosition: 'profile' as 'profile' | 'background' | 'banner' | 'watermark',
    logoShape: 'circle' as 'circle' | 'square'
  });

  // Color customization
  const [colors, setColors] = useState({
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#ffffff',
    text: '#ffffff',
    accent: '#f56565'
  });

  // Store template's original design for reset
  const [templateOriginalDesign, setTemplateOriginalDesign] = useState<{
    colors?: typeof colors;
    imageUrl?: string | null;
    imagePosition?: typeof formData.imagePosition;
  } | null>(null);

  const [selectedFont, setSelectedFont] = useState<FontFamily>('Playfair Display');
  const [showQrOnDesign, setShowQrOnDesign] = useState(false);
  const [qrPosition, setQrPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  const [qrSize, setQrSize] = useState<number>(96);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Accordion states for compact UI
  const [expandedSections, setExpandedSections] = useState({
    colors: false,
    fonts: false,
    textFields: true,
    decorative: false,
    alignment: false,
    textElements: false,
    qr: false
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // V2: Dynamic text fields from template
  const [textFields, setTextFields] = useState<Array<{
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
  }>>([]);
  
  // V2: Decorative elements from template
  const [decorativeElements, setDecorativeElements] = useState<Array<{
    id: string;
    type: string;
    name: string;
    imageUrl: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    opacity: number;
    zIndex?: number;
  }>>([]);
  
  // CANVA-STYLE: All text elements with full control (position, size, content, style)
  const [textElements, setTextElements] = useState<Array<{
    id: string;
    type: 'title' | 'date' | 'time' | 'location' | 'message' | 'divider' | 'footer';
    content: string; // Dynamic content - will be synced with form inputs
    position: { x: number; y: number };
    size: { width: number; height: number };
    style: {
      fontSize?: number;
      fontWeight?: string;
      color?: string;
      textAlign?: 'left' | 'center' | 'right';
      fontFamily?: string;
    };
    visible: boolean;
    zIndex?: number;
  }>>([
    { id: 'title', type: 'title', content: '', position: { x: 50, y: 25 }, size: { width: 400, height: 80 }, style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' }, visible: true, zIndex: 300 },
    { id: 'date-time', type: 'date', content: '', position: { x: 50, y: 40 }, size: { width: 350, height: 60 }, style: { fontSize: 16, textAlign: 'center' }, visible: true, zIndex: 300 },
    { id: 'divider-1', type: 'divider', content: '', position: { x: 50, y: 50 }, size: { width: 100, height: 4 }, style: {}, visible: true, zIndex: 300 },
    { id: 'location', type: 'location', content: '', position: { x: 50, y: 58 }, size: { width: 350, height: 40 }, style: { fontSize: 16, textAlign: 'center' }, visible: true, zIndex: 300 },
    { id: 'message', type: 'message', content: '', position: { x: 50, y: 68 }, size: { width: 400, height: 80 }, style: { fontSize: 14, textAlign: 'center' }, visible: true, zIndex: 300 },
    { id: 'divider-2', type: 'divider', content: '', position: { x: 50, y: 78 }, size: { width: 80, height: 4 }, style: {}, visible: true, zIndex: 300 },
    { id: 'footer', type: 'footer', content: 'Sizleri aramızda görmekten mutluluk duyarız', position: { x: 50, y: 85 }, size: { width: 400, height: 30 }, style: { fontSize: 12, textAlign: 'center' }, visible: true, zIndex: 300 }
  ]);
  
  // Image layer ordering per mode
  const [imageLayers, setImageLayers] = useState<{ profile: number; banner: number; watermark: number }>({
    profile: 260,
    banner: 240,
    watermark: 280
  });
  // Image transforms for draggable/resizable image (excluding background)
  const [imageTransforms, setImageTransforms] = useState<{
    profile: { position: { x: number; y: number }; size: { width: number; height: number } };
    banner: { position: { x: number; y: number }; size: { width: number; height: number } };
    watermark: { position: { x: number; y: number }; size: { width: number; height: number } };
  }>({
    profile: { position: { x: 50, y: 15 }, size: { width: 160, height: 160 } },
    banner: { position: { x: 50, y: 8 }, size: { width: 600, height: 200 } },
    watermark: { position: { x: 90, y: 90 }, size: { width: 64, height: 64 } }
  });


  // Form validation errors
  const [errors, setErrors] = useState({
    title: '',
    eventDate: '',
    eventTime: '',
    location: ''
  });

  // Load template or invitation
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Davetiye oluşturmak için giriş yapmalısınız');
      navigate('/auth');
      return;
    }
    
    // Subscription yüklenene kadar bekle
    if (subscription.isLoading && user?.id) {
      return;
    }
    
    loadData();
  }, [invitationId, searchParams, isAuthenticated, subscription.isLoading, user?.id]);


  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // Check if we're editing an existing invitation
      if (invitationId) {
        const invitationData = await invitationService.getInvitation(invitationId);
        
        if (!invitationData) {
          toast.error('Davetiye bulunamadı');
          navigate('/dashboard');
          return;
        }
        
        setInvitation(invitationData);
        // Load existing QR media (optional)
        try {
          const media = await mediaService.getMediaByInvitationId(invitationData.id);
          setQrMedia(media);
        } catch {}
        setTemplate(invitationData.template);
        
        console.log('📝 Loading invitation data...');
        console.log('📸 Invitation image_url:', invitationData.image_url);
        console.log('📍 Invitation imagePosition:', invitationData.content?.imagePosition);
        
        // Store template's original design for reset functionality (V2 Schema)
        if (invitationData.template) {
          // V2: Use color_palette and default_image_url/thumbnail_url
          const templateImageUrl = getTemplateFullUrl(
            invitationData.template.default_image_url || invitationData.template.thumbnail_url
          );
          const templateImagePosition = 'background';
          const templateColors = invitationData.template.color_palette ? {
            primary: invitationData.template.color_palette.primary || '#667eea',
            secondary: invitationData.template.color_palette.secondary || '#764ba2',
            background: invitationData.template.color_palette.background || '#ffffff',
            text: invitationData.template.color_palette.text || '#ffffff',
            accent: invitationData.template.color_palette.accent || '#f56565'
          } : undefined;
          
          setTemplateOriginalDesign({
            colors: templateColors,
            imageUrl: templateImageUrl,
            imagePosition: templateImagePosition
          });
        }
        
        // Load invitation data into form
        setFormData({
          title: invitationData.title || '',
          eventDate: invitationData.event_date?.split('T')[0] || '',
          eventTime: invitationData.event_time || '',
          location: invitationData.event_location_name || '',
          customMessage: invitationData.content?.message || '',
          imageUrl: invitationData.image_url || null,
          imagePosition: invitationData.content?.imagePosition || 'profile',
          logoShape: invitationData.content?.logoShape === 'square' ? 'square' : 'circle'
        });
        
        // Load colors if exists
        if (invitationData.content?.colors) {
          setColors(invitationData.content.colors);
        }
        
        // Load QR settings if exists
        if (invitationData.settings) {
          if (typeof invitationData.settings.showQrOnDesign === 'boolean') {
            setShowQrOnDesign(invitationData.settings.showQrOnDesign);
          }
          if (invitationData.settings.qrPosition) {
            setQrPosition(invitationData.settings.qrPosition);
          }
          if (invitationData.settings.qrSize) {
            setQrSize(invitationData.settings.qrSize);
          }
        }
        
        // V2: Load text fields from saved invitation
        if (invitationData.content?.textFields && Array.isArray(invitationData.content.textFields)) {
          setTextFields(invitationData.content.textFields);
          console.log('📝 Loaded saved text fields:', invitationData.content.textFields);
        } else if (invitationData.template?.text_fields) {
          // Fallback to template text fields if not saved yet - with default position/size
          const loadedTextFields = invitationData.template.text_fields.map((field: any, index: number) => ({
            id: field.id || `field-${Date.now()}-${Math.random()}`,
            label: field.label || 'Text Field',
            value: field.defaultValue || '',
            position: { x: 50, y: 50 + (index * 10) }, // Default center, stacked vertically
            size: { width: 400, height: 60 },
            zIndex: 310 + index,
            style: field.style || {}
          }));
          setTextFields(loadedTextFields);
          console.log('📝 Loaded template text fields:', loadedTextFields);
        }
        
        // V2: Load decorative elements from saved invitation ONLY
        if (invitationData.content?.decorativeElements && Array.isArray(invitationData.content.decorativeElements)) {
          // Filter out old elements without imageUrl (backward compatibility)
          const validElements = invitationData.content.decorativeElements
            .filter((elem: any) => elem.imageUrl && elem.name)
            .map((elem: any, i: number) => ({ ...elem, zIndex: typeof elem.zIndex === 'number' ? elem.zIndex : 250 + i }));
          setDecorativeElements(validElements);
          console.log('🎨 Loaded saved decorative elements:', validElements);
        } else {
          // Don't load template decorative elements automatically - user should add them manually
          setDecorativeElements([]);
          console.log('🎨 No decorative elements - user will add manually');
        }
        
        // CANVA-STYLE: Load text element positions AND content if saved
        if (invitationData.content?.textElements && Array.isArray(invitationData.content.textElements)) {
          const loaded = invitationData.content.textElements.map((e: any) => ({
            ...e,
            zIndex: typeof e.zIndex === 'number' ? e.zIndex : 300,
            // Ensure content is synced with form data
            content: e.type === 'title' ? (invitationData.title || e.content || '') :
                     e.type === 'location' ? (invitationData.event_location_name || e.content || '') :
                     e.type === 'message' ? (invitationData.content?.message || e.content || '') :
                     e.content || ''
          }));
          setTextElements(loaded);
          console.log('📍 Loaded saved text elements with content:', loaded);
        } else {
          // Initialize textElements content from form data
          setTextElements(prev => prev.map(el => ({
            ...el,
            content: el.type === 'title' ? (invitationData.title || '') :
                     el.type === 'location' ? (invitationData.event_location_name || '') :
                     el.type === 'message' ? (invitationData.content?.message || '') :
                     el.content
          })));
        }
        
        // Load image layers if saved
        if (invitationData.content?.imageLayers) {
          setImageLayers({
            profile: invitationData.content.imageLayers.profile ?? 260,
            banner: invitationData.content.imageLayers.banner ?? 240,
            watermark: invitationData.content.imageLayers.watermark ?? 280
          });
        }
        
        // Load image transforms if saved
        if (invitationData.content?.imageTransforms) {
          setImageTransforms(prev => ({
            profile: invitationData.content.imageTransforms.profile || prev.profile,
            banner: invitationData.content.imageTransforms.banner || prev.banner,
            watermark: invitationData.content.imageTransforms.watermark || prev.watermark
          }));
          console.log('🖼️ Loaded saved image transforms:', invitationData.content.imageTransforms);
        }
        
      } else {
        // Creating new invitation from template
        const templateSlug = searchParams.get('template');
        
        if (!templateSlug) {
          toast.error('Şablon seçilmedi');
          navigate('/templates');
          return;
        }
        
        // Prevent duplicate creation using ref (persists across re-renders)
        if (isCreatingRef.current || hasCreatedRef.current) {
          console.log('⏸️ Already creating/created invitation, skipping...');
          return;
        }
        
        isCreatingRef.current = true;
        console.log('✨ Creating new invitation for template:', templateSlug);
        
        // V2: templateSlug is actually template ID now
        const templateData = await templateService.getTemplateById(templateSlug);
        
        if (!templateData) {
          toast.error('Şablon bulunamadı');
          navigate('/templates');
          isCreatingRef.current = false;
          return;
        }
        
        // Şablon erişim kontrolü - Kullanıcının bu tier'a erişimi var mı?
        const templateTier = templateData.tier as 'free' | 'pro' | 'premium';
        const canAccess = subscription.canAccessTemplate(templateTier);
        
        if (!canAccess) {
          const tierNames = { free: 'Ücretsiz', pro: 'PRO', premium: 'PREMIUM' };
          toast.error(`Bu şablon ${tierNames[templateTier]} plan gerektirir!`);
          navigate('/templates');
          isCreatingRef.current = false;
          return;
        }
        
        setTemplate(templateData);
        
        // V2: Load template design from color_palette
        const templateColorPalette = templateData.color_palette || {};
        console.log('🎨 Template color palette:', templateColorPalette);
        
        // Apply template colors if exists
        const templateColors = {
          primary: templateColorPalette.primary || '#667eea',
          secondary: templateColorPalette.secondary || '#764ba2',
          background: templateColorPalette.background || '#ffffff',
          text: templateColorPalette.text || '#ffffff',
          accent: templateColorPalette.accent || '#f56565'
        };
        
        setColors(templateColors);
        
        // V2: Load text fields from template
        if (templateData.text_fields && Array.isArray(templateData.text_fields)) {
          const loadedTextFields = templateData.text_fields.map((field: any, index: number) => ({
            id: field.id || `field-${Date.now()}-${Math.random()}`,
            label: field.label || 'Text Field',
            value: field.defaultValue || '',
            // Default position/size/zIndex so they are consistent across editor, public view and exports
            position: field.position || { x: 50, y: 50 + (index * 10) },
            size: field.size || { width: 400, height: 60 },
            zIndex: typeof field.zIndex === 'number' ? field.zIndex : 310 + index,
            style: {
              fontSize: field.style?.fontSize || 24,
              fontWeight: field.style?.fontWeight || 'normal',
              color: field.style?.color || templateColors.text,
              textAlign: field.style?.textAlign || 'center',
              fontFamily: field.style?.fontFamily || 'Playfair Display'
            }
          }));
          setTextFields(loadedTextFields);
          console.log('📝 Loaded text fields:', loadedTextFields);
        }
        
        // V2: Don't load decorative elements from template automatically
        // User should add them manually from the gallery
        setDecorativeElements([]);
        console.log('🎨 Decorative elements empty - user will add manually from gallery');
        
        // V2: Use default_image_url or thumbnail_url with Storage helper
        const templateImageUrl = getTemplateFullUrl(templateData.default_image_url || templateData.thumbnail_url);
        const templateImagePosition = 'background'; // Default position
        
        // Store original design for reset
        setTemplateOriginalDesign({
          colors: templateColors,
          imageUrl: templateImageUrl,
          imagePosition: templateImagePosition
        });
        
        console.log('📸 Template image URL:', templateImageUrl);
        console.log('📍 Template image position:', templateImagePosition);
        
        // Set default form data with template info
        setFormData({
          title: `${templateData.category || 'Etkinlik'} Davetiyesi`,
          eventDate: '',
          eventTime: '',
          location: '',
          customMessage: `${templateData.name} ile hazırlanan özel davetiyenize hoş geldiniz.`,
          imageUrl: templateImageUrl,
          imagePosition: templateImagePosition,
          logoShape: 'circle'
        });
        
        // Create new invitation with template design
        const newInvitation = await invitationService.createInvitation({
          template_id: templateData.id,
          title: `${templateData.category || 'Etkinlik'} Davetiyesi`,
          event_type: templateData.category || '',
          image_url: templateImageUrl,
          content: {
            colors: templateColors,
            imagePosition: templateImagePosition,
            logoShape: 'circle',
            message: `${templateData.name} ile hazırlanan özel davetiyenize hoş geldiniz.`
          }
        });
        
        console.log('✅ New invitation created with image_url:', newInvitation?.image_url);
        
        if (newInvitation) {
          setInvitation(newInvitation);
          hasCreatedRef.current = true; // Mark as created
          isCreatingRef.current = false;
          console.log('✅ Invitation created, redirecting...');
          // Redirect to edit URL
          navigate(`/editor/${newInvitation.id}`, { replace: true });
        } else {
          isCreatingRef.current = false;
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // CANVA-STYLE: Sync form inputs with textElements content
    if (name === 'title') {
      setTextElements(prev => prev.map(el => 
        el.type === 'title' ? { ...el, content: value } : el
      ));
    } else if (name === 'location') {
      setTextElements(prev => prev.map(el => 
        el.type === 'location' ? { ...el, content: value } : el
      ));
    } else if (name === 'customMessage') {
      setTextElements(prev => prev.map(el => 
        el.type === 'message' ? { ...el, content: value } : el
      ));
    }

    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Real-time validation on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    switch (name) {
      case 'title':
        const titleResult = validateTitle(value, 3, 40);
        newErrors.title = titleResult.isValid ? '' : titleResult.error!;
        break;
      case 'eventDate':
        const dateResult = validateFutureDate(value);
        newErrors.eventDate = dateResult.isValid ? '' : dateResult.error!;
        break;
      case 'eventTime':
        const timeResult = validateTime(value);
        newErrors.eventTime = timeResult.isValid ? '' : timeResult.error!;
        break;
      case 'location':
        const locationResult = validateLocation(value);
        newErrors.location = locationResult.isValid ? '' : locationResult.error!;
        break;
    }

    setErrors(newErrors);
  };

  // Validate form before saving
  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      eventDate: '',
      eventTime: '',
      location: ''
    };

    // Title validation (required)
    const titleResult = validateTitle(formData.title, 3, 40);
    if (!titleResult.isValid) {
      newErrors.title = titleResult.error!;
    }

    // Date validation (optional, but must be future if provided)
    if (formData.eventDate) {
      const dateResult = validateFutureDate(formData.eventDate);
      if (!dateResult.isValid) {
        newErrors.eventDate = dateResult.error!;
      }
    }

    // Time validation (optional, but must be valid format if provided)
    if (formData.eventTime) {
      const timeResult = validateTime(formData.eventTime);
      if (!timeResult.isValid) {
        newErrors.eventTime = timeResult.error!;
      }
    }

    // Location validation (optional)
    if (formData.location) {
      const locationResult = validateLocation(formData.location);
      if (!locationResult.isValid) {
        newErrors.location = locationResult.error!;
      }
    }

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    
    if (hasErrors) {
      const firstError = Object.values(newErrors).find(error => error !== '');
      toast.error(firstError || 'Lütfen formu kontrol edin', { duration: 5000 });
    }

    return !hasErrors;
  };

  const handleSave = async () => {
    if (!invitation) return;
    
    // Validate form before saving
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updated = await invitationService.updateInvitation(invitation.id, {
        title: formData.title,
        event_date: formData.eventDate || undefined,
        event_time: formData.eventTime || undefined,
        event_location_name: formData.location || undefined,
        image_url: formData.imageUrl || undefined,
        content: {
          message: formData.customMessage,
          colors: colors,
          imagePosition: formData.imagePosition,
          logoShape: formData.logoShape,
          imageLayers: imageLayers,
          imageTransforms: imageTransforms,
          // V2: Save text fields, decorative elements, and text positioning
          textFields: textFields,
          decorativeElements: decorativeElements,
          textElements: textElements
        },
        custom_design: {
          font: selectedFont
        },
        settings: {
          showQrOnDesign: showQrOnDesign,
          qrPosition: qrPosition,
          qrSize: qrSize
        }
      });
      
      if (updated) {
        setInvitation(updated);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleDownload = async () => {
    if (!invitation) return;
    
    // Save first
    await handleSave();
    
    // Then open preview modal for download
    setIsPreviewOpen(true);
  };

  const handleTogglePublish = async () => {
    if (!invitation || !user) return;
    
    const newStatus = invitation.status === 'published' ? 'draft' : 'published';
    const statusText = newStatus === 'published' ? 'yayınlandı' : 'taslağa alındı';
    
    // Yayınlama sırasında kullanım hakkı kontrolü (FREE ve PRO için)
    if (newStatus === 'published' && invitation.status === 'draft') {
      // PREMIUM kullanıcılar sınırsız, kontrol yapma
      if (subscription.currentPlan !== 'premium') {
        const canCreate = await subscription.canCreateInvitation();
        
        if (!canCreate.allowed) {
          toast.error(canCreate.reason || 'Davetiye yayınlama hakkınız kalmadı!');
          navigate('/pricing');
          return;
        }
      }
    }
    
    try {
      const updated = await invitationService.updateInvitation(invitation.id, {
        status: newStatus
      });
      
      if (updated) {
        setInvitation(updated);
        
        // Yayınlama başarılı, subscription'ı güncelle
        if (newStatus === 'published' && invitation.status === 'draft') {
          // Refresh subscription to get updated counters
          await subscription.refreshSubscription();
          toast.success('Davetiye yayınlandı');
        } else {
          toast.success(`Davetiye ${statusText}`);
        }
      }
    } catch (error) {
      toast.error('Status güncellenemedi');
    }
  };

  const handleShare = () => {
    if (invitation?.id) {
      pdfService.copyShareLink(invitation.id);
    }
  };

  const handleResetToTemplate = () => {
    if (!templateOriginalDesign) {
      toast.error('Şablon bilgisi bulunamadı');
      return;
    }

    // Reset colors
    if (templateOriginalDesign.colors) {
      setColors(templateOriginalDesign.colors);
    }

    // Reset image
    setFormData({
      ...formData,
      imageUrl: templateOriginalDesign.imageUrl || null,
      imagePosition: templateOriginalDesign.imagePosition || 'background'
    });

    toast.success('Şablon varsayılanlarına dönüldü');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!template || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Davetiye bulunamadı</p>
          <button onClick={() => navigate('/templates')} className="btn-primary">
            Şablonlara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      {/* Header - Modern & Minimalist */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back Button & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                title="Dashboard'a Dön"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">
                  {template.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {invitation.status === 'draft' && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Taslak</span>}
                  {invitation.status === 'published' && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Yayında</span>}
                  {invitation.updated_at && <span>• {new Date(invitation.updated_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons - Responsive */}
            <div className="flex items-center gap-2">
              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 sm:px-4 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                title="Kaydet"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
              
              {/* Publish/Unpublish Button */}
              <button
                onClick={handleTogglePublish}
                className={`p-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  invitation.status === 'published' 
                    ? 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100' 
                    : 'bg-primary-50 text-primary-700 border border-primary-300 hover:bg-primary-100'
                }`}
                title={invitation.status === 'published' ? 'Yayında' : 'Yayınla'}
              >
                {invitation.status === 'published' ? '✓' : '📝'}
                <span className="hidden md:inline">{invitation.status === 'published' ? 'Yayında' : 'Yayınla'}</span>
              </button>
              
              {/* Preview Button */}
              <button
                onClick={handlePreview}
                className="p-2 sm:px-3 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                title="Önizle"
              >
                <Eye className="h-4 w-4" />
              </button>
              
              {/* Share Button */}
              <button
                onClick={invitation.status === 'published' ? handleShare : undefined}
                disabled={invitation.status !== 'published'}
                className={`p-2 sm:px-3 sm:py-2 rounded-lg transition-all ${
                  invitation.status === 'published'
                    ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                    : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                }`}
                title={invitation.status === 'published' ? 'Paylaş' : 'Paylaşmak için önce yayınlayın'}
              >
                <Share2 className="h-4 w-4" />
              </button>
              
              {/* Download Button */}
              <button
                onClick={invitation.status === 'published' ? handleDownload : undefined}
                disabled={invitation.status !== 'published'}
                className={`p-2 rounded-lg transition-all shadow-sm ${
                  invitation.status === 'published'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white hover:shadow-md cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={invitation.status === 'published' ? 'İndir' : 'İndirmek için önce yayınlayın'}
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Editor Panel - Modern & Minimalist */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            {/* Tabs - Modern Design */}
            <div className="bg-gray-50/50 border-b border-gray-200/50">
              <div className="flex p-2 gap-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all ${
                    activeTab === 'details'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Davetiye</span>
                </button>
                <button
                  onClick={() => setActiveTab('guests')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all ${
                    activeTab === 'guests'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Davetliler</span>
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-3">
              {/* Title - Compact */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  ✏️ Etkinlik Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm ${
                    errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Örn: Sevgi & Ahmet Düğünü"
                  maxLength={40}
                  required
                />
                {errors.title ? (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.title}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/40 karakter
                  </p>
                )}
              </div>

              {/* Date & Time - Compact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5">
                    📅 Tarih
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm ${
                      errors.eventDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.eventDate && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {errors.eventDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5">
                    🕐 Saat
                  </label>
                  <input
                    type="time"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm ${
                      errors.eventTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.eventTime && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {errors.eventTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Location - Compact */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  📍 Konum / Adres
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm ${
                    errors.location ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Örn: Grand Hotel, İstanbul"
                  maxLength={60}
                />
                {errors.location ? (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.location}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.location.length}/60 karakter
                  </p>
                )}
              </div>

              {/* Custom Message - Compact */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  💬 Özel Mesaj <span className="text-gray-500 text-xs font-normal">(İsteğe bağlı)</span>
                </label>
                <textarea
                  name="customMessage"
                  value={formData.customMessage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none text-sm"
                  rows={3}
                  placeholder="Örn: Mutluluğumuzu paylaşmak istiyoruz"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.customMessage.length}/100 karakter
                </p>
              </div>

              {/* Image Upload - Compact */}
              {invitation && user && (
                <div className="border-t border-gray-200/50 pt-4">
                  <ImageUpload
                    invitationId={invitation.id}
                    userId={user.id}
                    currentImageUrl={formData.imageUrl}
                    currentPosition={formData.imagePosition}
                    currentLogoShape={formData.logoShape}
                    onImageUploaded={(imageUrl) => {
                      setFormData({ ...formData, imageUrl });
                    }}
                    onImageRemoved={() => {
                      setFormData({ ...formData, imageUrl: null });
                    }}
                    onPositionChange={(position) => {
                      setFormData({ ...formData, imagePosition: position });
                    }}
                    onLogoShapeChange={(shape) => {
                      setFormData({ ...formData, logoShape: shape });
                    }}
                  />
                </div>
              )}

              {/* Reset to Template Button - Compact */}
              {templateOriginalDesign && (
                <div className="border-t border-gray-200/50 pt-4">
                  <button
                    onClick={handleResetToTemplate}
                    className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-200 rounded-lg p-1.5">
                        <Palette className="h-3.5 w-3.5 text-amber-700" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-amber-900">Varsayılana Dön</p>
                        <p className="text-xs text-amber-700">Şablonun orijinal tasarımı</p>
                      </div>
                    </div>
                    <span className="text-amber-700 group-hover:text-amber-900 transition-colors text-lg">↻</span>
                  </button>
                </div>
              )}

              {/* Color Customization - Accordion */}
              <AccordionSection
                id="colors"
                title="Renk Özelleştirme"
                icon={Palette}
                isExpanded={expandedSections.colors}
                onToggle={() => toggleSection('colors')}
              >
                <ColorPicker
                  colors={colors}
                  onChange={setColors}
                  defaultColors={templateOriginalDesign?.colors}
                />
              </AccordionSection>

              {/* Font Selection - Accordion */}
              <AccordionSection
                id="fonts"
                title="Yazı Tipi"
                icon={FileText}
                isExpanded={expandedSections.fonts}
                onToggle={() => toggleSection('fonts')}
              >
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value as FontFamily)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white hover:border-gray-300"
                  style={{ fontFamily: getFontFamily(selectedFont) }}
                >
                  {ALL_FONTS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: getFontFamily(font) }}>
                      {font}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Seçilen yazı tipi davetiye metninde kullanılacak
                </p>
              </AccordionSection>

              {/* V2: Dynamic Text Fields - Accordion (PRO/PREMIUM only) */}
              {textFields.length > 0 && (subscription.currentPlan === 'pro' || subscription.currentPlan === 'premium') && (
                <AccordionSection
                  id="textFields"
                  title="Metin Alanları (Dinamik)"
                  icon={FileText}
                  badge={subscription.currentPlan === 'premium' ? 'PREMIUM' : 'PRO'}
                  badgeColor="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                  isExpanded={expandedSections.textFields}
                  onToggle={() => toggleSection('textFields')}
                >
                  <div className="space-y-3">
                    {textFields.map((field, index) => (
                      <div key={field.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        {/* Visibility Toggle & Label */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.value !== ''}
                              onChange={() => {
                                const newFields = [...textFields];
                                if (field.value === '') {
                                  // If empty, restore default value
                                  newFields[index].value = field.label;
                                } else {
                                  // If has value, clear it
                                  newFields[index].value = '';
                                }
                                setTextFields(newFields);
                                toast.success(field.value === '' ? '✅ Alan gösteriliyor' : '👁️ Alan gizlendi', { duration: 2000 });
                              }}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />
                            <label className="text-xs font-bold text-gray-900">
                              {field.label}
                            </label>
                          </div>
                          {field.value !== '' && field.style.fontSize && (
                            <span className="text-xs text-gray-500 font-mono">
                              {field.style.fontSize}px
                            </span>
                          )}
                        </div>

                        {/* Text Input */}
                        {field.value !== '' && (
                          <>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...textFields];
                                newFields[index].value = e.target.value;
                                setTextFields(newFields);
                              }}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                              placeholder={`${field.label} girin...`}
                              style={{ fontFamily: field.style.fontFamily || getFontFamily(selectedFont) }}
                            />

                            {/* Font Size Slider */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 min-w-[50px]">Boyut:</span>
                              <input
                                type="range"
                                min={12}
                                max={48}
                                value={field.style.fontSize || 24}
                                onChange={(e) => {
                                  const newFields = [...textFields];
                                  newFields[index].style.fontSize = Number(e.target.value);
                                  setTextFields(newFields);
                                }}
                                className="flex-1 h-2 accent-primary-600 cursor-pointer"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    💡 Checkbox ile göster/gizle, slider ile boyut ayarla
                  </p>
                </AccordionSection>
              )}

              {/* V2: Decorative Elements Panel (PREMIUM only) */}
              {/* Alignment Toolbar - Accordion */}
              <AccordionSection
                id="alignment"
                title="Hizalama"
                icon={AlignCenter}
                badge={selectedElementId ? "Seçili" : "Öğe seçin"}
                badgeColor={selectedElementId ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}
                isExpanded={expandedSections.alignment}
                onToggle={() => toggleSection('alignment')}
              >
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={!selectedElementId}
                    onClick={() => {
                      if (!selectedElementId || !previewContainerRef.current) return;
                      setTextElements(prev => prev.map(el => 
                        el.id === selectedElementId ? { ...el, position: { ...el.position, x: 20 } } : el
                      ));
                      setTextFields(prev => prev.map(f => 
                        f.id === selectedElementId && f.position ? { ...f, position: { ...f.position, x: 20 } } : f
                      ));
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Sola
                  </button>
                  <button
                    type="button"
                    disabled={!selectedElementId}
                    onClick={() => {
                      if (!selectedElementId) return;
                      setTextElements(prev => prev.map(el => 
                        el.id === selectedElementId ? { ...el, position: { ...el.position, x: 50 } } : el
                      ));
                      setTextFields(prev => prev.map(f => 
                        f.id === selectedElementId && f.position ? { ...f, position: { ...f.position, x: 50 } } : f
                      ));
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Ortala
                  </button>
                  <button
                    type="button"
                    disabled={!selectedElementId}
                    onClick={() => {
                      if (!selectedElementId) return;
                      setTextElements(prev => prev.map(el => 
                        el.id === selectedElementId ? { ...el, position: { ...el.position, x: 80 } } : el
                      ));
                      setTextFields(prev => prev.map(f => 
                        f.id === selectedElementId && f.position ? { ...f, position: { ...f.position, x: 80 } } : f
                      ));
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Sağa
                  </button>
                  <button
                    type="button"
                    disabled={!selectedElementId}
                    onClick={() => {
                      if (!selectedElementId) return;
                      setTextElements(prev => prev.map(el => 
                        el.id === selectedElementId ? { ...el, position: { ...el.position, y: 15 } } : el
                      ));
                      setTextFields(prev => prev.map(f => 
                        f.id === selectedElementId && f.position ? { ...f, position: { ...f.position, y: 15 } } : f
                      ));
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Üste
                  </button>
                  <button
                    type="button"
                    disabled={!selectedElementId}
                    onClick={() => {
                      if (!selectedElementId) return;
                      setTextElements(prev => prev.map(el => 
                        el.id === selectedElementId ? { ...el, position: { ...el.position, y: 50 } } : el
                      ));
                      setTextFields(prev => prev.map(f => 
                        f.id === selectedElementId && f.position ? { ...f, position: { ...f.position, y: 50 } } : f
                      ));
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Orta
                  </button>
                  <button
                    type="button"
                    disabled={!selectedElementId}
                    onClick={() => {
                      if (!selectedElementId) return;
                      setTextElements(prev => prev.map(el => 
                        el.id === selectedElementId ? { ...el, position: { ...el.position, y: 85 } } : el
                      ));
                      setTextFields(prev => prev.map(f => 
                        f.id === selectedElementId && f.position ? { ...f, position: { ...f.position, y: 85 } } : f
                      ));
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Alta
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-gray-500">
                  Bir öğeye tıklayıp seçin, sonra hizalama butonlarını kullanın.
                </p>
              </AccordionSection>

              {/* Text Elements Visibility & Font Size Control - Accordion */}
              <AccordionSection
                id="textElements"
                title="Metin Alanları (Standart)"
                icon={Type}
                isExpanded={expandedSections.textElements}
                onToggle={() => toggleSection('textElements')}
              >
                <div className="space-y-2">
                  {textElements.map((elem) => (
                    <div key={elem.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={elem.visible}
                          onChange={() => {
                            const newElements = [...textElements];
                            const index = newElements.findIndex(e => e.id === elem.id);
                            if (index !== -1) {
                              newElements[index].visible = !newElements[index].visible;
                              setTextElements(newElements);
                              toast.success(newElements[index].visible ? '✅ Metin gösteriliyor' : '👁️ Metin gizlendi', { duration: 2000 });
                            }
                          }}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-xs font-medium text-gray-700 min-w-[80px]">
                          {elem.type === 'title' && '📝 Başlık'}
                          {elem.type === 'date' && '📅 Tarih'}
                          {elem.type === 'location' && '📍 Konum'}
                          {elem.type === 'message' && '💬 Mesaj'}
                          {elem.type === 'divider' && '➖ Çizgi'}
                          {elem.type === 'footer' && '👥 Footer'}
                        </span>
                      </div>
                      {elem.type !== 'divider' && elem.style.fontSize && (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={10}
                            max={elem.type === 'title' ? 48 : elem.type === 'footer' ? 14 : 24}
                            value={elem.style.fontSize || 16}
                            onChange={(e) => {
                              const newElements = [...textElements];
                              const index = newElements.findIndex(el => el.id === elem.id);
                              if (index !== -1) {
                                newElements[index].style.fontSize = Number(e.target.value);
                                setTextElements(newElements);
                              }
                            }}
                            className="w-16 h-1 accent-primary-600 cursor-pointer"
                            title={`Font boyutu: ${elem.style.fontSize}px`}
                          />
                          <span className="text-xs font-mono text-gray-600 w-9 text-right">{elem.style.fontSize}px</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-2 bg-blue-50/50 rounded-lg border border-blue-200/30">
                  <p className="text-xs text-gray-600">
                    💡 <strong>İpucu:</strong> Önizlemede metinlere tıklayarak konumlarını değiştirebilirsiniz
                  </p>
                </div>
              </AccordionSection>

              {subscription.currentPlan === 'premium' && (
                <AccordionSection
                  id="decorative"
                  title="Dekoratif Öğeler"
                  icon={Sparkles}
                  badge="PREMIUM"
                  badgeColor="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                  isExpanded={expandedSections.decorative}
                  onToggle={() => toggleSection('decorative')}
                  defaultPadding={false}
                >
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => setIsGalleryOpen(true)}
                      className="w-full mb-3 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-xs font-semibold flex items-center justify-center gap-2"
                      title="Öğe Galerisi"
                    >
                      <Plus className="h-4 w-4" />
                      Öğe Ekle
                    </button>

                  {decorativeElements.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-semibold text-purple-600">{decorativeElements.length}</span> öğe eklendi
                      </p>
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <p className="text-xs text-gray-700 font-medium mb-1">
                          💡 Nasıl Kullanılır?
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• Önizlemede öğeye <strong>tıklayın</strong></li>
                          <li>• <strong>Sürükleyerek</strong> konumlandırın</li>
                          <li>• Köşeden <strong>boyutlandırın</strong></li>
                          <li>• Döndürme butonuyla <strong>çevirin</strong></li>
                          <li>• Sil butonuyla <strong>kaldırın</strong></li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 text-center">
                      <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">
                        Henüz dekoratif öğe eklenmedi
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        "Öğe Ekle" butonuna tıklayın
                      </p>
                    </div>
                  )}
                  </div>
                </AccordionSection>
              )}

              {/* QR Media (Optional) - Accordion */}
              <AccordionSection
                id="qr"
                title="QR Medya (Opsiyonel)"
                icon={QrCode}
                badge={qrMedia ? "Oluşturuldu" : "Boş"}
                badgeColor={qrMedia ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}
                isExpanded={expandedSections.qr}
                onToggle={() => toggleSection('qr')}
                defaultPadding={false}
              >
                <div className="px-3 pb-3">
                  {qrMedia && (
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={invitation.status === 'published' ? () => navigate(`/media/manage?invitationId=${invitation.id}`) : undefined}
                        disabled={invitation.status !== 'published'}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs ${
                          invitation.status === 'published'
                            ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-primary-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={invitation.status === 'published' ? 'QR Medya Yönet' : 'Yayınlamadan QR yönetilemez'}
                      >
                        Yönet
                      </button>
                      <button
                        onClick={invitation.status === 'published' ? () => navigate(`/media/upload?invitationId=${invitation.id}`) : undefined}
                        disabled={invitation.status !== 'published'}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs shadow-sm ${
                          invitation.status === 'published'
                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white hover:shadow-md'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={invitation.status === 'published' ? 'QR Medya Güncelle' : 'Yayınlamadan QR güncellenemez'}
                      >
                        Güncelle
                      </button>
                    </div>
                  )}
                
                {qrMedia ? (
                  <div className="mt-3 p-3 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl border border-purple-200/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 mb-0.5">QR Kod</p>
                        <p className="font-mono text-xs text-gray-600 truncate">{qrMedia.qr_code}</p>
                      </div>
                      {qrMedia.qr_image_url && (
                        <img src={qrMedia.qr_image_url} alt="QR" className="w-16 h-16 object-contain rounded-lg bg-white p-1 shadow-sm ml-3" />
                      )}
                    </div>
                    
                    {/* Stats - Compact */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 pb-3 border-b border-purple-200/30">
                      <span className="flex items-center gap-1">
                        📦 {qrMedia.storage_plan === '1_year' ? '1 yıl' : '3 ay'}
                      </span>
                      <span className="flex items-center gap-1">
                        👁️ {qrMedia.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        📱 {qrMedia.scan_count}
                      </span>
                    </div>

                    {/* Guest Upload Status */}
                    <div className="mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        qrMedia.allow_guest_upload 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {qrMedia.allow_guest_upload ? '✓ Davetli yüklemeleri açık' : '✗ Davetli yüklemeleri kapalı'}
                      </span>
                    </div>

                    {/* Show QR on Design Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={showQrOnDesign} 
                        onChange={() => setShowQrOnDesign(!showQrOnDesign)}
                        className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-primary-500 transition-all"
                      />
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                        Davetiyede QR kodu göster
                      </span>
                    </label>

                    {/* QR Position & Size - Compact */}
                    {showQrOnDesign && (
                      <div className="mt-3 pt-3 border-t border-purple-200/30 space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">Konum</label>
                          <select
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-xs"
                            value={qrPosition}
                            onChange={(e) => setQrPosition(e.target.value as any)}
                          >
                            <option value="top-left">Sol Üst</option>
                            <option value="top-right">Sağ Üst</option>
                            <option value="bottom-left">Sol Alt</option>
                            <option value="bottom-right">Sağ Alt</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Boyut: <span className="text-primary-600">{qrSize}px</span>
                          </label>
                          <input
                            type="range"
                            min={72}
                            max={160}
                            step={4}
                            value={qrSize}
                            onChange={(e) => setQrSize(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>72px</span>
                            <span>160px</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-lg border border-amber-200/30">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg">ℹ️</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900 mb-1">
                          QR Medya Henüz Oluşturulmadı
                        </p>
                        <p className="text-xs text-gray-600">
                          {invitation.status === 'published' 
                            ? 'QR medya oluşturarak davetlilerinizin fotoğraf ve video paylaşmasını sağlayabilirsiniz.' 
                            : 'QR medya oluşturmak için önce davetiyeyi yayınlamanız gerekiyor.'}
                        </p>
                      </div>
                    </div>
                    {invitation.status === 'published' && (
                      <button
                        onClick={() => navigate(`/media/upload?invitationId=${invitation.id}`)}
                        className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all text-xs"
                      >
                        QR Medya Oluştur
                      </button>
                    )}
                  </div>
                )}
                </div>
              </AccordionSection>
                </div>
              )}

              {/* Guests Tab */}
              {activeTab === 'guests' && invitation && (
                <GuestList 
                  invitationId={invitation.id}
                  invitationTitle={invitation.title}
                  invitationStatus={invitation.status}
                />
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-lg shadow p-6 relative" style={{ zIndex: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Önizleme
              </h2>
              <div className="text-sm text-gray-500">
                A4 Format - Yazdırmaya Hazır
              </div>
            </div>

            {/* Live Preview - unified invitation canvas size */}
            <div 
              ref={previewContainerRef}
              className="rounded-lg shadow-lg relative mx-auto"
              style={{
                minHeight: '600px',
                maxWidth: '480px',
                width: '100%',
                backgroundImage: formData.imagePosition === 'background' && formData.imageUrl
                  ? `url(${formData.imageUrl})` 
                  : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* V2: Decorative Elements - Draggable (only when preview/gallery is closed) */}
              {!isPreviewOpen && !isGalleryOpen && decorativeElements.map((elem, index) => (
                <DraggableElement
                  key={elem.id}
                  id={elem.id}
                  type="decoration"
                  imageUrl={elem.imageUrl}
                  zIndex={elem.zIndex ?? 250 + index}
                  position={elem.position}
                  size={elem.size}
                  rotation={elem.rotation}
                  opacity={elem.opacity}
                  onUpdate={(updates) => {
                    const newElements = [...decorativeElements];
                    if (updates.position) newElements[index].position = updates.position;
                    if (updates.size) newElements[index].size = updates.size;
                    if (updates.rotation !== undefined) newElements[index].rotation = updates.rotation;
                    if (updates.opacity !== undefined) newElements[index].opacity = updates.opacity;
                    setDecorativeElements(newElements);
                  }}
                  onChangeZ={(action) => {
                    const allZ = [
                      ...decorativeElements.map(e => e.zIndex ?? 250),
                      ...textElements.map(e => e.zIndex ?? 300),
                      imageLayers.profile,
                      imageLayers.banner,
                      imageLayers.watermark
                    ];
                    const maxZ = Math.max(...allZ);
                    const minZ = Math.min(...allZ);
                    const newElements = [...decorativeElements];
                    newElements[index].zIndex = action === 'front' ? maxZ + 1 : minZ - 1;
                    setDecorativeElements(newElements);
                  }}
                  onDelete={() => {
                    setDecorativeElements(decorativeElements.filter(e => e.id !== elem.id));
                    toast.success('Grafik kaldırıldı');
                  }}
                  containerRef={previewContainerRef}
                />
              ))}
              
              {/* Show QR on design */}
              {showQrOnDesign && qrMedia?.qr_image_url && (
                <img
                  src={qrMedia.qr_image_url}
                  alt="QR"
                  style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
                  className={
                    `absolute bg-white p-2 rounded-md shadow ` +
                    (qrPosition === 'top-left' ? 'top-4 left-4' : '') +
                    (qrPosition === 'top-right' ? 'top-4 right-4' : '') +
                    (qrPosition === 'bottom-left' ? 'bottom-4 left-4' : '') +
                    (qrPosition === 'bottom-right' ? 'bottom-4 right-4' : '')
                  }
                />
              )}
              {/* Gradient overlay for background image */}
              {formData.imagePosition === 'background' && formData.imageUrl && (
                <div 
                  className="absolute inset-0" 
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}CC 0%, ${colors.secondary}CC 100%)`,
                    zIndex: 1
                  }}
                />
              )}
              
              {/* Draggable main image (Profile/Banner/Watermark) - only when preview/gallery is closed */}
              {!isPreviewOpen && !isGalleryOpen && formData.imageUrl && formData.imagePosition !== 'background' && (() => {
                const currentMode = formData.imagePosition as 'profile' | 'banner' | 'watermark';
                const t = imageTransforms[currentMode];
                return (
                  <DraggableElement
                    id={`main-image-${currentMode}`}
                    type="decoration"
                    imageUrl={formData.imageUrl}
                    imageFit="cover"
                    zIndex={imageLayers[currentMode]}
                    position={t.position}
                    size={t.size}
                    rotation={0}
                    opacity={currentMode === 'watermark' ? 0.6 : 1}
                    onUpdate={(updates) => {
                      setImageTransforms(prev => ({
                        ...prev,
                        [currentMode]: {
                          position: updates.position || prev[currentMode].position,
                          size: updates.size || prev[currentMode].size
                        }
                      }));
                    }}
                    onChangeZ={(action) => {
                      const allZ = [
                        ...decorativeElements.map(e => e.zIndex ?? 250),
                        ...textElements.map(e => e.zIndex ?? 300),
                        imageLayers.profile,
                        imageLayers.banner,
                        imageLayers.watermark
                      ];
                      const maxZ = Math.max(...allZ);
                      const minZ = Math.min(...allZ);
                      setImageLayers(prev => ({
                        ...prev,
                        [currentMode]: action === 'front' ? maxZ + 1 : minZ - 1
                      }));
                    }}
                    onDelete={() => {
                      setFormData({ ...formData, imageUrl: null });
                      toast.success('Görsel kaldırıldı');
                    }}
                    containerRef={previewContainerRef}
                    style={{
                      borderRadius: currentMode === 'profile'
                        ? '50%'
                        : (currentMode === 'watermark'
                          ? (formData.logoShape === 'circle' ? '50%' : '0')
                          : '8px'),
                      border: currentMode === 'profile' ? `4px solid ${colors.accent}` : 'none',
                      overflow: 'hidden'
                    }}
                  />
                );
              })()}
              
              <div className="p-8 md:p-12 flex items-center justify-center min-h-[600px] relative">
                <div className="text-center space-y-4 max-w-sm">
                
                {/* DRAGGABLE TEXT ELEMENTS (only when preview/gallery is closed) */}
                {!isPreviewOpen && !isGalleryOpen && textElements.map((elem) => {
                  if (!elem.visible) return null;
                  
                  let content: React.ReactNode = null;
                  
                  // Title - CANVA-STYLE: Use elem.content (synced with formData)
                  if (elem.type === 'title') {
                    content = (
                      <div 
                        className="font-bold whitespace-pre-wrap"
                        style={{ 
                          color: colors.text, 
                          fontFamily: getFontFamily(selectedFont),
                          fontSize: `${elem.style.fontSize || 32}px`,
                          fontWeight: elem.style.fontWeight || 'bold',
                          textAlign: elem.style.textAlign || 'center'
                        }}
                      >
                        {elem.content || formData.title || 'Etkinlik Başlığı'}
                      </div>
                    );
                  }
                  
                  // Date & Time
                  else if (elem.type === 'date') {
                    content = (
                      <div 
                        className="p-4 rounded-lg"
                        style={{ 
                          backgroundColor: colors.background,
                          color: colors.primary,
                          fontFamily: getFontFamily(selectedFont),
                          fontSize: `${elem.style.fontSize || 16}px`,
                          textAlign: elem.style.textAlign || 'center'
                        }}
                      >
                        <div className="font-medium">
                          {formData.eventDate ? new Date(formData.eventDate).toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Tarih Seçin'}
                        </div>
                        <div className="mt-1">
                          {formData.eventTime || 'Saat Seçin'}
                        </div>
                      </div>
                    );
                  }
                  
                  // Location - CANVA-STYLE: Use elem.content
                  else if (elem.type === 'location') {
                    content = (
                      <div 
                        style={{ 
                          color: colors.text, 
                          opacity: 0.95, 
                          fontFamily: getFontFamily(selectedFont),
                          fontSize: `${elem.style.fontSize || 16}px`,
                          textAlign: elem.style.textAlign || 'center'
                        }}
                      >
                        {elem.content || formData.location || 'Konum Belirtin'}
                      </div>
                    );
                  }
                  
                  // Message - CANVA-STYLE: Use elem.content, show if content exists
                  else if (elem.type === 'message' && (elem.content || formData.customMessage)) {
                    content = (
                      <div 
                        className="italic p-4 rounded-lg"
                        style={{ 
                          backgroundColor: colors.background,
                          color: colors.primary,
                          border: `2px solid ${colors.accent}`,
                          fontFamily: getFontFamily(selectedFont),
                          fontSize: `${elem.style.fontSize || 14}px`,
                          textAlign: elem.style.textAlign || 'center'
                        }}
                      >
                        "{elem.content || formData.customMessage}"
                      </div>
                    );
                  }
                  
                  // Divider (horizontal line)
                  else if (elem.type === 'divider') {
                    content = (
                      <div 
                        className="rounded-full"
                        style={{ 
                          backgroundColor: colors.accent,
                          width: `${elem.size.width}px`,
                          height: `${elem.size.height}px`
                        }}
                      />
                    );
                  }
                  
                  // Footer
                  else if (elem.type === 'footer') {
                    content = (
                      <div 
                        style={{ 
                          color: colors.text, 
                          opacity: 0.9, 
                          fontFamily: getFontFamily(selectedFont),
                          fontSize: `${elem.style.fontSize || 12}px`,
                          textAlign: elem.style.textAlign || 'center'
                        }}
                      >
                        {elem.content || 'Sizleri aramızda görmekten mutluluk duyarız'}
                      </div>
                    );
                  }
                  
                  // Don't render message if it's empty - CANVA-STYLE: Check elem.content
                  if (elem.type === 'message' && !elem.content && !formData.customMessage) return null;
                  
                  return (
                    <DraggableElement
                      key={elem.id}
                      id={elem.id}
                      type="text"
                      content={content}
                      zIndex={elem.zIndex ?? 300}
                      position={elem.position}
                      size={elem.size}
                      rotation={0}
                      opacity={1}
                      resizeMode={elem.type === 'divider' ? 'horizontal' : 'both'}
                      isSelected={selectedElementId === elem.id}
                      onSelect={(id) => setSelectedElementId(id)}
                      onUpdate={(updates) => {
                        const newElements = [...textElements];
                        const index = newElements.findIndex(e => e.id === elem.id);
                        if (index !== -1) {
                          if (updates.position) newElements[index].position = updates.position;
                          if (updates.size) newElements[index].size = updates.size;
                          setTextElements(newElements);
                        }
                      }}
                    onChangeZ={(action) => {
                      const allZ = [
                        ...decorativeElements.map(e => e.zIndex ?? 250),
                        ...textElements.map(e => e.zIndex ?? 300),
                        imageLayers.profile,
                        imageLayers.banner,
                        imageLayers.watermark
                      ];
                      const maxZ = Math.max(...allZ);
                      const minZ = Math.min(...allZ);
                      const newElements = [...textElements];
                      const idx = newElements.findIndex(e => e.id === elem.id);
                      if (idx !== -1) {
                        newElements[idx].zIndex = action === 'front' ? maxZ + 1 : minZ - 1;
                        setTextElements(newElements);
                      }
                    }}
                      onDelete={() => {
                        const newElements = [...textElements];
                        const index = newElements.findIndex(e => e.id === elem.id);
                        if (index !== -1) {
                          newElements[index].visible = false;
                          setTextElements(newElements);
                          toast.success('Metin alanı gizlendi');
                        }
                      }}
                      containerRef={previewContainerRef}
                    />
                  );
                })}

              {/* V2: Dynamic Text Fields (PRO/PREMIUM templates) - Draggable & Resizable */}
              {!isPreviewOpen && !isGalleryOpen && textFields.length > 0 && textFields.map((field, index) => {
                if (!field.value) return null;

                // Use saved position/size if available, otherwise fall back to deterministic defaults
                const position = field.position || { x: 50, y: 50 + (index * 10) };
                const size = field.size || { width: 400, height: 60 };
                const zIndex = typeof field.zIndex === 'number' ? field.zIndex : 310 + index;
                
                return (
                  <DraggableElement
                    key={field.id}
                    id={field.id}
                    type="text"
                    content={
                      <div
                        style={{
                          fontSize: `${field.style.fontSize}px`,
                          fontWeight: field.style.fontWeight,
                          color: field.style.color || colors.text,
                          textAlign: field.style.textAlign,
                          fontFamily: field.style.fontFamily || getFontFamily(selectedFont),
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {field.value}
                      </div>
                    }
                    zIndex={zIndex}
                    position={position}
                    size={size}
                    rotation={0}
                    opacity={1}
                    resizeMode="both"
                    onUpdate={(updates) => {
                      const newFields = [...textFields];
                      if (updates.position) newFields[index].position = updates.position;
                      if (updates.size) newFields[index].size = updates.size;
                      setTextFields(newFields);
                    }}
                    onChangeZ={(action) => {
                      const allZ = [
                        ...decorativeElements.map(e => e.zIndex ?? 250),
                        ...textElements.map(e => e.zIndex ?? 300),
                        ...textFields.map(f => f.zIndex ?? 310),
                        imageLayers.profile,
                        imageLayers.banner,
                        imageLayers.watermark
                      ];
                      const maxZ = Math.max(...allZ);
                      const minZ = Math.min(...allZ);
                      const newFields = [...textFields];
                      newFields[index].zIndex = action === 'front' ? maxZ + 1 : minZ - 1;
                      setTextFields(newFields);
                    }}
                    onDelete={() => {
                      const newFields = [...textFields];
                      newFields[index].value = ''; // Clear value instead of delete
                      setTextFields(newFields);
                      toast.success('Metin alanı temizlendi');
                    }}
                    isSelected={selectedElementId === field.id}
                    onSelect={(id) => setSelectedElementId(id)}
                    containerRef={previewContainerRef}
                  />
                );
              })}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              ⚡ Gerçek zamanlı önizleme - Değişiklikler anında görünür
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        invitation={invitation}
        invitationData={{
          title: formData.title,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          location: formData.location,
          message: formData.customMessage,
          imageUrl: formData.imageUrl,
          imagePosition: formData.imagePosition
        }}
        colors={colors}
        qrData={showQrOnDesign && qrMedia?.qr_image_url ? {
          qrImageUrl: qrMedia.qr_image_url,
          qrPosition: qrPosition,
          qrSize: qrSize
        } : null}
        textFields={textFields}
        decorativeElements={decorativeElements}
        textElements={textElements}
        logoShape={formData.logoShape}
        imageTransforms={imageTransforms}
        imageLayers={imageLayers}
        selectedFont={selectedFont}
      />

      {/* Decorative Elements Gallery */}
      <DecorativeElementsGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectGraphic={(graphic) => {
          const newElement = {
            id: `graphic-${Date.now()}`,
            type: graphic.category,
            name: graphic.name,
            imageUrl: graphic.imageUrl,
            position: { x: 50, y: 50 },
            size: graphic.defaultSize,
            rotation: 0,
            opacity: 1
          };
          setDecorativeElements([...decorativeElements, newElement]);
          toast.success(`${graphic.name} eklendi! Önizlemede sürükleyerek konumlandırın.`, {
            icon: '✨',
            duration: 3000
          });
        }}
      />
    </div>
  );
};

export default EditorPage;
