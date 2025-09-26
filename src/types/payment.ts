export interface CreatePaymentIntentInput {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  orderId: string;
  createdAt: Date;
}

export interface PaymentWebhookData {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      metadata: {
        orderId: string;
      };
      amount: number;
      currency: string;
    };
  };
}

export interface PaymentMethodResponse {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  pix?: {
    qrCode: string;
    qrCodeText: string;
  };
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  id: string;
  amount: number;
  status: string;
  reason: string;
  createdAt: Date;
}
