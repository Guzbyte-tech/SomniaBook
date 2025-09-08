import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY! || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL! || "";
const SOMNIA_TESTNET_RPC_URL = process.env.SOMNIA_TESTNET_RPC_URL! || "";
const LOCAL_PRIVATE_KEY = process.env.LOCAL_PRIVATE_KEY! || "";



const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    local: {
      type: "http",
      url: "http://127.0.0.1:8545",
      accounts: [LOCAL_PRIVATE_KEY],
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    somnia_testnet: {
      type: "http",
      url: SOMNIA_TESTNET_RPC_URL,
      accounts: [PRIVATE_KEY]
    }
  },
  
};

export default config;
