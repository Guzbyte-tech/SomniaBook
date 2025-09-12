"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, ArrowRight, Shield, ExternalLink, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVaults } from "@/hooks/useVaults"

interface Vault {
  id: string
  token: string
  amount: string
  value: string
  threshold: number
  approvals: number
}

interface ReleaseFundsModalProps {
  isOpen: boolean
  onClose: () => void
  vault: Vault | null
}

export default function ReleaseFundsModal({ isOpen, onClose, vault }: ReleaseFundsModalProps) {
  const [step, setStep] = useState<"address" | "confirm" | "processing" | "success">("address")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(false)
  const [txHash, setTxHash] = useState("")
  const { releaseVault } = useVaults()

  // Reset modal state when opened
  const handleOpen = (open: boolean) => {
    if (open) {
      setStep("address")
      setRecipientAddress("")
      setIsValidAddress(false)
      setTxHash("")
    } else {
      onClose()
    }
  }

  // Validate Ethereum address
  const validateAddress = (address: string) => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    const isValid = ethAddressRegex.test(address)
    setIsValidAddress(isValid)
    return isValid
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value
    setRecipientAddress(address)
    validateAddress(address)
  }

  const handleProceedToConfirm = () => {
    if (isValidAddress) {
      setStep("confirm")
    }
  }

  const handleConfirmRelease = async () => {
    setStep("processing")

    try {
        const tx = await releaseVault(BigInt(Number(vault?.id)), recipientAddress);
        await tx.wait();
        console.log("Vault approved:", BigInt(Number(vault?.id)));

        setTxHash(tx.hash)
        setStep("success")

    } catch (err: any) {
        console.log("Error releasing funds:", err);
        console.error("Error approving vault:", err);

      let message = "Transaction failed";

      // ethers v6 puts revert reasons here
      if (err.reason) {
        message = err.reason; // e.g. "Not a signer"
      } else if (err.shortMessage) {
        message = err.shortMessage; // fallback
      } else if (err.data?.message) {
        message = err.data.message;
      } else if (err.message) {
        message = err.message;
      }
      setStep("address")
      setRecipientAddress("")
      setIsValidAddress(false)
      setTxHash("")
      

      // 👉 show in your modal / toast / alert
      alert(message);
      // OR trigger your modal with message
      // showErrorModal(message);

      throw new Error(message, { cause: err });

    }

    
  }

  const handleViewTransaction = () => {
    window.open(`https://shannon-explorer.somnia.network/tx/${txHash}`, "_blank")
  }

  const handleViewAllVaults = () => {
    window.location.href = "/app/vaults"
  }

  if (!vault) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-accent" />
            Release Vault Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {["address", "confirm", "processing", "success"].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                    step === stepName
                      ? "bg-accent text-accent-foreground"
                      : index < ["address", "confirm", "processing", "success"].indexOf(step)
                        ? "bg-accent/50 text-accent-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 mx-1",
                      index < ["address", "confirm", "processing", "success"].indexOf(step) ? "bg-accent" : "bg-muted",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === "address" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Enter Recipient Address</h3>
                <p className="text-sm text-muted-foreground">
                  Specify the Ethereum address where you want to send the vault funds.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={handleAddressChange}
                  className={cn(
                    "font-mono text-sm",
                    recipientAddress && !isValidAddress && "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {recipientAddress && !isValidAddress && (
                  <p className="text-xs text-destructive">Please enter a valid Ethereum address</p>
                )}
              </div>

              <Card className="bg-muted/20 border-border/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Vault:</span>
                    <span className="font-mono">{vault.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">
                      {vault.amount} {vault.token}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-medium">{vault.value}</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleProceedToConfirm}
                disabled={!isValidAddress}
                className="w-full glow-button bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Confirm Release</h3>
                <p className="text-sm text-muted-foreground">
                  ⚠️ This action cannot be undone. Once released, the funds cannot be retrieved.
                </p>
              </div>

              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">From Vault:</span>
                    <span className="font-mono text-xs">{vault.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">To Address:</span>
                    <span className="font-mono text-xs">
                      {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Amount:</span>
                    <span>
                      {vault.amount} {vault.token}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Value:</span>
                    <span>{vault.value}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("address")}
                  className="flex-1 border-border/50 bg-transparent"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmRelease}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Confirm Release
                </Button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="space-y-4 text-center py-8">
              <div className="w-16 h-16 mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent/20 border-t-accent"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Processing Transaction</h3>
                <p className="text-sm text-muted-foreground">
                  Please confirm the transaction in your wallet and wait for blockchain confirmation.
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Funds Released Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  The vault funds have been successfully released to the recipient address.
                </p>
              </div>

              <Card className="bg-muted/20 border-border/50">
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction:</span>
                    <span className="font-mono text-xs">
                      {txHash.slice(0, 6)}...{txHash.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">
                      {vault.amount} {vault.token}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient:</span>
                    <span className="font-mono text-xs">
                      {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleViewTransaction}
                  className="flex-1 border-border/50 bg-transparent"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Transaction
                </Button>
                <Button
                  onClick={handleViewAllVaults}
                  className="flex-1 glow-button bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  View All Vaults
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
