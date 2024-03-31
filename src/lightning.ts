import { PaymentProvider } from "./types";

export class LightningHandler {
  provider: PaymentProvider;
  constructor(provider: PaymentProvider) {
    this.provider = provider;
  }
  async createInvoice(amount: number, memo?: string, descriptionHash?: string) {
    return this.provider.createInvoice(amount, memo, descriptionHash);
  }
  async payInvoice(invoice: string) {
    return this.provider.payInvoice(invoice);
  }
  async checkPayment(invoice: string) {
    return this.provider.checkPayment(invoice);
  }
}
