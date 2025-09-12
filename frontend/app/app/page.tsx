"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Shield, Users, Plus, Eye } from "lucide-react"
import Link from "next/link"
import {
  getTimeRemaining,
  getStatusColor,
  tokenDetails,
  parseToken,
  formatTimestamp,
} from "@/lib/utils";
import { useVaults } from "@/hooks/useVaults";
import { Vault, VaultStruct } from "@/types/vault";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useAppKit";
import ReleaseFundsModal from "@/components/release-vault-modal";
import { useCallback, useEffect, useState } from "react"


export default function DashboardPage() {
  const [totalValue, setTotalValue] = useState(0);
   const { fetchAllVaults, signVault } = useVaults();
  const [loading, setLoading] = useState(true);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const { address, isConnected } = useWallet();
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<any>(null);

  const loadVaults = useCallback(async () => {
      try {
        // 1. Fetch raw vault arrays from contract
        const vaultSigners = [];
        const data = await fetchAllVaults();
        console.log("Raw vault data:", data);
  
        // 2. Map + fetch signers for each vault
        const mapped = await Promise.all(
          data.map(async (vault: any) => {
            const [
              vaultId,
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
            ] = vault;
  
            const tokenInfo = tokenDetails(tokenAddress);
            const parseValue = await parseToken(
              amount,
              tokenInfo?.decimals as number,
              tokenAddress,
              tokenInfo?.symbol as string
            );
  
            return {
              id: vaultId.toString(),
              token: tokenInfo?.symbol as string,
              name,
              amount: ethers.formatUnits(amount, tokenInfo?.decimals as number),
              unlockTime: formatTimestamp(Number(unlockTimestamp)) as string,
              approvals: Number(currentSignatures ?? 0),
              threshold: Number(requiredSignatures ?? 0),
              status: isWithdrawn
                ? "released"
                : isUnlocked
                ? "ready"
                : ("locked" as "locked" | "ready" | "released"),
              signers: signers,
              createdAt: formatTimestamp(createdAt) as string,
              value: parseValue.usd as string,
            };
          })
        );
  
        const totalUsdValue = mapped.reduce((acc, vault) => {
          const numeric = vault.value
            ? Number(vault.value.replace(/[^0-9.-]+/g, ""))
            : 0;
          return acc + numeric;
        }, 0);
        setTotalValue(Number(totalUsdValue.toFixed(2)));
  
        // 3. Update state
        setVaults(mapped.slice(0, 3));
        console.log("Fetched vaults:", mapped);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching vaults:", err);
      }
    }, [address, isConnected]);
  
    useEffect(() => {
      loadVaults();
    }, [loadVaults]);

     const handleApprove = async (vaultId: string) => {
    console.log(`Approving vault ${vaultId}`);
    // Here you would implement the approval logic
    try {
      const tx = await signVault(BigInt(vaultId));
      await tx.wait();
      console.log("Vault approved:", vaultId);
      loadVaults();
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

  const handleRelease = (vaultId: string) => {
    console.log(`Releasing funds from vault ${vaultId}`);
    const vault = vaults.find((v) => v.id === vaultId);
    if (vault) {
      setSelectedVault(vault);
      setIsReleaseModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading vaults...</p>
      </div>
    );
  }


  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your time-locked vaults</p>
        </div>
        <Link href="/app/create">
          <Button className="glow-button bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Create Vault
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vaults</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vaults.length}</div>
            <p className="text-xs text-muted-foreground">Active vaults</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value Locked</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalValue}</div>
            <p className="text-xs text-muted-foreground">Across all vaults</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready to Unlock</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vaults.filter((v) => v.status === "locked").length}</div>
            <p className="text-xs text-muted-foreground">Awaiting signatures</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Vaults */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">My Vaults</h2>

        <div className="grid gap-4">
          {vaults.map((vault) => (
            <Card
              key={vault.id}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {vault.amount} {vault.token}
                      </h3>
                      <Badge className={getStatusColor(vault.status)}>
                        {vault.status === "ready"
                          ? "Ready to Release"
                          : vault.status === "locked"
                          ? "Time Locked"
                          : "Funds Released"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getTimeRemaining(vault.unlockTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {vault.approvals}/{vault.threshold} approvals
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                                      <Link href={`/app/vault/${vault.id}`}>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="
                                            border-gray-200 
                                            text-gray-300 
                                            bg-transparent 
                                            hover:bg-gray-800/60 
                                            hover:text-white 
                                            transition-colors 
                                            duration-200
                                          "
                                        >
                                          <Eye className="w-4 h-4 mr-2 text-gray-400" />
                                          Details
                                        </Button>
                                      </Link>
                  
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
                                      ) : vault.status === "ready" ? (
                                        <Button
                                          onClick={() => handleRelease(vault.id)}
                                          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg transition-colors duration-200"
                                        >
                                          Release Funds
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={() => handleApprove(vault.id)}
                                          className="bg-[#062E27] text-[#39D4B3] border border-[#39D4B3]/40 rounded-lg hover:bg-[#0A4038] hover:text-[#39D4B3] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={vault.approvals >= vault.threshold}
                                        >
                                          {vault.approvals >= vault.threshold
                                            ? "Fully Approved"
                                            : "Approve"}
                                        </Button>
                                      )}
                                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <ReleaseFundsModal
              isOpen={isReleaseModalOpen}
              onClose={() => setIsReleaseModalOpen(false)}
              vault={selectedVault}
            />
    </div>
  )
}
