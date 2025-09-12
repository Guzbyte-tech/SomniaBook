export type VaultStruct = {
  vaultId: bigint
  name: string
  creator: string
  requiredSignatures: bigint
  tokenAddress: string
  amount: bigint
  unlockTimestamp: bigint
  unlockBlockHeight: bigint
  useBlockNumber: boolean
  createdAt: bigint
  signers: string[]
  isUnlocked: boolean
  currentSignatures?: bigint
}

export type Vault = {
  id: string
  name: string
  token: string
  amount: string
  unlockTime: string
  approvals: number
  threshold: number
  status: "locked" | "ready" | "released"
  signers: { address: string; approved: boolean }[],
  createdAt: string
  value?: string
}

// Extended mock data for vault management
export const mockVaults = [
  {
    id: "vault-001",
    token: "ETH",
    amount: "10.5",
    unlockTime: "2024-12-25T00:00:00Z",
    approvals: 2,
    threshold: 3,
    status: "locked",
    signers: ["0x1234...5678", "0x9abc...def0", "0x5678...9abc"],
    createdAt: "2024-01-15T10:30:00Z",
    value: "$26,250",
  },
  {
    id: "vault-002",
    token: "USDC",
    amount: "50000",
    unlockTime: "2024-11-15T12:00:00Z",
    approvals: 3,
    threshold: 3,
    status: "ready",
    signers: ["0x1234...5678", "0x9abc...def0", "0x5678...9abc"],
    createdAt: "2024-01-10T14:20:00Z",
    value: "$50,000",
  },
  {
    id: "vault-003",
    token: "DAI",
    amount: "25000",
    unlockTime: "2025-03-01T00:00:00Z",
    approvals: 1,
    threshold: 2,
    status: "locked",
    signers: ["0x1234...5678", "0x9abc...def0"],
    createdAt: "2024-02-01T09:15:00Z",
    value: "$25,000",
  },
  {
    id: "vault-004",
    token: "WBTC",
    amount: "0.5",
    unlockTime: "2024-10-30T18:00:00Z",
    approvals: 2,
    threshold: 2,
    status: "ready",
    signers: ["0x1234...5678", "0x9abc...def0"],
    createdAt: "2024-01-20T16:45:00Z",
    value: "$31,500",
  },
];
