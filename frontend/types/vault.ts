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

export type VaultDetail = {
  id: bigint,
  name: string,
  token: string,
  amount: string,
  unlockTime: string,
  approvals: number,
  threshold: number,
  status: "locked" | "ready" | "released",
  value: string,
  createdAt: bigint,
  creator: string,
  contractAddress: string,
  signers: { address: string, name: string, approved: boolean, approvedAt: string }[],
  transactions: { id: string, type: string, timestamp: string, signer: string, txHash: string }[],
}

export type VaultLog = {
  _id: string;
  uuid: string;
  vaultId: number;
  txType: string;
  signer: string;
  txHash: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

//  {
//         "_id": "68c499b4eb948f95b75dccfa",
//         "uuid": "398a67d2-71a6-4c13-98cc-ad285e16aa38",
//         "vaultId": 7,
//         "txType": "released",
//         "signer": "0x06D97198756295A96C2158a23963306f507b2f69",
//         "txHash": "0x0897efc89b1b69b694d55434f3b372e755dbc37d5e6e6fe298b09262abb33112",
//         "createdAt": "2025-09-12T22:07:48.076Z",
//         "updatedAt": "2025-09-12T22:07:48.076Z",
//         "__v": 0
//     }


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
