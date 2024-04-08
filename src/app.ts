import express, { Request, Response } from "express";
import { isAuthMiddleware } from "./middleware";
import { PaymentRequest } from "./models/PaymentRequest";
import { lnProvider } from ".";
import { aliasRegex } from "./regex";
import { User } from "./models/User";

const app = express();

const memo = "NPC Alias";

app.post(
  "/create",
  isAuthMiddleware("/create", "POST"),
  async (
    req: Request<unknown, unknown, { alias: string; amount: number }>,
    res: Response,
  ) => {
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
      const invoiceRequest = await lnProvider.createInvoice(amount, memo);
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
  },
);

app.get(
  "/check",
  async (
    req: Request<unknown, unknown, unknown, { pr: string }>,
    res: Response,
  ) => {
    const { pr } = req.query;
    if (!pr) {
      res.status(401);
      return res.json({ error: true, message: "missing params" });
    }
    try {
      const status = await PaymentRequest.getPaymentRequestStatus(pr);
      if (!status) {
        res.status(404);
        return res.json({ error: true, message: "not found" });
      }
      res.json({ error: false, data: { status } });
    } catch (e) {
      console.log(e);
      res.status(500);
      return res.json({
        error: true,
        message: "something went wrong... sorry!",
      });
    }
  },
);

app.post(
  "/paid",
  async (
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
  ) => {
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
  },
);

export default app;
