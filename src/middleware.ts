import { NextFunction, Request, Response } from "express";
import { verifyAuth } from "./auth";

export function requireHTTPS(req: Request, res: Response, next: NextFunction) {
  if (
    !req.secure &&
    req.get("x-forwarded-proto") !== "https" &&
    process.env.NODE_ENV !== "development"
  ) {
    return res.redirect("https://" + req.get("host") + req.url);
  }
  next();
}

export function isAuthMiddleware(path: string, method: string) {
  async function isAuth(req: Request, res: Response, next: NextFunction) {
    const hostname = req.header("host");
    const protocol =
      req.header("X-Forwarded-Proto") || process.env.NODE_ENV == "development"
        ? "http"
        : "https";
    if (!hostname) {
      res.status(400);
      return res.json({ error: true, message: "missing host header..." });
    }
    const url = protocol + "://" + hostname + path;
    console.log(url);
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      res.status(401);
      return res.json({ error: true, message: "missing auth header" });
    }
    const isAuth = await verifyAuth(authHeader, url, method);
    if (!isAuth.authorized) {
      res.status(401);
      return res.json({ error: true, message: "invalid auth header" });
    } else {
      req.authData = isAuth;
    }
    next();
  }
  return isAuth;
}
