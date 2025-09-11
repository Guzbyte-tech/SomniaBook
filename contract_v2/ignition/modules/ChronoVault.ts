
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as dotenv from "dotenv";

dotenv.config();


export default buildModule("ChronoVaultModule", (m) => {
    
    const FeeAddress = process.env.FEE_RECIPIENT || "0x06D97198756295A96C2158a23963306f507b2f69";
  
    const chrono_vault = m.contract("ChronoVault", [FeeAddress]);

    return { chrono_vault };
});
