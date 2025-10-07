import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative min-h-[80vh] md:min-h-[86vh] overflow-hidden rounded-lg" aria-label="Hero">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/background.jpeg)" }}
        aria-hidden="true"
      />
      {/* Subtle overlay for readability using tokens, not raw colors */}
      <div className="absolute inset-0 bg-foreground/5" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-32 md:pt-40">
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-foreground text-balance leading-tight md:leading-[1.15]">
          Shortest way to get hire!
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground text-pretty">
          You give us your resume and we give you jobs.
        </p>

        {/* Input / Glass bar */}
        <div className="mt-8 w-full max-w-2xl rounded-full border border-input bg-card/70 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="inline-flex h-6 items-center rounded-full bg-accent/70 px-2 text-[10px] font-medium text-accent-foreground">
              AI
            </span>
            <input
              aria-label="Prompt"
              placeholder="Ask Loaskii to create an internal tool"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none"
            />
            <button
              aria-label="Send"
              className="inline-flex size-7 items-center justify-center rounded-full border border-input bg-card/60 text-foreground/80 hover:bg-card/80 transition-colors"
            >
              →
            </button>
          </div>

          {/* Chips under the bar */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-input bg-card/70 px-2 py-1 text-[10px] text-muted-foreground">
              ● Attach
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-input bg-card/70 px-2 py-1 text-[10px] text-muted-foreground">
              ◦ Match
            </span>
          </div>
        </div>
      </div>

      {/* Bottom-right Join pill */}
      <div className="absolute bottom-5 right-5 z-10">
        <Button
          variant="outline"
          className="h-7 rounded-full border-foreground/30 bg-card/70 px-4 text-xs text-foreground/90 backdrop-blur-md"
        >
          Join
        </Button>
      </div>
    </section>
  )
}
