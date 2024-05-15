import express, { json } from "express";
import cors from "cors";
import { isAuthMiddleware } from "./middleware";
import { paidController } from "./controller/paid";
import { checkController } from "./controller/check";
import { createController } from "./controller/create";

const app = express();

app.use(json());
app.use(cors());

app.post(
  "/api/v1/create",
  isAuthMiddleware("/api/v1/create", "POST"),
  createController,
);

app.get("/api/v1/check", checkController);

app.post("/paid", paidController);
app.post("/api/v1/paid", paidController);

export default app;
