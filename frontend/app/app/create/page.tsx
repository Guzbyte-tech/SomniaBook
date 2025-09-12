"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Clock, Users, Shield } from "lucide-react";
import { cn, tokens } from "@/lib/utils";
import { parseUnits } from "ethers";
import { useContract } from "@/hooks/useContract";
import type { TransactionResponse } from "ethers";
import { useERC20 } from "@/hooks/useERC20";
import { VaultSuccessModal } from "@/components/vault-success-modal";


export default function CreateVaultPage() {
  const [selectedToken, setSelectedToken] = useState("");
  const [amount, setAmount] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [unlockTime, setUnlockTime] = useState("");
  const [signers, setSigners] = useState<string[]>([""]);
  const [threshold, setThreshold] = useState("1");
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdVaultData, setCreatedVaultData] = useState<{
    transactionHash: string
    vaultId: string
  } | null>(null)
  const { writeContract, getContract } = useContract();
  

  const addSigner = () => {
    setSigners([...signers, ""]);
  };

  const removeSigner = (index: number) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index));
    }
  };

  const updateSigner = (index: number, value: string) => {
    const newSigners = [...signers];
    newSigners[index] = value;
    setSigners(newSigners);
  };

  const handleCreateVault = async () => {
    try {
      setIsCreating(true);

      const token = tokens.find((t) => t.symbol === selectedToken);
      if (!token) {
        throw new Error("Selected token not found");
      }

      const validSigners = signers.filter(
        (signer) => signer.trim() && isValidAddress(signer)
      );
      if (validSigners.length === 0) throw new Error("No valid signers");

      const requiredSignatures = parseInt(threshold);
      if (requiredSignatures > validSigners.length) {
        throw new Error("Threshold cannot exceed number of signers");
      }

      // 4. Validate amount
      if (!amount || Number(amount) <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      const amountInWei = parseUnits(amount, token.decimals);

      // 5. Validate unlock time
      const unlockTimestamp = Math.floor(
        new Date(`${unlockDate}T${unlockTime}:00Z`).getTime() / 1000
      );
      if (
        isNaN(unlockTimestamp) ||
        unlockTimestamp <= Math.floor(Date.now() / 1000)
      ) {
        throw new Error("Unlock time must be in the future");
      }

      // 6. Fixed params
      const useBlockNumber = false;
      const unlockBlockHeight = 0;
      const vaultName = `${token.symbol} Vault`;

      // 7. Call contract
      let tx: TransactionResponse;


      // 1. Predict vaultId locally (simulation)
      const contract = await getContract();
      const predictedVaultId: bigint = await contract.createVault.staticCall(
        vaultName,
        validSigners,
        requiredSignatures,
        useBlockNumber,
        token.address,
        amountInWei,
        unlockTimestamp,
        unlockBlockHeight,
        { value: token.address === "0x0000000000000000000000000000000000000000" ? amountInWei : 0 }
      );
      console.log("Predicted Vault ID:", predictedVaultId.toString());
      const vaultId = predictedVaultId.toString(); // Use predicted ID for UI

    if (token.address !== "0x0000000000000000000000000000000000000000") {
       // ERC20: ensure allowance
      const { allowance, approve } = useERC20(token.address);
      const userAllowance = await allowance(token.address!, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!);

      if (userAllowance < amountInWei) {
        console.log("Approving tokens...");
        const approveTx = await approve(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, amountInWei);
        await approveTx.wait();
        console.log("Approval confirmed");
      }
    } 
     
      tx = await writeContract("createVault", [
          vaultName,
          validSigners,
          requiredSignatures,
          useBlockNumber,
          token.address,
          amountInWei,
          unlockTimestamp,
          unlockBlockHeight,
        ],{ value: token.address === "0x0000000000000000000000000000000000000000" ? amountInWei : 0 }
      ) as TransactionResponse;
    

      console.log("tx sent:", tx.hash);
      const receipt = await tx.wait();
      if (!receipt) {
        console.warn("Transaction receipt is null");
        return;
      }

      console.log("Vault created successfully!");
      console.log("Vault creation tx:", receipt);
      console.log("tx mined:", receipt.hash);
      setCreatedVaultData({
        transactionHash: receipt?.hash,
        vaultId: vaultId,
      })

      setIsCreating(false);
      setShowSuccessModal(true)
    } catch (err) {
      console.error(err);
      alert((err as Error).message); // simple error feedback
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setCreatedVaultData(null)
    setSelectedToken("")
    setAmount("")
    setUnlockDate("")
    setUnlockTime("")
    setSigners([""])
    setThreshold("1")
  }

  const isValidAddress = (address: string) => {
    return address.length === 42 && address.startsWith("0x");
  };

  const validSigners = signers.filter(
    (signer) => signer.trim() && isValidAddress(signer)
  );
  const maxThreshold = Math.max(1, validSigners.length);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create Vault</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new time-locked multi-signature vault
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Vault Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Selection */}
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue placeholder="Select a token to lock" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50">
                    {tokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.symbol}</span>
                          <span className="text-muted-foreground text-sm">
                            {token.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-input border-border/50"
                />
              </div>

              {/* Unlock Time */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Unlock Time
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="unlock-date"
                      className="text-sm text-muted-foreground"
                    >
                      Date
                    </Label>
                    <Input
                      id="unlock-date"
                      type="date"
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      className="bg-input border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="unlock-time"
                      className="text-sm text-muted-foreground"
                    >
                      Time (UTC)
                    </Label>
                    <Input
                      id="unlock-time"
                      type="time"
                      value={unlockTime}
                      onChange={(e) => setUnlockTime(e.target.value)}
                      className="bg-input border-border/50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signers Configuration */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                Multi-Signature Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Signers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Authorized Signers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSigner}
                    className="border-border/50 bg-transparent"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Signer
                  </Button>
                </div>

                <div className="space-y-3">
                  {signers.map((signer, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="0x..."
                        value={signer}
                        onChange={(e) => updateSigner(index, e.target.value)}
                        className={cn(
                          "bg-input border-border/50 flex-1",
                          signer &&
                            !isValidAddress(signer) &&
                            "border-destructive"
                        )}
                      />
                      {signers.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSigner(index)}
                          className="border-border/50 bg-transparent text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Threshold */}
              <div className="space-y-2">
                <Label htmlFor="threshold">Signature Threshold</Label>
                <Select value={threshold} onValueChange={setThreshold}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50">
                    {Array.from({ length: maxThreshold }, (_, i) => i + 1).map(
                      (num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} of {validSigners.length} signatures required
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Create Button */}
          <Button
            onClick={handleCreateVault}
            disabled={
              !selectedToken ||
              !amount ||
              !unlockDate ||
              !unlockTime ||
              validSigners.length === 0 ||
              isCreating
            }
            className="w-full glow-button bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-lg font-semibold"
          >
            {isCreating ? "Creating Vault..." : "Create Vault"}
          </Button>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Vault Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token:</span>
                  <span className="font-medium">
                    {selectedToken || "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{amount || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unlock Date:</span>
                  <span className="font-medium text-sm">
                    {unlockDate && unlockTime
                      ? new Date(`${unlockDate}T${unlockTime}`).toLocaleString()
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signers:</span>
                  <span className="font-medium">{validSigners.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Threshold:</span>
                  <span className="font-medium">
                    {threshold} of {validSigners.length}
                  </span>
                </div>
              </div>

              {validSigners.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Valid Signers:
                  </Label>
                  <div className="space-y-1">
                    {validSigners.map((signer, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs font-mono"
                      >
                        {signer.slice(0, 6)}...{signer.slice(-4)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-accent mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Security Notice</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Once created, vault parameters cannot be changed. Ensure all
                    details are correct before proceeding.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {createdVaultData && (
        <VaultSuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseSuccessModal}
          transactionHash={createdVaultData.transactionHash}
          vaultId={createdVaultData.vaultId}
          message="Your vault has been created and deployed to the blockchain."
        />
      )}
    </div>
  );
}
