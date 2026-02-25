import { apiClient } from "../lib/api-client";

export interface DiscordConfig {
  id: string;
  guild_id: string;
  guild_name: string | null;
  channel_id: string | null;
  channel_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class DiscordService {
  async getConfigs(): Promise<DiscordConfig[]> {
    const response = await apiClient.get("/discord/configs");
    return response.data.configs;
  }

  async triggerTestNotification(): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post("/discord/test-notification");
    return response.data;
  }

  async updateConfig(
    id: string,
    updates: { channel_id?: string; is_active?: boolean },
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch(`/discord/configs/${id}`, updates);
    return response.data;
  }

  async linkServer(
    guildId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post("/discord/link-server", {
      guild_id: guildId,
    });
    return response.data;
  }

  getAuthorizeUrl(): string {
    const clientId = "1410945912129454100";
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=83968&integration_type=0&scope=bot+applications.commands`;
  }
}

export const discordService = new DiscordService();
