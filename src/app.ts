import express, { Request, Response } from "express";
import { isAuthMiddleware } from "./middleware";
import { PaymentRequest } from "./models/PaymentRequest";
import { lnProvider } from ".";
import { aliasRegex } from "./regex";
import { User } from "./models/User";

const app = express();

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
      const invoiceRequest = await lnProvider.createInvoice(amount);
      await PaymentRequest.createPaymentRequest(
        authData.data.pubkey,
        invoiceRequest.paymentRequest,
        alias,
      );
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
  (
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
    if (eventType === "receive.lightning") {
      const reqHash = transaction.initiationVia.paymentHash;
    } else {
      return res.sendStatus(200);
    }
  },
);

export default app;
