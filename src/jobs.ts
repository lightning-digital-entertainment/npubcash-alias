import cron from "node-cron";
import { PaymentRequest } from "./models/PaymentRequest";

cron.schedule("*/5 * * * *", () => {
  console.log("Running db cleanup...");
  PaymentRequest.cancelTimedOutRequests()
    .then((rowCount) => {
      console.log(`Cancelled ${rowCount || 0} alias request`);
    })
    .catch((e) => {
      console.log("error cancelling payment requests...", e);
    });
});
