import express, { json } from "express";
import { isAuthMiddleware } from "./middleware";
import { paidController } from "./controller/paid";
import { checkController } from "./controller/check";
import { createController } from "./controller/create";

const app = express();

app.use(json());

app.post("/create", isAuthMiddleware("/create", "POST"), createController);

app.get("/check", checkController);

app.post("/paid", paidController);

export default app;
