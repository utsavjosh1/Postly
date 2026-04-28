import { Request, Response, NextFunction } from "express";
import { db, bot_configs, eq, and, botQueries } from "@postly/database";
import { queueService } from "../services/queue.service.js";
import type { JwtPayload } from "../middleware/auth.js";
import { WEB_URL } from "../config/secrets.js";
import type { BotPlatform } from "@postly/shared-types";

export class BotController {
  /**
   * GET /api/v1/bots/callback
   * Handles the redirect from OAuth providers (e.g. Discord).
   */
  handleDiscordCallback = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { guild_id } = req.query;
      const user = req.user as JwtPayload;

      if (!guild_id) {
        res.redirect(`${WEB_URL}/dashboard?discord_error=missing_guild`);
        return;
      }

      await botQueries.upsertConfig({
        user_id: user.id,
        platform: "discord",
        target_id: guild_id as string,
      });

      res.redirect(
        `${WEB_URL}/dashboard?discord_success=true&guild_id=${guild_id}`,
      );
    } catch (error) {
      console.error("Discord callback error:", error);
      res.redirect(`${WEB_URL}/dashboard?discord_error=true`);
    }
  };

  /**
   * GET /api/v1/bots/configs
   * Returns all bot configurations for the current user.
   */
  getConfigs = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as JwtPayload;
      const configs = await db
        .select()
        .from(bot_configs)
        .where(eq(bot_configs.user_id, user.id));

      res.json({
        success: true,
        data: configs,
      });
    } catch (error) {
      _next(error);
    }
  };

  /**
   * POST /api/v1/bots/configs
   * Manually create or update a bot config (e.g. for Webhooks, Twitter, Reddit).
   */
  upsertConfig = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as JwtPayload;
      const {
        platform,
        target_id,
        target_name,
        webhook_url,
        credentials,
        filters,
      } = req.body;

      const result = await botQueries.upsertConfig({
        user_id: user.id,
        platform: platform as BotPlatform,
        target_id,
        target_name,
        webhook_url,
        credentials,
        ...filters,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      _next(error);
    }
  };

  /**
   * PATCH /api/v1/bots/configs/:id
   * Updates an existing bot configuration.
   */
  updateConfig = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user as JwtPayload;
      const updateData = req.body;

      const [existing] = await db
        .select()
        .from(bot_configs)
        .where(
          and(
            eq(bot_configs.id, id as string),
            eq(bot_configs.user_id, user.id),
          ),
        )
        .limit(1);

      if (!existing) {
        res.status(404).json({ success: false, message: "Config not found" });
        return;
      }

      const [updated] = await db
        .update(bot_configs)
        .set({
          ...updateData,
          updated_at: new Date(),
        })
        .where(eq(bot_configs.id, id as string))
        .returning();

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      _next(error);
    }
  };

  /**
   * POST /api/v1/bots/configs/:id/test
   * Manually trigger a test notification for a specific bot config.
   */
  triggerTestNotification = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user as JwtPayload;

      const [config] = await db
        .select()
        .from(bot_configs)
        .where(
          and(
            eq(bot_configs.id, id as string),
            eq(bot_configs.user_id, user.id),
          ),
        )
        .limit(1);

      if (!config) {
        res.status(404).json({
          success: false,
          message: "Bot configuration not found.",
        });
        return;
      }

      await queueService.dispatchForPlatform(config.id);

      res.json({
        success: true,
        message: `Test notification queued for ${config.platform}!`,
      });
    } catch (error) {
      _next(error);
    }
  };
}
