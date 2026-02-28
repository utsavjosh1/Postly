import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../stores/chat.store";
import { useAuthStore } from "../../stores/auth.store";
import { chatService } from "../../services/chat.service";
import { useToastStore } from "../../stores/toast.store";
import { useQuery } from "@tanstack/react-query";
import "../../styles/transmission.css";

/**
 * TransmissionSidebar
 * ───────────────────
 * Brutalist conversation sidebar for the Transmission chat.
 * Hard borders, monospace, 0px radii — matching the design system.
 */

type Role = "seeker" | "recruiter";

interface TransmissionSidebarProps {
  role: Role;
  isOpen: boolean;
  onToggle: () => void;
}

/* ─── Date grouping helper ──────────────────────────────────────────── */
function getDateGroup(dateStr: string | Date | undefined): string {
  if (!dateStr) return "Older";
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const week = new Date(today);
  week.setDate(week.getDate() - 7);

  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  if (d >= week) return "Past 7 Days";
  return "Older";
}

export function TransmissionSidebar({
  role,
  isOpen,
  onToggle,
}: TransmissionSidebarProps) {
  const navigate = useNavigate();
  const accentColor =
    role === "seeker" ? "var(--tx-seeker)" : "var(--tx-recruiter)";

  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: fetchedConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatService.getConversations,
  });

  useEffect(() => {
    if (fetchedConversations) {
      setConversations(fetchedConversations);
    }
  }, [fetchedConversations, setConversations]);

  const handleNewChat = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      // Just navigate to the base chat page — no conversation to load
      navigate(`/chat?role=${role}`);
      // Reset active conversation so the empty state shows
      useChatStore.getState().setActiveConversation(null);
      useChatStore.getState().setMessages([]);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}?role=${role}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await chatService.deleteConversation(deleteId);
      deleteConversation(deleteId);
      addToast({ type: "success", message: "Conversation deleted" });
      if (activeConversationId === deleteId) {
        navigate(`/chat?role=${role}`);
      }
    } catch {
      addToast({ type: "error", message: "Failed to delete" });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, typeof conversations> = {};
    const order = ["Today", "Yesterday", "Past 7 Days", "Older"];
    order.forEach((g) => (groups[g] = []));
    conversations.forEach((c) => {
      const g = getDateGroup(c.created_at || c.updated_at);
      (groups[g] || groups["Older"]).push(c);
    });
    return { groups, order };
  }, [conversations]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 80,
          }}
          className="md:hidden"
        />
      )}

      <aside
        ref={sidebarRef}
        style={{
          width: isOpen ? "280px" : "0px",
          minWidth: isOpen ? "280px" : "0px",
          background: "var(--tx-surface)",
          borderRight: isOpen ? "2px solid var(--tx-border)" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition:
            "width 250ms var(--tx-ease-sharp), min-width 250ms var(--tx-ease-sharp)",
          flexShrink: 0,
          zIndex: 85,
          position: isOpen ? undefined : undefined,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px",
            borderBottom: "2px solid var(--tx-border)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleNewChat}
            disabled={isCreating}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontFamily: "var(--tx-font-mono)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--tx-surface)",
              background: accentColor,
              border: "2px solid var(--tx-border)",
              borderRadius: "var(--tx-radius)",
              cursor: "pointer",
              transition: "opacity 150ms var(--tx-ease-sharp)",
              opacity: isCreating ? 0.6 : 1,
            }}
          >
            + NEW CHAT
          </button>
        </div>

        {/* Conversation list */}
        <div
          className="tx-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px",
          }}
        >
          {conversations.length === 0 && (
            <p
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "11px",
                color: "var(--tx-ink-muted)",
                textAlign: "center",
                padding: "24px 12px",
                letterSpacing: "1px",
              }}
            >
              NO TRANSMISSIONS YET
            </p>
          )}

          {grouped.order.map((group) => {
            const items = grouped.groups[group];
            if (items.length === 0) return null;
            return (
              <div key={group} style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontFamily: "var(--tx-font-mono)",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "var(--tx-ink-muted)",
                    padding: "6px 8px",
                  }}
                >
                  {group}
                </div>
                {items.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSelectConversation(conv.id);
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      padding: "8px 10px",
                      fontFamily: "var(--tx-font-mono)",
                      fontSize: "12px",
                      color:
                        activeConversationId === conv.id
                          ? "var(--tx-ink)"
                          : "var(--tx-ink-muted)",
                      background:
                        activeConversationId === conv.id
                          ? "var(--tx-bg)"
                          : "transparent",
                      borderLeft:
                        activeConversationId === conv.id
                          ? `3px solid ${accentColor}`
                          : "3px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      transition:
                        "background-color 150ms var(--tx-ease-sharp), color 150ms var(--tx-ease-sharp)",
                    }}
                    onMouseEnter={(e) => {
                      if (activeConversationId !== conv.id) {
                        e.currentTarget.style.backgroundColor = "var(--tx-bg)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeConversationId !== conv.id) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {conv.title || "New Chat"}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(conv.id);
                      }}
                      style={{
                        width: "20px",
                        height: "20px",
                        border: "none",
                        background: "transparent",
                        color: "var(--tx-ink-muted)",
                        cursor: "pointer",
                        fontFamily: "var(--tx-font-mono)",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        opacity: 0,
                        transition:
                          "opacity 150ms var(--tx-ease-sharp), color 150ms var(--tx-ease-sharp)",
                      }}
                      className="group-hover-delete"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--tx-seeker)";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--tx-ink-muted)";
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* User profile */}
        <div
          style={{
            padding: "12px",
            borderTop: "2px solid var(--tx-border)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                border: "2px solid var(--tx-border)",
                borderRadius: "var(--tx-radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--tx-font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--tx-ink)",
                flexShrink: 0,
              }}
            >
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <span
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "11px",
                color: "var(--tx-ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.full_name || "User"}
            </span>
          </div>

          <button
            onClick={() => logout()}
            style={{
              fontFamily: "var(--tx-font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--tx-ink-muted)",
              background: "transparent",
              border: "1px solid var(--tx-ink-muted)",
              borderRadius: "var(--tx-radius)",
              padding: "4px 8px",
              cursor: "pointer",
              letterSpacing: "1px",
              textTransform: "uppercase",
              transition:
                "color 150ms var(--tx-ease-sharp), border-color 150ms var(--tx-ease-sharp)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--tx-seeker)";
              e.currentTarget.style.borderColor = "var(--tx-seeker)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--tx-ink-muted)";
              e.currentTarget.style.borderColor = "var(--tx-ink-muted)";
            }}
          >
            EXIT
          </button>
        </div>
      </aside>

      {/* Delete confirmation */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: "var(--tx-surface)",
              border: "2px solid var(--tx-border)",
              borderRadius: "var(--tx-radius)",
              padding: "24px",
              maxWidth: "360px",
              width: "90%",
              fontFamily: "var(--tx-font-mono)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--tx-ink)",
                marginBottom: "8px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Delete Transmission?
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--tx-ink-muted)",
                marginBottom: "20px",
                lineHeight: 1.5,
              }}
            >
              This action is permanent. The chat history will be erased.
            </p>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "8px 16px",
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "var(--tx-ink)",
                  background: "transparent",
                  border: "2px solid var(--tx-border)",
                  borderRadius: "var(--tx-radius)",
                  cursor: "pointer",
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "white",
                  background: "var(--tx-seeker)",
                  border: "2px solid var(--tx-seeker)",
                  borderRadius: "var(--tx-radius)",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                {isDeleting ? "..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
