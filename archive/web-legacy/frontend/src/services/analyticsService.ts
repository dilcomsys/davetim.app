/**
 * Analytics Service
 * 
 * Google Tag Manager (GTM) ve Google Analytics 4 (GA4) entegrasyonu için kullanılır.
 * Tüm eventler dataLayer üzerinden GTM'e iletilir.
 */

declare global {
    interface Window {
        dataLayer: any[];
        gtag?: (...args: any[]) => void;
    }
}

// Window dataLayer'a güvenli erişim
const getDataLayer = () => {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
};

// Event kategorileri
export const AnalyticsCategory = {
    AUTH: 'auth',
    TEMPLATE: 'template',
    EDITOR: 'editor',
    PAYMENT: 'payment',
    INVITATION: 'invitation',
} as const;

export const analyticsService = {
    /**
     * Temel event gönderme fonksiyonu
     * @param eventName Event adı (örn: login, purchase, template_view)
     * @param params Event parametreleri
     */
    trackEvent: (eventName: string, params: Record<string, any> = {}) => {
        try {
            const dataLayer = getDataLayer();
            dataLayer.push({
                event: eventName,
                ...params,
            });
            // Development ortamında logla
            if (import.meta.env.DEV) {
                console.log(`📊 Analytics Event: ${eventName}`, params);
            }
        } catch (error) {
            console.warn('Analytics event error:', error);
        }
    },

    /**
     * Sayfa görüntüleme takibi
     * (SPA'lardaroute değişimlerini yakalamak için)
     */
    trackPageView: (pagePath: string, pageTitle: string) => {
        try {
            const dataLayer = getDataLayer();
            dataLayer.push({
                event: 'page_view',
                page_path: pagePath,
                page_title: pageTitle,
            });
        } catch (error) {
            console.warn('Analytics page view error:', error);
        }
    },

    /**
     * Kullanıcı girişi
     */
    trackLogin: (method: 'email' | 'google') => {
        analyticsService.trackEvent('login', {
            method: method,
        });
    },

    /**
     * Kullanıcı kaydı
     */
    trackSignUp: (method: 'email' | 'google') => {
        analyticsService.trackEvent('sign_up', {
            method: method,
        });
    },

    /**
     * Ödeme Başlatma
     */
    trackBeginCheckout: (plan: string, price: number, currency: string = 'TRY') => {
        analyticsService.trackEvent('begin_checkout', {
            currency: currency,
            value: price,
            items: [{
                item_id: plan,
                item_name: `${plan.toUpperCase()} Subscription`,
                price: price,
                quantity: 1
            }]
        });
    },

    /**
     * Ödeme Başarılı
     */
    trackPurchase: (transactionId: string, plan: string, price: number, currency: string = 'TRY') => {
        analyticsService.trackEvent('purchase', {
            transaction_id: transactionId,
            value: price,
            currency: currency,
            items: [{
                item_id: plan,
                item_name: `${plan.toUpperCase()} Subscription`,
                price: price,
                quantity: 1
            }]
        });
    },

    /**
     * Şablon Görüntüleme/Seçme
     */
    trackTemplateView: (templateId: string, templateName: string, tier: string) => {
        analyticsService.trackEvent('view_item', {
            items: [{
                item_id: templateId,
                item_name: templateName,
                item_category: 'Template',
                item_variant: tier
            }]
        });
    },

    /**
     * Şablon Kaydetme (Favori)
     */
    trackTemplateFavorite: (templateId: string, isFavorite: boolean) => {
        analyticsService.trackEvent(isFavorite ? 'add_to_wishlist' : 'remove_from_wishlist', {
            items: [{
                item_id: templateId,
                item_category: 'Template'
            }]
        });
    },

    /**
     * Kullanıcı Özelliklerini Ayarla
     * (Login sonrası user_id, tier vb. bilgisini GA4'e iletir)
     */
    setUserProperties: (user: { id: string; tier?: string; method?: string }) => {
        try {
            const dataLayer = getDataLayer();
            // GA4 için user_properties push
            // Not: GTM tarafında bu değişkenleri User Properties olarak tanımlamak gerekir
            dataLayer.push({
                event: 'set_user_properties',
                user_id: user.id,
                user_properties: {
                    tier: user.tier || 'free',
                    login_method: user.method || 'email'
                }
            });

            // Eğer gtag yüklüyse (gtag.js direkt entegrasyonu varsa)
            if (typeof window.gtag === 'function') {
                window.gtag('set', 'user_properties', {
                    tier: user.tier || 'free',
                    login_method: user.method || 'email'
                });
                window.gtag('config', 'G-MLK379ETYH', {
                    'user_id': user.id
                });
            }
        } catch (error) {
            console.warn('Analytics user properties error:', error);
        }
    },

    /**
     * Davetiye İşlemleri
     */
    trackInvitationAction: (action: 'create' | 'edit' | 'delete' | 'publish' | 'share', invitationId?: string) => {
        analyticsService.trackEvent('invitation_action', {
            action_type: action,
            invitation_id: invitationId
        });
    },

    /**
     * Paylaşım İşlemleri (WhatsApp, Link Copy vb.)
     */
    trackShare: (method: 'whatsapp' | 'copy_link' | 'instagram', contentId: string) => {
        analyticsService.trackEvent('share', {
            method: method,
            content_type: 'invitation',
            content_id: contentId
        });
    },

    /**
     * Editör İşlemleri
     */
    trackEditorAction: (action: string, label?: string) => {
        analyticsService.trackEvent('editor_action', {
            action_type: action,
            label: label
        });
    }
};
