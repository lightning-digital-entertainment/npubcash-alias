import { Request, Response } from "express";
import { PaymentRequest } from "../models/PaymentRequest";

export async function checkController(
  req: Request<unknown, unknown, unknown, { pr: string }>,
  res: Response,
) {
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
}
