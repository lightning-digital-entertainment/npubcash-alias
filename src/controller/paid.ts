import { Request, Response } from "express";
import { memo } from "..";
import { PaymentRequest } from "../models/PaymentRequest";
import { User } from "../models/User";

export async function paidController(
  req: Request<
    unknown,
    unknown,
    {
      eventType: string;
      transaction: {
        memo: string;
        settlementAmount: number;
        initiationVia: { paymentHash: string };
      };
    },
    unknown
  >,
  res: Response,
) {
  const { eventType, transaction } = req.body;
  if (eventType !== "receive.lightning" || transaction.memo !== memo) {
    return res.sendStatus(200);
  }
  const reqHash = transaction.initiationVia.paymentHash;
  try {
    const paymentRequest =
      await PaymentRequest.getPaymentRequestByHash(reqHash);
    if (!paymentRequest) {
      return res.sendStatus(200);
    }
    if (transaction.settlementAmount !== paymentRequest.amount) {
      return res.sendStatus(200);
    }
    await User.upsertUsernameByPubkey(
      paymentRequest.pubkey,
      paymentRequest.alias,
    );
    await PaymentRequest.updatePaymentRequestStatus(
      "done",
      paymentRequest.payment_hash,
    );
  } catch (e) {
    console.log(e);
    return res.sendStatus(200);
  }
}
