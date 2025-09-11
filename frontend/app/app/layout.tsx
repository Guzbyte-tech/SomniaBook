import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { WalletGuard } from "@/components/wallet-guard"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WalletGuard>
      <div className="min-h-screen gradient-bg">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </WalletGuard>
  )
}
