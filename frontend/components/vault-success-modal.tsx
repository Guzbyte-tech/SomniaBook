"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, ExternalLink, Eye } from "lucide-react"
import Link from "next/link"

interface VaultSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  transactionHash: string
  vaultId: string
}

export function VaultSuccessModal({ isOpen, onClose, transactionHash, vaultId }: VaultSuccessModalProps) {
  const explorerUrl = `https://shannon-explorer.somnia.network/tx/${transactionHash}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 backdrop-blur-sm border-border/50 max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary via-accent to-secondary rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Vault Created Successfully!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Your vault has been created and deployed to the blockchain.</p>
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-sm font-mono text-foreground">Vault ID: {vaultId}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full border-border/50 bg-transparent hover:bg-muted/20">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Transaction
              </a>
            </Button>

            <Button
              asChild
              className="w-full glow-button bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90"
            >
              <Link href="/app/vaults" className="flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View All Vaults
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
