import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Bot,
  Server,
  Send,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { discordService, DiscordConfig } from "../services/discord.service";
import { toast } from "../stores/toast.store";
import { Skeleton } from "../components/ui/Skeleton";
import { ParticleBackground } from "../components/ui/ParticleBackground";

export function DiscordSettingsPage() {
  const [configs, setConfigs] = useState<DiscordConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newChannelId, setNewChannelId] = useState("");

  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await discordService.getConfigs();
      setConfigs(data || []);
    } catch (error) {
      console.error("Failed to load discord configs:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMagicLink = useCallback(
    async (guildId: string) => {
      setIsLoading(true);
      try {
        await discordService.linkServer(guildId);
        toast.success("Server linked successfully!");
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
        loadConfigs();
      } catch {
        toast.error("Failed to link server");
        loadConfigs();
      }
    },
    [loadConfigs],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guildId = params.get("guild_id");

    if (guildId) {
      handleMagicLink(guildId);
    } else {
      loadConfigs();
    }
  }, [handleMagicLink, loadConfigs]);

  const handleUpdateChannel = async (id: string) => {
    if (!newChannelId) return;
    try {
      await discordService.updateConfig(id, { channel_id: newChannelId });
      toast.success("Settings updated");
      setEditingId(null);
      loadConfigs();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const res = await discordService.triggerTestNotification();
      if (res.success) {
        toast.success("Test notification sent");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Test failed";
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddBot = () => {
    window.location.href = discordService.getAuthorizeUrl();
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center overflow-x-hidden pt-32 pb-32">
      <ParticleBackground />

      <main className="relative z-10 w-full max-w-4xl px-6 md:px-8 space-y-16">
        {/* Minimalist Hero */}
        <section className="text-center space-y-6">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-sm">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-white tracking-tighter">
                Discord Alerts.
              </h1>
              <p className="text-lg text-zinc-500 max-w-lg mx-auto">
                Simplified job notifications for your server.
              </p>
            </div>
            <Button
              onClick={handleAddBot}
              className="px-8 py-3 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-all flex items-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Connect Server
              <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </section>

        {/* Simplified Configs */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-3">
              Active Channels
            </h3>
            <button
              onClick={loadConfigs}
              className="text-zinc-600 hover:text-white transition-colors"
            >
              <RefreshCw
                className={cn("w-4 h-4", isLoading && "animate-spin")}
              />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl bg-white/3" />
              ))}
            </div>
          ) : configs.length > 0 ? (
            <div className="space-y-3">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:bg-zinc-900/60"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-zinc-600">
                      <Server className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-zinc-200 truncate">
                        {config.guild_name || "Unknown Server"}
                      </h4>
                      {editingId === config.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={newChannelId}
                            onChange={(e) => setNewChannelId(e.target.value)}
                            placeholder="Channel ID"
                            className="h-8 bg-black/60 border border-white/10 text-white rounded px-2 text-xs focus:outline-none focus:border-white/30"
                          />
                          <button
                            className="text-xs font-bold text-white hover:text-zinc-400"
                            onClick={() => handleUpdateChannel(config.id)}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(config.id);
                            setNewChannelId(config.channel_id || "");
                          }}
                          className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {config.channel_name
                            ? `#${config.channel_name}`
                            : "Configure channel"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleTestNotification}
                      disabled={isTesting || !config.is_active}
                      className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-2 disabled:opacity-30"
                    >
                      <Send className="w-3 h-3" />
                      Test Drop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl">
              <p className="text-zinc-600 text-sm">No servers connected.</p>
            </div>
          )}
        </div>

        {/* Quick Command Reference */}
        <section className="pt-8">
          <div className="max-w-xs mx-auto p-4 rounded-xl bg-zinc-900/20 border border-white/5 text-center">
            <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">
              Bot Command
            </h5>
            <div className="font-mono text-xs text-zinc-400">
              /setup [channel]
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
