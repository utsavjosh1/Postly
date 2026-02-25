import { Request, Response, NextFunction } from "express";
import { db, discord_configs, eq, and } from "@postly/database";
import { queueService } from "../services/queue.service.js";
import type { JwtPayload } from "../middleware/auth.js";
import { WEB_URL } from "../config/secrets.js";

export class DiscordController {
  /**
   * GET /api/v1/discord/callback
   * Handles the redirect from Discord after a user authorizes the bot.
   */
  handleCallback = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { guild_id } = req.query;
      const user = req.user as JwtPayload;

      if (!guild_id) {
        res.status(400).json({
          success: false,
          error: { message: "Missing guild_id from Discord callback" },
        });
        return;
      }

      // 1. Save or update the discord configuration for this guild
      // Note: We don't have the channel_id yet, the user will set it via /setup
      await db
        .insert(discord_configs)
        .values({
          guild_id: guild_id as string,
          user_id: user.id,
          is_active: true,
        })
        .onConflictDoUpdate({
          target: discord_configs.guild_id,
          set: {
            user_id: user.id,
            is_active: true,
            updated_at: new Date(),
          },
        });

      // 2. Redirect back to the web dashboard with a success flag
      res.redirect(
        `${WEB_URL}/dashboard?discord_success=true&guild_id=${guild_id}`,
      );
    } catch (error) {
      console.error("Discord callback error:", error);
      res.redirect(`${WEB_URL}/dashboard?discord_error=true`);
    }
  };

  /**
   * GET /api/v1/discord/configs
   * Returns the discord configurations for the current user.
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
        .from(discord_configs)
        .where(eq(discord_configs.user_id, user.id));

      res.json({
        success: true,
        configs: configs,
      });
    } catch (error) {
      _next(error);
    }
  };

  /**
   * POST /api/v1/discord/test-notification
   * Manually trigger a notification for the current user's discord server.
   */
  triggerTestNotification = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as JwtPayload;
      console.log("User:", user);

      // Find the first active config for this user
      const [config] = await db
        .select()
        .from(discord_configs)
        .where(
          and(
            eq(discord_configs.user_id, user.id),
            eq(discord_configs.is_active, true),
          ),
        )
        .limit(1);

      if (!config || !config.channel_id) {
        res.status(404).json({
          success: false,
          message: "No active Discord configuration found. Run /setup first!",
        });
        return;
      }

      await queueService.dispatchForGuild(config.guild_id, config.channel_id);

      res.json({
        success: true,
        message: "Test notification queued successfully!",
      });
    } catch (error) {
      _next(error);
    }
  };

  /**
   * PATCH /api/v1/discord/configs/:id
   * Updates a discord configuration (e.g. channel_id).
   */
  updateConfig = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { channel_id, is_active } = req.body;
      const user = req.user as JwtPayload;

      await db
        .update(discord_configs)
        .set({
          channel_id,
          is_active,
          updated_at: new Date(),
        })
        .where(
          and(
            eq(discord_configs.id, id as string),
            eq(discord_configs.user_id, user.id),
          ),
        );

      res.json({
        success: true,
        message: "Configuration updated successfully",
      });
    } catch (error) {
      _next(error);
    }
  };

  /**
   * POST /api/v1/discord/link-server
   * Manually links a guild_id to the current user.
   */
  linkServer = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { guild_id } = req.body;
      const user = req.user as JwtPayload;

      if (!guild_id) {
        res.status(400).json({
          success: false,
          error: { message: "Missing guild_id" },
        });
        return;
      }

      await db
        .insert(discord_configs)
        .values({
          guild_id: guild_id as string,
          user_id: user.id,
          is_active: true,
        })
        .onConflictDoUpdate({
          target: discord_configs.guild_id,
          set: {
            user_id: user.id,
            is_active: true,
            updated_at: new Date(),
          },
        });

      res.json({
        success: true,
        message: "Server linked successfully!",
      });
    } catch (error) {
      _next(error);
    }
  };
}
