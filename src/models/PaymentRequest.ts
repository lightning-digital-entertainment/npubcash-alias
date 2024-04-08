import { queryWrapper } from "../database";

export class PaymentRequest {
  id: number;
  created_at: number;
  pubkey: string;
  payment_request: string;
  payment_hash: string;
  alias: string;
  status: "pending" | "cancelled" | "done";
  amount: number;

  constructor() {}

  static async createPaymentRequest(
    pubkey: string,
    payment_request: string,
    payment_hash: string,
    alias: string,
    amount: number,
  ) {
    const query = `INSERT INTO l_alias_requests (pubkey, payment_request, payment_hash, alias, status, amount) VALUES ($1, $2, $3, $4, $5, $6)`;
    const params = [
      pubkey,
      payment_request,
      payment_hash,
      alias,
      "pending",
      amount,
    ];
    const queryRes = await queryWrapper(query, params);
    if (queryRes.rowCount === 0) {
      throw new Error("did not create payment request");
    }
  }

  static async getPaymentRequestByHash(payment_hash: string) {
    const query = `SELECT * from l_alias_requests WHERE payment_hash = $1`;
    const params = [payment_hash];
    const queryRes = await queryWrapper<PaymentRequest>(query, params);
    return queryRes.rows[0];
  }

  static async cancelTimedOutRequests() {
    const query = `UPDATE l_alias_requests SET status 'cancelled' WHERE created_at < now() - interval '7minutes'`;
    const res = await queryWrapper(query, []);
    console.log(`Updated ${res.rowCount} rows...`);
  }

  static async checkIfReserved(alias: string) {
    const query = `SELECT * FROM l_alias_requests WHERE alias = $1 AND status = 'pending'`;
    const params = [alias];
    const queryRes = await queryWrapper(query, params);
    return queryRes.rows.length > 0;
  }

  static async updatePaymentRequestStatus(
    status: "done" | "cancelled",
    payment_hash: string,
  ) {
    const query = `UPDATE l_alias_requests SET status = $1 WHERE payment_hash = $2`;
    const params = [status, payment_hash];
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
