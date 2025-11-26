import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function Home() {
  return (
<main className="flex-1">
  {/* Hero Section */}
  <section className="relative py-20 lg:py-32">
    <div className="container px-4 mx-auto max-w-7xl">
      <div className="text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm font-medium bg-primary/10 text-primary rounded-full border border-primary/20"
        >
          <Zap className="h-4 w-4" />
          Built on Celo
        </div>

        {/* Main Heading */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
        >
          Welcome to{" "}
          <span className="text-primary">VerbaChain</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          Start building your decentralized application on Celo. Fast and secure blockchain for everyone.
        </p>


        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <Link href="/nlte">
            <Button size="lg" className="px-8 py-3 text-base font-medium">
              Try NLTE (Natural Language Transactions)
            </Button>
          </Link>
          <Link href="/staking">
            <Button size="lg" variant="outline" className="px-8 py-3 text-base font-medium">
              View My Stakes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>

  {/* Features Section */}
  <section className="py-16 bg-muted/50">
    <div className="container px-4 mx-auto max-w-7xl">
      <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-background p-6 rounded-lg border">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-xl font-bold mb-2">NLTE</h3>
          <p className="text-muted-foreground">
            Send transactions using natural language. Just type what you want to do!
          </p>
          <Link href="/nlte" className="text-primary hover:underline mt-4 inline-block">
            Try it now →
          </Link>
        </div>
        
        <div className="bg-background p-6 rounded-lg border">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold mb-2">Staking</h3>
          <p className="text-muted-foreground">
            Stake your CELO tokens and earn rewards. Flexible or fixed-term options available.
          </p>
          <Link href="/staking" className="text-primary hover:underline mt-4 inline-block">
            View stakes →
          </Link>
        </div>
        
        <div className="bg-background p-6 rounded-lg border">
          <div className="text-4xl mb-4">🎁</div>
          <h3 className="text-xl font-bold mb-2">Rewards</h3>
          <p className="text-muted-foreground">
            Earn up to 15% APY on your staked CELO. Claim rewards anytime!
          </p>
          <Link href="/nlte" className="text-primary hover:underline mt-4 inline-block">
            Claim rewards →
          </Link>
        </div>
      </div>
    </div>
  </section>

</main>
  );
}
