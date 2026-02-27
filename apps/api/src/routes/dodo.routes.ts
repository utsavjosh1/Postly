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
import { db, subscriptions, payments, eq } from "@postly/database";

const router = Router();

router.get(
  "/checkout",
  checkoutHandler({
    bearerToken: DODO_PAYMENTS_API_KEY,
    returnUrl: DODO_PAYMENTS_RETURN_URL,
    environment: DODO_PAYMENTS_ENVIRONMENT,
    type: "static",
  }),
);

router.post(
  "/checkout/dynamic",
  checkoutHandler({
    bearerToken: DODO_PAYMENTS_API_KEY,
    returnUrl: DODO_PAYMENTS_RETURN_URL,
    environment: DODO_PAYMENTS_ENVIRONMENT,
    type: "dynamic",
  }),
);

router.post(
  "/checkout/session",
  checkoutHandler({
    bearerToken: DODO_PAYMENTS_API_KEY,
    returnUrl: DODO_PAYMENTS_RETURN_URL,
    environment: DODO_PAYMENTS_ENVIRONMENT,
    type: "session",
  }),
);

router.get(
  "/customer-portal",
  CustomerPortal({
    bearerToken: DODO_PAYMENTS_API_KEY,
    environment: DODO_PAYMENTS_ENVIRONMENT,
  }),
);

router.post(
  "/webhook",
  Webhooks({
    webhookKey: DODO_PAYMENTS_WEBHOOK_KEY,
    onPayload: async (payload) => {
      const data = payload.data as Record<string, unknown>;
      const customerId = data?.customer_id as string | undefined;
      const subscriptionId = data?.subscription_id as string | undefined;

      // Resolve user from dodo_customer_id
      let userId: string | null = null;
      if (customerId) {
        const [sub] = await db
          .select({ user_id: subscriptions.user_id })
          .from(subscriptions)
          .where(eq(subscriptions.dodo_customer_id, customerId));
        userId = sub?.user_id ?? null;
      }

      switch (payload.type) {
        case "subscription.active":
        case "subscription.renewed": {
          if (!userId) break;
          await db
            .update(subscriptions)
            .set({
              status: "active",
              dodo_subscription_id: subscriptionId,
              current_period_start: data?.current_period_start
                ? new Date(data.current_period_start as string)
                : undefined,
              current_period_end: data?.current_period_end
                ? new Date(data.current_period_end as string)
                : undefined,
              raw_data: data,
              updated_at: new Date(),
            })
            .where(eq(subscriptions.user_id, userId));
          break;
        }

        case "subscription.cancelled": {
          if (!userId) break;
          await db
            .update(subscriptions)
            .set({
              status: "cancelled",
              cancelled_at: new Date(),
              raw_data: data,
              updated_at: new Date(),
            })
            .where(eq(subscriptions.user_id, userId));
          break;
        }

        case "subscription.expired": {
          if (!userId) break;
          await db
            .update(subscriptions)
            .set({
              status: "expired",
              raw_data: data,
              updated_at: new Date(),
            })
            .where(eq(subscriptions.user_id, userId));
          break;
        }

        case "payment.succeeded":
        case "payment.failed":
        case "refund.succeeded": {
          if (!userId) break;
          const status =
            payload.type === "payment.succeeded"
              ? "succeeded"
              : payload.type === "refund.succeeded"
                ? "refunded"
                : "failed";

          await db.insert(payments).values({
            user_id: userId,
            dodo_payment_id: data?.payment_id as string | undefined,
            dodo_customer_id: customerId,
            event_type: payload.type,
            status,
            amount: Number(data?.amount ?? 0),
            currency: (data?.currency as string | undefined) ?? "USD",
            paid_at:
              status === "succeeded" || status === "refunded"
                ? new Date()
                : undefined,
            raw_payload: data,
          });
          break;
        }

        default:
          break;
      }
    },
  }),
);

export default router;
