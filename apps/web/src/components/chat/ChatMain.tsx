import { useChatStore } from "../../stores/chat.store";
import { useAuthStore } from "../../stores/auth.store";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Menu, Sparkles } from "lucide-react";

export function ChatMain() {
  const { activeConversationId, toggleSidebar } = useChatStore();
  const { user } = useAuthStore();

  return (
    <main className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background Ambience - subtle accent color */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-none">
                AI Career Assistant
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Powered by Gemini • {user?.userType === "employer" ? "Recruiter Mode" : "Job Seeker Mode"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 relative min-h-0 flex flex-col">
        {activeConversationId ? <MessageList /> : <EmptyState />}
      </div>

      {/* Input area */}
      {activeConversationId && (
        <div className="shrink-0 z-20">
          <ChatInput />
        </div>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        How can I help you today?
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        I can help you analyze resumes, find relevant jobs, cover letter tips, or provide general career advice.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {SUGGESTIONS.map((suggestion, i) => (
          <button
            key={i}
            className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 hover:border-primary/20 text-left transition-all group"
          >
            <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
              {suggestion.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {suggestion.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  {
    title: "Analyze my resume",
    desc: "Get feedback on strengths and weaknesses",
  },
  {
    title: "Find remote React jobs",
    desc: "Search for latest opportunities",
  },
  {
    title: "Write a cover letter",
    desc: "For a Senior Frontend Developer role",
  },
  {
    title: "Interview prep",
    desc: "Common questions for Engineering Managers",
  },
];
