import { clsx, type ClassValue } from "clsx"
import { ethers } from "ethers"
import { twMerge } from "tailwind-merge"
import axios from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// export function getTimeRemaining(unlockTime: string) {
//   const now = new Date()
//   const unlock = new Date(unlockTime)
//   const diff = unlock.getTime() - now.getTime()

//   if (diff <= 0) return { text: "Ready to unlock", expired: true }

//   const days = Math.floor(diff / (1000 * 60 * 60 * 24))
//   const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
//   const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

//   return {
//     text: `${days}d ${hours}h ${minutes}m remaining`,
//     expired: false,
//     days,
//     hours,
//     minutes,
//   }
// }

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

export function getTimeRemaining(unlockTime: string) {
  const now = new Date()
  const unlock = new Date(unlockTime)
  const diff = unlock.getTime() - now.getTime()

  if (diff <= 0) return "Ready to unlock"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}

// export function getStatusColor(status: string) {
//   switch (status) {
//     case "ready":
//       return "bg-accent text-accent-foreground"
//     case "locked":
//       return "bg-secondary text-secondary-foreground"
//     default:
//       return "bg-muted text-muted-foreground"
//   }
// }



export function getStatusColor(status: string) {
  switch (status) {
    case "ready":
      return "bg-accent text-accent-foreground";        // bright/primary
    case "locked":
      return "bg-secondary text-secondary-foreground";  // neutral/soft
    case "withdrawn":
      return "bg-muted text-muted-foreground";          // greyed out
    default:
      return "bg-gray-500 text-white";                  // fallback
  }
}


export const tokens = [
  {
    symbol: "STT",
    name: "Somnia Token STT",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000",
  },
  // { symbol: "USDC", name: "USD Coin", decimals: 6, },
  // { symbol: "USDT", name: "Tether USD", decimals: 6 },
  // { symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  // { symbol: "WETH", name: "Wrapped Bitcoin", decimals: 8 },
];

const priceCache: Record<string, { price: number; timestamp: number }> = {};

/**
 * Convert token amount to human-readable and get USD value from CoinGecko
 * @param rawAmount - token amount in smallest units
 * @param decimals - token decimals (e.g., 18, 6)
 * @param contractAddress - token contract address on Ethereum
 * @param tokenSymbol - token symbol like "SOMI"
 */
export async function parseToken(
  rawAmount: number,
  decimals: number,
  contractAddress: string,
  tokenSymbol: string
) {
  // Convert to human-readable
  const amount = ethers.formatUnits(rawAmount, decimals);

  // Handle native SOMI -> fallback to real contract for CoinGecko
  if (contractAddress === "0x0000000000000000000000000000000000000000") {
    contractAddress = "0x1B0F6590d21dc02B92ad3A7D00F8884dC4f1aed9"; // SOMI address
  }

  const key = contractAddress.toLowerCase();
  const now = Date.now();
  const TWO_HOURS = 3 * 60 * 60 * 1000;

  let usdPrice: number;


  if (priceCache[key] && now - priceCache[key].timestamp < TWO_HOURS) {
    usdPrice = priceCache[key].price;
  } else {
    // ⏳ Fetch from CoinGecko
    const priceData = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${key}&vs_currencies=usd`
    );

    usdPrice = priceData.data[key]?.usd || 0;

    // Save in cache
    priceCache[key] = { price: usdPrice, timestamp: now };
  }

  // Compute USD amount
  const usdAmount = (parseFloat(amount) * usdPrice).toFixed(2);

  return {
    amount: `${amount} ${tokenSymbol}`,
    usd: `$${usdAmount}`,
  };
}

export function tokenDetails(tokenAddress: string) {
  return tokens.find((token) => token.address === tokenAddress);
}

/**
 * Convert uint256 timestamp from contract to ISO string
 * @param timestamp - BigNumber, number, or string representing seconds since Unix epoch
 * @returns ISO 8601 string (e.g., 2024-01-15T10:30:00Z)
 */

export function formatTimestamp(timestamp: number | string): string {
  // Create JS Date (milliseconds = seconds * 1000)
  const date = new Date(Number(timestamp) * 1000);

  return date.toISOString();
}

