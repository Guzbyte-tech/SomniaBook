"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Shield,
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getTimeRemaining, getStatusColor, tokenDetails, parseToken, formatTimestamp } from "@/lib/utils";
import { useVaults } from "@/hooks/useVaults";
import { Vault, VaultStruct } from "@/types/vault";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useAppKit";
import ReleaseFundsModal from "@/components/release-vault-modal";






export default function VaultsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [totalValue, setTotalValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tokenFilter, setTokenFilter] = useState("all");
  const { fetchAllVaults, signVault } = useVaults();
  const [loading, setLoading] = useState(true);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const { address, isConnected } = useWallet();
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [selectedVault, setSelectedVault] = useState<any>(null)

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
            createdAt
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
            status: (isUnlocked ? "ready" : "locked") as "locked" | "ready",
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
      setVaults(mapped);
      console.log("Fetched vaults:", mapped);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching vaults:", err);
    }
  }, [address, isConnected]); 

  useEffect(() => {
    loadVaults();
  }, [loadVaults]);


  const filteredVaults = vaults.filter((vault) => {
    const matchesSearch =
      vault.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vault.token.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || vault.status === statusFilter;
    const matchesToken = tokenFilter === "all" || vault.token === tokenFilter;

    return matchesSearch && matchesStatus && matchesToken;
  });

  const handleApprove = async(vaultId: string) => {
    console.log(`Approving vault ${vaultId}`);
    // Here you would implement the approval logic
    try {
     const tx = await signVault(BigInt(vaultId));
     await tx.wait();
     console.log("Vault approved:", vaultId);
     loadVaults();
    } catch(err: any) {
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
      throw new Error("Error approving vault", { cause: err });
    } finally {

    }
  };

  const handleRelease = (vaultId: string) => {
    console.log(`Releasing funds from vault ${vaultId}`);
    const vault = vaults.find((v) => v.id === vaultId)
    if (vault) {
      setSelectedVault(vault)
      setIsReleaseModalOpen(true)
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading vaults...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Vaults</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your time-locked vaults
          </p>
        </div>
        <Link href="/app/create">
          <Button className="glow-button bg-accent hover:bg-accent/90 text-accent-foreground">
            Create New Vault
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by vault ID or token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border/50"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-input border-border/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tokenFilter} onValueChange={setTokenFilter}>
                <SelectTrigger className="w-32 bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="all">All Tokens</SelectItem>
                  <SelectItem value="STT">STT</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                  <SelectItem value="WBTC">WBTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vault Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Vaults</p>
                <p className="text-2xl font-bold text-foreground">
                  {vaults.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Locked</p>
                <p className="text-2xl font-bold text-foreground">
                  {vaults.filter((v) => v.status === "locked").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-foreground">
                  {vaults.filter((v) => v.status === "ready").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">${totalValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vaults List */}
      <div className="space-y-4">
        {filteredVaults.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No vaults found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVaults.map((vault) => (
            <Card
              key={vault.id}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Vault Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-foreground">
                        {vault.amount} {vault.token}
                      </h3>
                      <Badge className={getStatusColor(vault.status)}>
                        {vault.status === "ready"
                          ? "Ready to Release"
                          : "Time Locked"}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-mono">
                        {vault.name}-{vault.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Unlock:</span>
                        <span className="font-medium">
                          {getTimeRemaining(vault.unlockTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Approvals:
                        </span>
                        <span className="font-medium">
                          {vault.approvals}/{vault.threshold}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-medium">{vault.value}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
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

                    {vault.status === "ready" ? (
                      <Button
                        onClick={() => handleRelease(vault.id)}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        Release Funds
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleApprove(vault.id)}
                        className="
                          bg-[#062E27] 
                          text-[#39D4B3] 
                          border border-[#39D4B3]/40
                          rounded-lg
                          hover:bg-[#0A4038]
                          hover:text-[#39D4B3]
                          transition-colors 
                          duration-200
                          disabled:opacity-50 
                          disabled:cursor-not-allowed
                        "
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
          ))
        )}
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
