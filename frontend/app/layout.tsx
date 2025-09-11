import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import AppKitProvider from "@/components/AppkitProvider"

export const metadata: Metadata = {
  title: "ChronoVault - Time-Locked Multi-Sig Vaults",
  description:
    "Securely lock tokens until a future block or timestamp. Unlock only with majority approvals, fully on-chain.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} gradient-bg min-h-screen`}>
        <AppKitProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </AppKitProvider>
        <Analytics />
      </body>
    </html>
  )
}
