import { createServer } from "http";
import app from "./app";

const server = createServer(app);

const port = process.env.PORT || 8080;

server.listen(port, () => {
  console.log("Running on port " + port);
});
