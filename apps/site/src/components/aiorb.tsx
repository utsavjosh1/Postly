export const AIOrb: React.FC = () => {
  return (
    <div className="relative h-16 w-16 rounded-full">
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse"
        style={{
          background:
            "conic-gradient(from 45deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
        }}
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent border border-primary/30" />
      <div className="absolute inset-2 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20" />
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 animate-pulse" />
    </div>
  );
};
