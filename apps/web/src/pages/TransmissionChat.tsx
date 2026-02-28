import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useChatStore } from "../stores/chat.store";
import { useSSEChat } from "../hooks/useSSEChat";
import { chatService } from "../services/chat.service";
import { resumeService } from "../services/resume.service";
import { useToastStore } from "../stores/toast.store";
import { TransmissionOnboarding } from "../components/chat/TransmissionOnboarding";
import { TransmissionSidebar } from "../components/chat/TransmissionSidebar";
import ReactMarkdown from "react-markdown";
import type { Message, Job } from "@postly/shared-types";
import { JobCarousel } from "../components/chat/JobCarousel";
import { toOptimizedJobMatch } from "../lib/job-utils";
import "../styles/transmission.css";

/**
 * TransmissionChat — Production-Ready
 * ─────────────────────────────────────
 * Neo-brutalist chat with full API integration.
 * - Uses `useSSEChat` for streaming (auto-creates conversations)
 * - Renders markdown via ReactMarkdown
 * - Renders job carousels from message metadata
 * - Loads conversation by URL param `:id`
 * - Sidebar for conversation history
 * - Resume attachment support
 */

type Role = "seeker" | "recruiter";

/* ─── Placeholder messages for empty state ─────────────────────────── */
const WELCOME: Record<Role, string> = {
  seeker:
    "TRANSMISSION READY. I'm your AI career signal. Describe your stack, experience, and what you're hunting for — or use the **MY PROFILE** button to fill in your details.",
  recruiter:
    "TRANSMISSION READY. I'm your AI talent radar. Define the role — title, seniority, must-have skills — or use the **ROLE BRIEF** button to structure your requirements.",
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function TransmissionChat() {
  const [searchParams] = useSearchParams();
  const { id: conversationIdParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = (searchParams.get("role") as Role) || "seeker";
  const accentColor =
    role === "seeker" ? "var(--tx-seeker)" : "var(--tx-recruiter)";
  const accentHex = role === "seeker" ? "#FF3D00" : "#0038FF";

  /* ─── Store ──────────────────────────────────────────────────────── */
  const messages = useChatStore((s) => s.messages);
  const conversationState = useChatStore((s) => s.conversationState);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setMessages = useChatStore((s) => s.setMessages);
  const setLoading = useChatStore((s) => s.setLoading);
  const setActiveResumeId = useChatStore((s) => s.setActiveResumeId);
  const { sendMessage, stopGeneration } = useSSEChat();
  const { addToast } = useToastStore();

  /* ─── Local State ────────────────────────────────────────────────── */
  const [input, setInput] = useState("");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sendPulse, setSendPulse] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    status: "uploading" | "done" | "error";
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBlocking =
    conversationState === "thinking" || conversationState === "streaming";

  /* ─── Sync URL → store (load conversation) ───────────────────────── */
  useEffect(() => {
    if (conversationIdParam) {
      setActiveConversation(conversationIdParam);
      setLoading(true);
      chatService
        .getConversation(conversationIdParam)
        .then(({ messages: msgs }) => setMessages(msgs))
        .catch((err) => {
          console.error("Failed to load conversation:", err);
          addToast({ type: "error", message: "Failed to load conversation" });
        })
        .finally(() => setLoading(false));
    } else {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [
    conversationIdParam,
    setActiveConversation,
    setMessages,
    setLoading,
    addToast,
  ]);

  /* ─── Watch for new conversation creation (from useSSEChat) ───────── */
  useEffect(() => {
    // After useSSEChat creates a conversation, update URL to include it
    if (activeConversationId && !conversationIdParam) {
      navigate(`/chat/${activeConversationId}?role=${role}`, {
        replace: true,
      });
    }
  }, [activeConversationId, conversationIdParam, role, navigate]);

  /* ─── Auto-scroll ────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, streamingContent]);

  /* ─── Auto-resize textarea ───────────────────────────────────────── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  /* ─── Send handler (delegates to useSSEChat) ─────────────────────── */
  const handleSend = useCallback(async () => {
    if (!input.trim() || isBlocking) return;
    const msg = input.trim();
    setInput("");
    setSendPulse(true);
    setTimeout(() => setSendPulse(false), 400);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(msg);
  }, [input, isBlocking, sendMessage]);

  /* ─── Resume upload ──────────────────────────────────────────────── */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowed.includes(file.type)) {
      addToast({ type: "error", message: "Only PDF/DOCX files are allowed" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: "error", message: "File must be under 5MB" });
      return;
    }
    setAttachedFile({ name: file.name, status: "uploading" });
    try {
      const resume = await resumeService.uploadResume(file);
      setAttachedFile({ name: file.name, status: "done" });
      setActiveResumeId(resume.id);
      addToast({ type: "success", message: "Resume attached" });
    } catch {
      setAttachedFile({ name: file.name, status: "error" });
      addToast({ type: "error", message: "Upload failed" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setActiveResumeId(null);
  };

  /* ─── Onboarding panel ───────────────────────────────────────────── */
  const handleOnboardingSubmit = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  /* ─── Keyboard ───────────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        background: "var(--tx-bg)",
        fontFamily: "var(--tx-font-mono)",
        color: "var(--tx-ink)",
      }}
    >
      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <TransmissionSidebar
        role={role}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* ─── MAIN AREA ───────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "2px solid var(--tx-border)",
            background: "var(--tx-surface)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "16px",
                color: "var(--tx-ink)",
                background: "transparent",
                border: "2px solid var(--tx-border)",
                borderRadius: "var(--tx-radius)",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition:
                  "background-color 150ms var(--tx-ease-sharp), color 150ms var(--tx-ease-sharp)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--tx-ink)";
                e.currentTarget.style.color = "var(--tx-surface)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--tx-ink)";
              }}
            >
              ☰
            </button>

            {/* Back to landing */}
            <button
              onClick={() => navigate("/")}
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--tx-ink)",
                background: "transparent",
                border: "2px solid var(--tx-border)",
                borderRadius: "var(--tx-radius)",
                padding: "6px 10px",
                cursor: "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition:
                  "background-color 150ms var(--tx-ease-sharp), color 150ms var(--tx-ease-sharp)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--tx-ink)";
                e.currentTarget.style.color = "var(--tx-surface)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--tx-ink)";
              }}
            >
              ← EXIT
            </button>

            {/* Role indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: accentColor,
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: accentColor,
                }}
              >
                {role === "seeker" ? "SEEKING" : "HIRING"}
              </span>
            </div>
          </div>

          {/* Right side buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Resume attach button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--tx-ink)",
                background: "transparent",
                border: "2px solid var(--tx-border)",
                borderRadius: "var(--tx-radius)",
                padding: "6px 10px",
                cursor: "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition:
                  "background-color 150ms var(--tx-ease-sharp), color 150ms var(--tx-ease-sharp)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--tx-ink)";
                e.currentTarget.style.color = "var(--tx-surface)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--tx-ink)";
              }}
            >
              📎 RESUME
            </button>

            {/* Onboarding toggle */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--tx-surface)",
                background: accentColor,
                border: "2px solid var(--tx-border)",
                borderRadius: "var(--tx-radius)",
                padding: "6px 12px",
                cursor: "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition: "opacity 150ms var(--tx-ease-sharp)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {role === "seeker" ? "MY PROFILE" : "ROLE BRIEF"}
            </button>
          </div>
        </header>

        {/* ─── MESSAGES ───────────────────────────────────────────────── */}
        <div
          className="tx-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}
        >
          <div
            style={{
              maxWidth: "720px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Attached file chip */}
            {attachedFile && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  border: `2px solid ${attachedFile.status === "done" ? accentHex : attachedFile.status === "error" ? "var(--tx-seeker)" : "var(--tx-border)"}`,
                  borderRadius: "var(--tx-radius)",
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "11px",
                  color: "var(--tx-ink)",
                  alignSelf: "flex-start",
                }}
              >
                <span>
                  {attachedFile.status === "uploading"
                    ? "⟳"
                    : attachedFile.status === "done"
                      ? "✓"
                      : "✕"}{" "}
                  {attachedFile.name}
                </span>
                {attachedFile.status !== "uploading" && (
                  <button
                    onClick={handleRemoveFile}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--tx-ink-muted)",
                      cursor: "pointer",
                      fontFamily: "var(--tx-font-mono)",
                      fontSize: "14px",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* Welcome message (empty state) */}
            {messages.length === 0 && !streamingContent && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: accentColor,
                    marginBottom: "4px",
                  }}
                >
                  SIGNAL
                </span>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "14px 16px",
                    background: "var(--tx-surface)",
                    border: "2px solid var(--tx-border)",
                    borderRadius: "var(--tx-radius)",
                    fontSize: "13px",
                    lineHeight: "1.65",
                  }}
                >
                  <ReactMarkdown>{WELCOME[role]}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Real messages */}
            {messages.map((msg) => (
              <TxMessage
                key={msg.id}
                message={msg}
                accentColor={accentColor}
                accentHex={accentHex}
              />
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: accentColor,
                    marginBottom: "4px",
                  }}
                >
                  SIGNAL
                </span>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "14px 16px",
                    background: "var(--tx-surface)",
                    border: "2px solid var(--tx-border)",
                    borderRadius: "var(--tx-radius)",
                    fontSize: "13px",
                    lineHeight: "1.65",
                  }}
                >
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  <span
                    className="tx-carrier-wave"
                    style={{
                      display: "inline-block",
                      width: "2px",
                      height: "14px",
                      background: accentColor,
                      marginLeft: "2px",
                      verticalAlign: "text-bottom",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Thinking */}
            {conversationState === "thinking" && !streamingContent && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: accentColor,
                    marginBottom: "4px",
                  }}
                >
                  SIGNAL
                </span>
                <div
                  style={{
                    padding: "14px 16px",
                    background: "var(--tx-surface)",
                    border: "2px solid var(--tx-border)",
                    borderRadius: "var(--tx-radius)",
                    fontSize: "13px",
                    color: "var(--tx-ink-muted)",
                    letterSpacing: "2px",
                  }}
                >
                  <span
                    className="tx-carrier-wave"
                    style={{ display: "inline-block" }}
                  >
                    PROCESSING SIGNAL ···
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ─── INPUT FOOTER ───────────────────────────────────────────── */}
        <div
          style={{
            padding: "16px 20px 20px",
            borderTop: "2px solid var(--tx-border)",
            background: "var(--tx-surface)",
            flexShrink: 0,
          }}
        >
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                border: "2px solid var(--tx-border)",
                borderRadius: "var(--tx-radius)",
                background: "var(--tx-surface)",
                overflow: "hidden",
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  role === "seeker"
                    ? "Describe what you're looking for..."
                    : "Describe the candidate you need..."
                }
                disabled={isBlocking && conversationState !== "thinking"}
                rows={1}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "13px",
                  color: "var(--tx-ink)",
                  lineHeight: "1.5",
                  maxHeight: "160px",
                  minHeight: "44px",
                }}
              />

              {isBlocking ? (
                <button
                  onClick={stopGeneration}
                  style={{
                    width: "52px",
                    background: "var(--tx-ink)",
                    border: "none",
                    borderLeft: "2px solid var(--tx-border)",
                    borderRadius: "var(--tx-radius)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "opacity 150ms var(--tx-ease-sharp)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      background: "var(--tx-surface)",
                    }}
                  />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={sendPulse ? "tx-signal-pulse tx-button-press" : ""}
                  style={
                    {
                      width: "52px",
                      background: input.trim()
                        ? accentHex
                        : "var(--tx-ink-muted)",
                      border: "none",
                      borderLeft: "2px solid var(--tx-border)",
                      borderRadius: "var(--tx-radius)",
                      cursor: input.trim() ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background-color 150ms var(--tx-ease-sharp)",
                      "--tx-pulse-color": accentHex,
                    } as React.CSSProperties
                  }
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </div>

            <p
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "9px",
                color: "var(--tx-ink-muted)",
                textAlign: "center",
                marginTop: "8px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              AI can make mistakes. Verify critical information.
            </p>
          </div>
        </div>
      </div>

      {/* ─── ONBOARDING PANEL ────────────────────────────────────────── */}
      <TransmissionOnboarding
        role={role}
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmitPrompt={handleOnboardingSubmit}
      />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* MESSAGE COMPONENT                                                     */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function TxMessage({
  message,
  accentColor,
  accentHex,
}: {
  message: Message;
  accentColor: string;
  accentHex: string;
}) {
  const isAI = message.role === "assistant";

  return (
    <div
      className={!isAI ? "tx-msg-slide-in" : ""}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isAI ? "flex-start" : "flex-end",
      }}
    >
      {/* Sender label */}
      <span
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: isAI ? accentColor : "var(--tx-ink-muted)",
          marginBottom: "4px",
        }}
      >
        {isAI ? "SIGNAL" : "YOU"}
      </span>

      {/* Message content */}
      <div
        style={{
          maxWidth: "85%",
          padding: "14px 16px",
          background: isAI ? "var(--tx-surface)" : accentHex,
          color: isAI ? "var(--tx-ink)" : "#FFFFFF",
          border: `2px solid ${isAI ? "var(--tx-border)" : accentHex}`,
          borderRadius: "var(--tx-radius)",
          fontFamily: "var(--tx-font-mono)",
          fontSize: "13px",
          lineHeight: "1.65",
        }}
      >
        {isAI ? (
          <div className="tx-prose">
            <ReactMarkdown
              components={{
                /* Inline code */
                code: ({ children, className, ...props }) => {
                  const isBlock = className?.startsWith("language-");
                  if (isBlock) {
                    return (
                      <div
                        style={{
                          margin: "8px 0",
                          border: "2px solid var(--tx-border)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "6px 12px",
                            background: "var(--tx-ink)",
                            color: "var(--tx-bg)",
                            fontSize: "10px",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                          }}
                        >
                          CODE
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            padding: "12px",
                            overflowX: "auto",
                            background: "#0D0D0D",
                            color: "#E8E6E3",
                            fontSize: "12px",
                          }}
                        >
                          <code {...props}>{children}</code>
                        </pre>
                      </div>
                    );
                  }
                  return (
                    <code
                      style={{
                        background: "var(--tx-bg)",
                        padding: "2px 6px",
                        border: "1px solid var(--tx-border)",
                        fontSize: "12px",
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                /* Links */
                a: ({ children, href, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: accentColor, textDecoration: "underline" }}
                    {...props}
                  >
                    {children}
                  </a>
                ),
                /* Strong */
                strong: ({ children, ...props }) => (
                  <strong style={{ fontWeight: 700 }} {...props}>
                    {children}
                  </strong>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Job carousels from metadata */}
            {message.metadata?.job_matches &&
              Array.isArray(message.metadata.job_matches) &&
              message.metadata.job_matches.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <JobCarousel
                    message=""
                    data={(
                      message.metadata.job_matches as unknown as Job[]
                    ).map((job) => toOptimizedJobMatch(job))}
                    onApply={(id) => console.log("Apply to job:", id)}
                  />
                </div>
              )}
          </div>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}
