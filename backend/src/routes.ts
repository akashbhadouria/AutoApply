import type { Request, Response } from "express";
import { Router } from "express";
import { ZodError } from "zod";

import { getProfileFields, removeProfileField, saveProfileField } from "./profile.service.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

apiRouter.get("/api/profile-fields", async (_request, response, next) => {
  try {
    const fields = await getProfileFields();
    response.json({ data: fields });
  } catch (error) {
    next(error);
  }
});

apiRouter.put("/api/profile-fields/:key", async (request, response, next) => {
  try {
    const field = await saveProfileField(request.params.key, request.body);
    response.status(200).json({ data: field });
  } catch (error) {
    next(error);
  }
});

apiRouter.delete("/api/profile-fields/:key", async (request, response, next) => {
  try {
    const deleted = await removeProfileField(request.params.key);
    response.status(deleted ? 204 : 404).send();
  } catch (error) {
    next(error);
  }
});

export function errorHandler(error: unknown, _request: Request, response: Response, _next: () => void) {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Validation failed",
      details: error.flatten(),
    });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error" });
}

