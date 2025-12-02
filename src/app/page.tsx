import { WaitlistHero } from "@/components/ui/waitlist-hero"
import { FloatingLoginButton } from "@/components/ui/floating-login-button"
import RankingComponent from "@/components/RankingComponent"
import EarningsExplanation from "@/components/EarningsExplanation"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#09090b] relative">
      <FloatingLoginButton />
      <WaitlistHero />
      <EarningsExplanation />
      <section className="py-12">
        <RankingComponent />
      </section>
    </main>
  )
}
