import express, { Request, Response } from "express";
import { isAuthMiddleware } from "./middleware";
import { PaymentRequest } from "./models/PaymentRequest";

const app = express();

app.post(
  "/create",
  isAuthMiddleware("/create", "POST"),
  (req: Request, res: Response) => {},
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
