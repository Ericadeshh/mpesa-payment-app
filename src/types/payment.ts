export type PaymentStatus = "pending" | "completed" | "failed";

export interface Payment {
  _id: string;
  amount: number;
  phoneNumber: string;
  transactionId?: string;
  status: PaymentStatus;
  checkoutRequestId?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface InitiatePaymentRequest {
  amount: number;
  phoneNumber: string;
}

export interface MpesaSTKResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}
