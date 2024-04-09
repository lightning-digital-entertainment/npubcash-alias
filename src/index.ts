import { createServer } from "http";
import app from "./app";
import { LightningHandler } from "./lightning";
import { BlinkProvider } from "./blink";

export const lnProvider = new LightningHandler(new BlinkProvider());
export const memo = "NPC Alias";

const server = createServer(app);

const port = process.env.PORT || 8080;

server.listen(port, () => {
  console.log("Running on port " + port);
});
