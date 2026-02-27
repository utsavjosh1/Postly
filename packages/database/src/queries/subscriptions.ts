import { eq } from "drizzle-orm";
import { db } from "../index";
import { subscriptions } from "../schema";
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  DodoSubscriptionPayload,
} from "@postly/shared-types";

export const subscriptionQueries = {
  async findByUserId(userId: string) {
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.user_id, userId));

    return result ?? null;
  },

  async findByDodoSubscriptionId(dodoSubscriptionId: string) {
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dodo_subscription_id, dodoSubscriptionId));

    return result ?? null;
  },

  // Called by the DodoPayments webhook handler to create or update the subscription record.
  async upsertFromWebhook(userId: string, payload: DodoSubscriptionPayload) {
    const [result] = await db
      .insert(subscriptions)
      .values({ user_id: userId, ...payload })
      .onConflictDoUpdate({
        target: [subscriptions.user_id],
        set: { ...payload, updated_at: new Date() },
      })
      .returning();

    return result;
  },

  async updateStatus(
    userId: string,
    status: SubscriptionStatus,
    accessUntil?: Date,
  ) {
    const [result] = await db
      .update(subscriptions)
      .set({
        status,
        ...(accessUntil && { access_until: accessUntil }),
        ...(status === "cancelled" && { cancelled_at: new Date() }),
        updated_at: new Date(),
      })
      .where(eq(subscriptions.user_id, userId))
      .returning();

    return result ?? null;
  },

  async getPlan(
    userId: string,
  ): Promise<{ plan: SubscriptionPlan; status: SubscriptionStatus } | null> {
    const [result] = await db
      .select({ plan: subscriptions.plan, status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.user_id, userId));

    return result ?? null;
  },

  // Feature gate check — true if subscription is active and not expired.
  async isActive(userId: string): Promise<boolean> {
    const sub = await this.findByUserId(userId);
    if (!sub) return false;
    if (sub.status !== "active" && sub.status !== "trialing") return false;
    if (sub.access_until && new Date(sub.access_until) < new Date())
      return false;
    return true;
  },
};
