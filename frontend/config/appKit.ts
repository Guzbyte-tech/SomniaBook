// import { sepolia, type AppKitNetwork } from '@reown/appkit/networks'
// import type { InferredCaipNetwork } from '@reown/appkit-common'
// import UniversalProvider from '@walletconnect/universal-provider'
// import { AppKit, createAppKit } from '@reown/appkit/core'


// const somnia: InferredCaipNetwork = {
//   id: 50312,
//   chainNamespace: 'evm' as const,
//   caipNetworkId: 'evm:50312',
//   name: 'Somnia Testnet',
//   nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
//   rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
//   blockExplorers: {
//     default: { name: 'Somnia Testnet Explorer', url: 'https://somnia-testnet.socialscan.io' }
//   },
// };

// // 1. Get projectId
// const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

// if (!projectId) {
//   throw new Error('Project ID is not defined')
// }


// export const networks = [somnia] as [AppKitNetwork, ...AppKitNetwork[]]

// let provider: UniversalProvider | undefined
// let modal: AppKit | undefined

// const metadata = {
//     name: "Somnia Book",
//     description: "Somnia Book dApp",
//     url: "http://localhost:3000/",
//     icons: ["https://avatars.githubusercontent.com/u/37784886"],
//   }

// export async function initializeProvider() {
//   if (!provider) {
//     provider = await UniversalProvider.init(
//       { 
//         projectId, 
//         metadata
//       })
//   }
//   return provider
// }

// export function initializeModal(universalProvider?: UniversalProvider) {
//   if (!modal && universalProvider) {
//     modal = createAppKit({
//       projectId,
//       networks,
//       universalProvider: universalProvider as any, // Type cast to fix version mismatch
//       manualWCControl: true,
//       features: {
//         analytics: true // Optional - defaults to your Cloud configuration
//       }
//     })
//   }
//   return modal
// }


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
      url: 'https://somnia-testnet.socialscan.io' 
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
  name: 'Somnia Book',
  description: 'Somnia Book dApp',
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

