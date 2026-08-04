// Payment Service Types (localhost:5000)

export type PaymentStatus =
  | 'SUCCESS'
  | 'FAILURE'
  | 'PENDING'
  | 'WAITING_3D'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentCurrency = 'TRY' | 'USD' | 'EUR';

export type BasketItemType = 'PHYSICAL' | 'VIRTUAL';

export interface CustomerInfo {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  identityNumber?: string;
  registrationAddress?: string;
  city?: string;
  country?: string;
  zipCode?: string;
  ipAddress?: string;
}

export interface AddressInfo {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
}

export interface BasketItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  itemType: BasketItemType;
}

export interface CardInfo {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
}

export interface PaymentRequest {
  transactionId: string;
  amount: number;
  currency: PaymentCurrency;
  description?: string;
  customer: CustomerInfo;
  billingAddress: AddressInfo;
  shippingAddress?: AddressInfo;
  basketItems: BasketItem[];
  callbackUrl?: string; // Backend callback URL (deprecated - backend otomatik set eder)
  clientRedirectUrl?: string; // Frontend redirect URL (3D Secure sonrası kullanıcı buraya gider)
  cardInfo?: CardInfo;
  use3DSecure: boolean;
  installment: number;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  providerTransactionId?: string;
  provider: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  errorCode?: string;
  threeDSecureHtmlContent?: string;
  processedAt: string;
  additionalData?: Record<string, any>;
}

export interface RefundRequest {
  paymentTransactionId: string;
  amount: number;
  reason?: string;
  currency: PaymentCurrency;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  processedAt: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  processedAt?: string;
  errorMessage?: string;
}

// Davetim.app için subscription payment types
export interface SubscriptionPaymentData {
  planTier: 'pro' | 'premium';
  billingPeriod: 'monthly' | 'yearly';
  customerId: string;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: AddressInfo;
  cardInfo: CardInfo;
  installment?: number;
}

