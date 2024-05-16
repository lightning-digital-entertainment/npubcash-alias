import { Request, Response } from "express";
import { aliasRegex } from "../regex";
import { PaymentRequest } from "../models/PaymentRequest";
import { User } from "../models/User";
import { lnProvider, memo } from "..";

export async function createController(
  req: Request<unknown, unknown, { alias: string; amount: number }>,
  res: Response,
) {
  const authData = req.authData!;
  const { alias, amount } = req.body;
  if (!alias || amount < 5000) {
    res.status(400);
    return res.json({ error: true, message: "bad request" });
  }
  const parsedAlias = alias.toLowerCase().trim();
  if (!parsedAlias.match(aliasRegex) || parsedAlias.length < 3) {
    res.status(400);
    return res.json({ error: true, message: "invalid alias" });
  }
  try {
    const hasPendingPayment = await PaymentRequest.hasPendingPaymentRequest(
      authData.data.pubkey,
    );
    if (hasPendingPayment) {
      res.status(400);
      return res.json({
        error: true,
        message: "can only have one pending alias request at the time",
      });
    }
    const alreadyExists = await User.checkIfAliasExists(parsedAlias);
    if (alreadyExists) {
      res.status(400);
      return res.json({
        error: true,
        message: "alias is already taken",
      });
    }
    const isReserved = await PaymentRequest.checkIfReserved(alias);
    if (isReserved) {
      res.status(409);
      return res.json({
        error: true,
        message: "alias is reserved. Check back in a couple of minutes",
      });
    }
    const invoiceRequest = await lnProvider.createInvoice(
      amount,
      memo,
      undefined,
      10,
    );
    await PaymentRequest.createPaymentRequest(
      authData.data.pubkey,
      invoiceRequest.paymentRequest,
      invoiceRequest.paymentHash,
      alias,
      amount,
    );
    res.json({
      error: false,
      data: { payment_request: invoiceRequest.paymentRequest, alias },
    });
  } catch (e) {
    console.log(e);
    res.status(500);
    return res.json({
      error: true,
      message: "something went wrong... sorry!",
    });
  }
}
