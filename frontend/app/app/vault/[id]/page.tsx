"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Copy,
  ExternalLink,
  AlertTriangle,
  Calendar,
  Coins,
} from "lucide-react";
import {
  cn,
  getTimeRemaining,
  getStatusColor,
  tokenDetails,
  parseToken,
  formatTimestamp,
  copyToClipboard,
  getTimeRemaining_T,
  formatDateTimeClean
} from "@/lib/utils";
import { useVaults } from "@/hooks/useVaults";
import { Vault, VaultDetail, VaultLog, VaultStruct } from "@/types/vault";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useAppKit";
import ReleaseFundsModal from "@/components/release-vault-modal";
import { useBackend } from "@/hooks/useBackend";

import { v4 as uuidv4 } from "uuid";

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState({
    text: "",
    expired: false,
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const { fetchAllVaults, signVault, fetchVault, hasSignedVault } = useVaults();
  const [loading, setLoading] = useState(true);
  const [vault, setVault] = useState<VaultDetail>();
  const { address, isConnected } = useWallet();
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<any>(null);
  const { createTransactionLog, fetchLogByVaultId } = useBackend();
  const [transactionLogs, setTransactionLogs] = useState<VaultLog[]>([]);

  

  const vaultId = params.id as unknown;
  // const vault = mockVaultData[vaultId as keyof typeof mockVaultData]

  const loadVault = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchVault(vaultId as bigint);
      console.log("Raw vault data:", data);
      const [
        id,
        name,
        creator,
        signers,
        requiredSignatures,
        tokenAddress,
        amount,
        unlockTimestamp,
        unlockBlockHeight,
        useBlockNumber,
        isUnlocked,
        isWithdrawn,
        currentSignatures,
        createdAt,
      ] = data as any[];

      const tokenInfo = tokenDetails(tokenAddress);
      const parseValue = await parseToken(
        amount,
        tokenInfo?.decimals as number,
        tokenAddress,
        tokenInfo?.symbol as string
      );

      // const hasSigned = await hasSignedVault(id, address);


      const vaultData: VaultDetail = {
        id,
        name,
        token: tokenInfo?.symbol ?? "UNKNOWN",
        amount: ethers.formatUnits(amount, tokenInfo?.decimals as number),
        unlockTime: formatTimestamp(Number(unlockTimestamp)) as string,
        approvals: Number(currentSignatures ?? 0),
        threshold: Number(requiredSignatures ?? 0),
        status: isWithdrawn ? "released" : isUnlocked ? "ready" : "locked",
        value: parseValue.usd as string,
        createdAt,
        creator,
        contractAddress: "",
        // Optional fields if you want to populate them later
        signers: signers.map( (addr: string) => ({
          address: addr,
          name: addr, // later you can resolve ENS or DB name
          approved:  hasSignedVault(id, addr),
          approvedAt: "",
        })),
        transactions: [],
      };

      console.log("Parsed vault:", vaultData);
      // return vault;
      setVault(vaultData);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching vault:", error);
    }
  }, [vaultId, address, isConnected]);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  useEffect(() => {
    if (!vault) return;

    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining_T(vault.unlockTime) as any);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [vault]);

  const handleRelease = (vaultId: string) => {
    console.log(`Releasing funds from vault ${vaultId}`);
    
    if (vault) {
      setSelectedVault(vault);
      setIsReleaseModalOpen(true);
    }
  };

   const handleApprove = async (vaultId: string) => {
    console.log(`Approving vault ${vaultId}`);
    // Here you would implement the approval logic
    try {
      const tx = await signVault(BigInt(vaultId));
      await tx.wait();
      console.log("Vault approved:", vaultId);

      const cuuid: string = uuidv4();
      await createTransactionLog({
        uuid: cuuid,
        vaultId: vaultId.toString(),
        txType: "approve",
        signer: address,
        txHash: tx.hash
      });
      loadVault();
    } catch (err: any) {
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

      // 👉 show in your modal / toast / alert
      alert(message);
      // OR trigger your modal with message
      // showErrorModal(message);

      throw new Error(message, { cause: err });
    }
  };

  // Fetch transaction Log
  useEffect(() => {
    if (!vault) return;

    const loadLogs = async () => {
      try {
        const logs = await fetchLogByVaultId(Number(vault.id));
        setTransactionLogs(logs)
        console.log("Vault logs:", logs);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };
    
    loadLogs();
}, [vault]);

  if (!vault) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Vault not found
            </h3>
            <p className="text-muted-foreground">
              The requested vault does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const approvalProgress = (vault.approvals / vault.threshold) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vault Details</h1>
          <p className="text-muted-foreground mt-1 font-mono">{vault.id}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vault Overview */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6 text-primary" />
                  Vault Overview
                </div>
                <Badge
                  className={
                    vault.status === "ready"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }
                >
                  {vault.status === "ready"
                    ? "Ready to Release"
                    : "Time Locked"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Token</p>
                  <p className="text-2xl font-bold text-foreground">
                    {vault.token}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    {vault.amount}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    {vault.value}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {vault.status}
                  </p>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {timeRemaining.expired
                      ? "Unlock Time Reached"
                      : "Time Until Unlock"}
                  </h3>
                </div>
                <p
                  className={cn(
                    "text-3xl font-bold mb-2",
                    timeRemaining.expired ? "text-accent" : "text-foreground"
                  )}
                >
                  {timeRemaining.text}
                </p>
                <p className="text-sm text-muted-foreground">
                  Unlock Date: {new Date(vault.unlockTime).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signers Status */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="w-6 h-6 text-secondary" />
                Multi-Signature Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Approval Progress
                  </span>
                  <span className="font-medium">
                    {vault.approvals}/{vault.threshold} signatures
                  </span>
                </div>
                <Progress value={approvalProgress} className="h-2" />
              </div>

              {/* Signers List */}
              <div className="space-y-3">
                {vault.signers.map((signer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {signer.approved ? (
                        <CheckCircle className="w-5 h-5 text-accent" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {signer.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-mono">
                            {signer.address.slice(0, 6)}...
                            {signer.address.slice(-4)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(signer.address)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {signer.approved ? (
                        <div>
                          <Badge
                            variant="outline"
                            className="text-accent border-accent/50"
                          >
                            Approved
                          </Badge>
                          {signer.approvedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(signer.approvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactionLogs.map((tx, index) => (
                  <div
                    key={tx.uuid}
                    className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground capitalize">
                          {tx.txType}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        By: {tx.signer.slice(0, 6)}...{tx.signer.slice(-4)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://shannon-explorer.somnia.network/tx/${tx.txHash}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vault.status === "released" ? (
                                    <Button
                                      disabled
                                      className="
                                        bg-gray-800 
                                        text-gray-400 
                                        border border-gray-600/50
                                        rounded-lg
                                        cursor-not-allowed
                                      "
                                    >
                                      Funds Released
                                    </Button>
                ) : 
              vault.status === "ready" ? (
                <Button className="w-full glow-button bg-accent hover:bg-accent/90 text-accent-foreground py-6"                    onClick={() => handleRelease(vault.id as any)}>
                  <Shield className="w-4 h-4 mr-2" />
                  Release Funds
                </Button>
              ) : (
                <Button
                onClick={() => handleApprove(vault.id as any)}
                  className="bg-[#062E27] text-[#39D4B3] border border-[#39D4B3]/40 rounded-lg hover:bg-[#0A4038] hover:text-[#39D4B3] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  variant="outline"
                  disabled={vault.approvals >= vault.threshold}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {vault.approvals >= vault.threshold
                    ? "Fully Approved"
                    : "Approve Transaction"}
                </Button>
              )}

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Vault ID
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Vault Info */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Vault Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {formatDateTimeClean(formatTimestamp(Number(vault.createdAt)))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator:</span>
                  <span className="font-mono text-xs">
                    {vault.creator.slice(0, 6)}...{vault.creator.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="font-mono text-xs">
                    {vault.contractAddress.slice(0, 6)}...
                    {vault.contractAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Threshold:</span>
                  <span className="font-medium">
                    {vault.threshold} of {vault.signers.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Release Funds Modal */}
      <ReleaseFundsModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        vault={selectedVault}
      />
    </div>
  );
}
