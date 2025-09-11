import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Clock, Users } from "lucide-react"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header with Connect Wallet Button */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ChronoVault
          </div>
          <ConnectWalletButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              ChronoVault
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Time-Locked Multi-Sig Vaults on Somnia
            </p>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Securely lock tokens until a future block or timestamp. Unlock only with majority approvals, fully on-chain.
          </p>

          <div className="pt-8">
            <Link href="/app">
              <Button
                size="lg"
                className="text-lg px-12 py-6 rounded-xl font-semibold bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/80 hover:via-accent/80 hover:to-secondary/80 text-white border-0 glow-button"
              >
                Enter App
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">On-Chain Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your tokens are secured by smart contracts with no centralized control points
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Multi-Sig Protection</h3>
              <p className="text-muted-foreground leading-relaxed">
                Require multiple signatures from trusted parties before unlocking funds
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Time-Locked Access</h3>
              <p className="text-muted-foreground leading-relaxed">
                Set precise unlock times using block numbers or timestamps
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
