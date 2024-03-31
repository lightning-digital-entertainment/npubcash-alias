import { queryWrapper } from "../database";

export class PaymentRequest {
  id: number;
  created_at: number;
  pubkey: string;
  payment_request: string;
  alias: string;
  status: "pending" | "cancelled" | "done";

  constructor() {}

  static async createPaymentRequest(
    pubkey: string,
    payment_request: string,
    alias: string,
  ) {
    const query = `INSERT INTO l_alias_requests (pubkey, payment_request, alias, status) VALUES ($1, $2, $3, $4)`;
    const params = [pubkey, payment_request, alias, "pending"];
    const queryRes = await queryWrapper(query, params);
    if (queryRes.rowCount === 0) {
      throw new Error("did not create payment request");
    }
  }

  static async updatePaymentRequestStatus(
    status: "done" | "cancelled",
    payment_request: string,
  ) {
    const query = `UPDATE l_alias_requests SET status = $1 WHERE payment_request = $2`;
    const params = [status, payment_request];
    const queryRes = await queryWrapper(query, params);
    if (queryRes.rowCount === 0) {
      throw new Error("did not update payment request");
    }
  }

  static async hasPendingPaymentRequest(pubkey: string) {
    const query = `SELECT * FROM l_alias_requests WHERE pubkey = $1 AND status = 'pending'`;
    const params = [pubkey];
    const queryRes = await queryWrapper(query, params);
    return queryRes.rows.length > 0;
  }

  static async getPaymentRequestStatus(payment_request: string) {
    const query = `SELECT status FROM l_alias_requests WHERE payment_request = $1`;
    const params = [payment_request];
    const queryRes = await queryWrapper<PaymentRequest>(query, params);
    if (queryRes.rowCount === 0) {
      return null;
    }
    return queryRes.rows[0].status;
  }
}
