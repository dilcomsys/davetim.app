/**
 * Legal Documents Index
 * Tüm yasal belgelerin merkezi export noktası
 */

export { PRIVACY_POLICY } from './privacy-policy';
export { TERMS_OF_SERVICE } from './terms-of-service';
export { CANCELLATION_REFUND_POLICY } from './cancellation-refund-policy';
export { COMMERCIAL_ELECTRONIC_MESSAGE, COMMERCIAL_MESSAGE_CONSENT_TEXT } from './commercial-electronic-message';
export { KVKK_CLARIFICATION } from './kvkk-clarification';
export { 
  generateDistanceSalesContract, 
  generateDistanceSalesContractText,
  DISTANCE_SALES_CONTRACT,
  type DistanceSalesContractData,
  type DistanceSalesContractParams
} from './distance-sales-contract';

// Legal document types
export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  companyInfo?: CompanyInfo;
}

export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  mersis: string;
}

// All legal documents list
export const LEGAL_DOCUMENTS = [
  {
    id: 'privacy-policy',
    title: 'Gizlilik Politikası',
    slug: 'gizlilik-politikasi',
    icon: '🔒',
    description: 'Kişisel verilerinizin korunması ve KVKK uyumu',
  },
  {
    id: 'terms-of-service',
    title: 'Kullanım Koşulları',
    slug: 'kullanim-kosullari',
    icon: '📜',
    description: 'Platform kullanım şartları ve sorumlu luklar',
  },
  {
    id: 'cancellation-refund',
    title: 'İptal ve İade Koşulları',
    slug: 'iptal-ve-iade-kosullari',
    icon: '↩️',
    description: 'Abonelik iptali ve iade prosedürleri',
  },
  {
    id: 'kvkk-clarification',
    title: 'KVKK Aydınlatma Metni',
    slug: 'kvkk-aydinlatma',
    icon: '📋',
    description: 'Kişisel veri işleme aydınlatma metni',
  },
  {
    id: 'commercial-message',
    title: 'Ticari Elektronik İleti',
    slug: 'ticari-elektronik-ileti',
    icon: '📧',
    description: 'Pazarlama iletişimi onayı ve koşulları',
  },
  {
    id: 'distance-sales',
    title: 'Mesafeli Satış Sözleşmesi',
    slug: 'mesafeli-satis-sozlesmesi',
    icon: '📦',
    description: 'E-ticaret ve dijital hizmet satış sözleşmesi',
  },
] as const;

