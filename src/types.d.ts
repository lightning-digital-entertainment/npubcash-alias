declare global {
  namespace Express {
    interface Request {
      authData?: SuccessfullAuthData;
    }
  }
}

export type SuccessfullAuthData = {
  authorized: true;
  data: { pubkey: string; npub: string };
};

type PaymentResponse<TStatus = boolean> = TStatus extends true
  ? { paid: TStatus; preimage: string }
  : { paid: TStatus };

export type AuthData =
  | { authorized: false }
  | { authorized: true; data: { pubkey: string; npub: string } };

export interface PaymentProvider {
  createInvoice: (
    amount: number,
    memo?: string,
    descriptionHash?: string,
  ) => Promise<{
    paymentRequest: string;
    paymentHash: string;
    paymentSecret: string;
  }>;
  payInvoice: (invoice: string) => Promise<PaymentResponse>;
  checkPayment: (invoice: string) => Promise<{ paid: boolean }>;
}
