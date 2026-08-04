import axios from 'axios';
import toast from 'react-hot-toast';
import type {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatusResponse,
  SubscriptionPaymentData,
} from '../types/payment';
import { PLAN_CONFIGS } from '../config/plans';

// Payment service base URL
const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5000/api/payment';

// Validate payment API URL in production
if (import.meta.env.PROD && PAYMENT_API_BASE_URL.includes('localhost')) {
  console.error('❌ PRODUCTION ERROR: Payment API URL is still localhost!');
  console.error('Set VITE_PAYMENT_API_URL=https://payment.dilcomsys.com/api/payment in .env');
}

class PaymentService {
  private api = axios.create({
    baseURL: PAYMENT_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds for payment operations
  });

  /**
   * Get available payment providers
   */
  async getProviders(): Promise<string[]> {
    try {
      const response = await this.api.get('/providers');
      return response.data;
    } catch (error: any) {
      console.error('❌ Get providers error:', error);
      toast.error('Ödeme sağlayıcıları yüklenemedi');
      throw error;
    }
  }

  /**
   * Process payment with İyzico
   */
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('💳 Processing payment:', paymentData.transactionId);
      console.log('📦 Payment data:', JSON.stringify(paymentData, null, 2));

      const response = await this.api.post('/iyzico/process', paymentData);
      const result = response.data as PaymentResponse;

      console.log('✅ Payment response:', result);

      if (!result.success) {
        console.error('❌ Payment failed:', result.errorMessage, result.errorCode);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);

      const errorMessage = error.response?.data?.errorMessage ||
        error.response?.data?.message ||
        'Ödeme işlemi sırasında bir hata oluştu';

      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await this.api.get(`/iyzico/status/${transactionId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Payment status check error:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(refundData: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await this.api.post('/iyzico/refund', refundData);
      toast.success('İade işlemi başarılı');
      return response.data;
    } catch (error: any) {
      console.error('❌ Refund error:', error);
      toast.error('İade işlemi başarısız oldu');
      throw error;
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentTransactionId: string): Promise<PaymentResponse> {
    try {
      const response = await this.api.post(`/iyzico/cancel/${paymentTransactionId}`);
      toast.success('Ödeme iptal edildi');
      return response.data;
    } catch (error: any) {
      console.error('❌ Cancel payment error:', error);
      toast.error('Ödeme iptali başarısız oldu');
      throw error;
    }
  }

  /**
   * Process subscription payment (helper for davetim.app)
   */
  async processSubscriptionPayment(
    subscriptionData: SubscriptionPaymentData
  ): Promise<PaymentResponse> {
    const { planTier, billingPeriod, customerId, customerName, customerSurname, customerEmail, customerPhone, billingAddress, cardInfo, installment } = subscriptionData;

    // Get price from centralized plan config (single source of truth)
    const planConfig = PLAN_CONFIGS[planTier];
    const amount = billingPeriod === 'yearly' && planConfig.price.yearly
      ? planConfig.price.yearly
      : planConfig.price.monthly;
    const transactionId = `SUB-${Date.now()}-${customerId.slice(0, 8)}`;

    const paymentRequest: PaymentRequest = {
      transactionId,
      amount,
      currency: 'TRY',
      description: `Davetim.app ${planTier.toUpperCase()} - ${billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'} Abonelik`,
      customer: {
        id: customerId,
        name: customerName,
        surname: customerSurname,
        email: customerEmail,
        phone: customerPhone,
        identityNumber: '11111111111', // TODO: Get from user input if needed
        ipAddress: await this.getClientIP(),
      },
      billingAddress,
      shippingAddress: billingAddress, // Same as billing for digital product
      basketItems: [
        {
          id: `PLAN-${planTier.toUpperCase()}`,
          name: `Davetim.app ${planTier.toUpperCase()} Abonelik`,
          category: 'Dijital Hizmet',
          price: amount,
          quantity: 1,
          itemType: 'VIRTUAL',
        },
      ],
      cardInfo,
      use3DSecure: true, // ✅ Production: 3D Secure enabled
      installment: installment || 1,

      // Backend callback URL (İyzico POST burayı çağırır)
      // callbackUrl: Backend'in callback endpoint'i (İyzico için)
      // NOT: Bu backend tarafından otomatik set ediliyor, burada göndermeye gerek yok

      // Client redirect URL (Backend başarı/hata sonrası kullanıcıyı buraya yönlendirir)
      clientRedirectUrl: `${window.location.origin}/payment/callback`,
    };

    return this.processPayment(paymentRequest);
  }

  /**
   * Handle 3D Secure HTML rendering
   * ✅ DOĞRU YAKLAŞIM: HTML'i frontend'te direkt render et
   * Backend'den gelen threeDSecureHtmlContent'i TAM EKRAN olarak göster
   */
  handle3DSecure(htmlContent: string): void {
    console.log('🔐 Rendering 3D Secure HTML...');
    console.log('📄 HTML length:', htmlContent.length);

    // Save state
    sessionStorage.setItem('payment_3d_in_progress', 'true');
    sessionStorage.setItem('payment_3d_timestamp', Date.now().toString());

    // ✅ TAM EKRAN RENDER (iframe sandbox sorunu yok)
    this.render3DSecureFullScreen(htmlContent);
  }

  /**
   * Render 3D Secure HTML in full screen (NO iframe - direct document write)
   * Bu yöntem iframe sandbox sorunlarını ortadan kaldırır
   * İyzico callback sonrası doğrudan yönlendirme yapabilir
   */
  private render3DSecureFullScreen(htmlContent: string): void {
    console.log('🔐 Opening 3D Secure in new window...');

    // Create a blob URL for the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    // Try to open in same window (works best for callbacks)
    // Save current location to restore if user cancels
    const returnUrl = window.location.href;
    sessionStorage.setItem('payment_return_url', returnUrl);

    console.log('✅ Redirecting to 3D Secure page...');
    console.log('📍 Return URL saved:', returnUrl);

    // Full page redirect - İyzico can properly redirect back
    window.location.href = blobUrl;

    // Cleanup blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 10000);
  }


  /**
   * Get client IP address (fallback to mock if not available)
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
      return response.data.ip;
    } catch (error) {
      console.warn('Could not fetch IP, using fallback');
      return '85.34.78.112'; // Fallback IP for testing
    }
  }

  /**
   * İyzico test kartları
   */
  getTestCards() {
    return {
      success: {
        cardNumber: '5528790000000008',
        cardHolderName: 'TEST USER',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
      },
      failure: {
        cardNumber: '5528790000000004',
        cardHolderName: 'TEST USER',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
      },
    };
  }
}

export const paymentService = new PaymentService();
