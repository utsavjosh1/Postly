import { eq, desc, and } from "drizzle-orm";
import { db } from "../index";
import { email_notifications, notification_templates } from "../schema";
import type {
  NotificationStatus,
  CreateNotificationTemplateInput,
  CreateNotificationInput,
} from "@postly/shared-types";

export const notificationQueries = {
  // Templates
  async findTemplateBySlug(slug: string) {
    const [result] = await db
      .select()
      .from(notification_templates)
      .where(eq(notification_templates.slug, slug));

    return result ?? null;
  },

  async createTemplate(input: CreateNotificationTemplateInput) {
    const [result] = await db
      .insert(notification_templates)
      .values(input)
      .returning();

    return result;
  },

  // Notifications
  async createNotification(input: CreateNotificationInput) {
    const [result] = await db
      .insert(email_notifications)
      .values({ ...input, status: "pending" })
      .returning();

    return result;
  },

  // Worker queue: fetch all pending notifications due for dispatch.
  async findPending(limit = 100) {
    return db
      .select({
        notification: email_notifications,
        template: {
          html_body: notification_templates.html_body,
          text_body: notification_templates.text_body,
        },
      })
      .from(email_notifications)
      .leftJoin(
        notification_templates,
        eq(email_notifications.template_id, notification_templates.id),
      )
      .where(and(eq(email_notifications.status, "pending")))
      .orderBy(email_notifications.scheduled_at)
      .limit(limit);
  },

  async updateStatus(
    id: string,
    status: NotificationStatus,
    providerMessageId?: string,
    errorMessage?: string,
  ) {
    await db
      .update(email_notifications)
      .set({
        status,
        ...(providerMessageId && { provider_message_id: providerMessageId }),
        ...(errorMessage && { error_message: errorMessage }),
        ...(status === "sent" && { sent_at: new Date() }),
        ...(status === "opened" && { opened_at: new Date() }),
      })
      .where(eq(email_notifications.id, id));
  },

  async incrementRetryCount(id: string) {
    const [existing] = await db
      .select({ retry_count: email_notifications.retry_count })
      .from(email_notifications)
      .where(eq(email_notifications.id, id));

    if (!existing) return;

    await db
      .update(email_notifications)
      .set({ retry_count: (existing.retry_count ?? 0) + 1 })
      .where(eq(email_notifications.id, id));
  },

  async findByUser(userId: string, limit = 50) {
    return db
      .select()
      .from(email_notifications)
      .where(eq(email_notifications.user_id, userId))
      .orderBy(desc(email_notifications.created_at))
      .limit(limit);
  },
};
