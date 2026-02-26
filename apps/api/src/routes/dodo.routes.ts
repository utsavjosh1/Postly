// src/routes/dodo.routes.ts
import { Router } from "express";
import {
  checkoutHandler,
  Webhooks,
  CustomerPortal,
} from "@dodopayments/express";
import {
  DODO_PAYMENTS_API_KEY,
  DODO_PAYMENTS_WEBHOOK_KEY,
  DODO_PAYMENTS_ENVIRONMENT,
  DODO_PAYMENTS_RETURN_URL,
} from "../config/secrets.js";

const router = Router();

// Static Checkout (GET)
router.get(
  "/checkout",
  checkoutHandler({
    bearerToken: DODO_PAYMENTS_API_KEY,
    returnUrl: DODO_PAYMENTS_RETURN_URL,
    environment: DODO_PAYMENTS_ENVIRONMENT,
    type: "static",
  }),
);

// Dynamic Checkout (POST)
router.post(
  "/checkout/dynamic",
  checkoutHandler({
    bearerToken: DODO_PAYMENTS_API_KEY,
    returnUrl: DODO_PAYMENTS_RETURN_URL,
    environment: DODO_PAYMENTS_ENVIRONMENT,
    type: "dynamic",
  }),
);

// Checkout Session (POST)
router.post(
  "/checkout/session",
  checkoutHandler({
    bearerToken: DODO_PAYMENTS_API_KEY,
    returnUrl: DODO_PAYMENTS_RETURN_URL,
    environment: DODO_PAYMENTS_ENVIRONMENT,
    type: "session",
  }),
);

// Customer Portal (GET)
router.get(
  "/customer-portal",
  CustomerPortal({
    bearerToken: DODO_PAYMENTS_API_KEY,
    environment: DODO_PAYMENTS_ENVIRONMENT,
  }),
);

// Webhooks (POST)
router.post(
  "/webhook",
  Webhooks({
    webhookKey: DODO_PAYMENTS_WEBHOOK_KEY,
    onPayload: async (payload) => {
      console.log("Dodo Webhook received:", payload.type);
      // Add business logic here if needed
    },
  }),
);

export default router;
