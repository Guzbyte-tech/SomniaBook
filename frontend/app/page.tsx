"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Clock, Users, Zap, Lock, TrendingUp, Star, ArrowRight, CheckCircle } from "lucide-react"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import Link from "next/link"
import Image from "next/image";

import { useEffect, useState } from "react"

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
          }
        })
      },
      { threshold: 0.1 },
    )

    const scrollElements = document.querySelectorAll(".scroll-reveal")
    scrollElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen gradient-bg overflow-hidden">
      {/* Header with Connect Wallet Button */}
      <header className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center">
          <div
            className={`text-2xl font-bold gradient-text transition-all duration-1000 ${isVisible ? "animate-slide-in-left" : "opacity-0"}`}
          >
            <Link href="/">
                <Image
                  src="/logo_1.png"
                  alt="ChronoVault Logo"
                  width={180}
                  height={60}
                  className="h-10 w-auto"
                />
            </Link>
            
          </div>
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? "animate-slide-in-right" : "opacity-0"}`}
          >
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 relative">
        <div className="text-center space-y-8 max-w-4xl mx-auto hero-glow">
          {/* Logo/Brand */}
          <div
            className={`space-y-6 transition-all duration-1000 delay-500 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <h1 className="text-6xl md:text-8xl font-bold gradient-text animate-float">ChronoVault</h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium animate-pulse-slow">
              Time-Locked Multi-Sig Vaults on Somnia
            </p>
          </div>

          {/* Description */}
          <div className={`transition-all duration-1000 delay-700 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed mb-6">
              Securely lock tokens until a future block or timestamp. Unlock only with majority approvals, fully
              on-chain.
            </p>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Built for the next generation of DeFi, ChronoVault combines time-based security with multi-signature
              protection.
            </p>
          </div>

          <div
            className={`pt-8 transition-all duration-1000 delay-1000 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <Link href="/app">
              <Button
                size="lg"
                className="text-lg px-12 py-6 rounded-xl font-semibold bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/80 hover:via-accent/80 hover:to-secondary/80 text-white border-0 glow-button group"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: Shield,
              title: "On-Chain Security",
              description:
                "Your tokens are secured by smart contracts with no centralized control points. Every transaction is transparent and verifiable.",
              color: "primary",
              delay: "delay-200",
            },
            {
              icon: Users,
              title: "Multi-Sig Protection",
              description:
                "Require multiple signatures from trusted parties before unlocking funds. Customize thresholds for maximum security.",
              color: "secondary",
              delay: "delay-400",
            },
            {
              icon: Clock,
              title: "Time-Locked Access",
              description:
                "Set precise unlock times using block numbers or timestamps. Perfect for vesting schedules and delayed releases.",
              color: "accent",
              delay: "delay-600",
            },
          ].map((feature, index) => (
            <Card
              key={index}
              className={`scroll-reveal ${feature.delay} bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 hover:scale-105 transition-all duration-500 group`}
            >
              <CardContent className="p-8 text-center space-y-6">
                <div
                  className={`w-20 h-20 mx-auto bg-${feature.color}/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-10 h-10 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works Section */}
        <section className="mt-32 max-w-6xl mx-auto">
          <div className="scroll-reveal text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, secure, and transparent. Create your vault in three easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create Vault",
                description: "Set up your time-locked vault with custom parameters, signers, and unlock conditions.",
                icon: Lock,
              },
              {
                step: "02",
                title: "Lock Tokens",
                description:
                  "Deposit your tokens into the secure vault. They'll remain locked until the specified time.",
                icon: Zap,
              },
              {
                step: "03",
                title: "Unlock & Release",
                description: "When the time comes, gather signatures from your trusted parties to release the funds.",
                icon: TrendingUp,
              },
            ].map((step, index) => (
              <div key={index} className={`scroll-reveal delay-${(index + 1) * 200} text-center group`}>
                <div className="relative mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mt-32 max-w-4xl mx-auto">
          <div className="scroll-reveal bg-card/30 backdrop-blur-sm rounded-2xl p-12 border border-border/50">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { value: "$2.5M+", label: "Total Value Locked" },
                { value: "1,200+", label: "Vaults Created" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mt-32 max-w-6xl mx-auto">
          <div className="scroll-reveal text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">Trusted by DeFi Leaders</h2>
            <p className="text-xl text-muted-foreground">See what our users are saying about ChronoVault</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote:
                  "ChronoVault has revolutionized how we handle token vesting. The multi-sig security gives us complete peace of mind.",
                author: "Sarah Chen",
                role: "DeFi Protocol Founder",
                rating: 5,
              },
              {
                quote:
                  "The time-lock feature is exactly what we needed for our treasury management. Highly recommended!",
                author: "Marcus Rodriguez",
                role: "DAO Treasurer",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className={`scroll-reveal delay-${(index + 1) * 200} bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300`}
              >
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-accent fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-foreground/90 mb-6 text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.author}</div>
                      <div className="text-muted-foreground text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-32 text-center">
          <div className="scroll-reveal bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-2xl p-16 border border-border/50 backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">Ready to Secure Your Future?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust ChronoVault with their digital assets. Start creating secure,
              time-locked vaults today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/app">
                <Button
                  size="lg"
                  className="text-lg px-12 py-6 rounded-xl font-semibold bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/80 hover:via-accent/80 hover:to-secondary/80 text-white border-0 glow-button group"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-accent mr-2" />
                No setup fees • Fully decentralized
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
