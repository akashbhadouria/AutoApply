import cors from "cors";
import express from "express";

import { env } from "./config.js";
import { apiRouter, errorHandler } from "./routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
    }),
  );
  app.use(express.json());
  app.use(apiRouter);
  app.use(errorHandler);

  return app;
}

