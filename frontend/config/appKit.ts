
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Define Somnia Testnet
export const somniaTestnet: AppKitNetwork = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: { 
    default: { 
      http: ['https://dream-rpc.somnia.network'] 
    } 
  },
  blockExplorers: {
    default: { 
      name: 'Somnia Testnet Explorer', 
      url: 'https://shannon-explorer.somnia.network' 
    }
  },
}

// 1. Get projectId
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined')
}

// 2. Set the networks
const networks = [somniaTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

// 3. Create a metadata object
const metadata = {
  name: 'ChronosVault',
  description: 'A decentralized vault where users or DAOs can lock tokens, only unlockable after a certain block height or timestamp AND with approval from a majority of signers.',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Create the Ethers adapter
const ethersAdapter = new EthersAdapter()

// 5. Create the AppKit instance
export const modal = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple'],
    emailShowWallets: true
  }
})

export default modal

