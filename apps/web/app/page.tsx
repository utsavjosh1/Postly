import { Nav } from "@/components/Navbar"
import { Hero } from "@/components/HeroSection"

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      {/* Frame like the screenshot */}
      <div className="mx-auto max-w-[1280px] p-3">
        <div className="rounded-lg border-2 border-foreground/20">
          <div className="relative">
            <Nav />
            <Hero />
          </div>
        </div>
      </div>
    </main>
  )
}
