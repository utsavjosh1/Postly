import { JobBotHeader } from "@/components/job-bot-header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { PricingSection } from "@/components/pricing-section"
import { InteractiveTerminal } from "@/components/interactive-terminal"
import { ForOwnersCompanies } from "@/components/for-owners-companies"
import { DiscordSetup } from "@/components/discord-setup"
import { SignupSection } from "@/components/signup-section"
import { Footer } from "@/components/footer"

export default function Component() {
  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      <JobBotHeader />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <InteractiveTerminal />
      <ForOwnersCompanies />
      <DiscordSetup />
      <SignupSection />
      <Footer />
    </div>
  )
}
