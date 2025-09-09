import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AppKitProvider from "@/components/AppkitProvider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "SomniaBook - Real-Time Prediction Markets",
  description: "Bet as it happens, get paid instantly. Real-time prediction markets for sports, crypto, and more.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-sans antialiased">
        <AppKitProvider>
          {children}
        </AppKitProvider>
        
      </body>
    </html>
  )
}
