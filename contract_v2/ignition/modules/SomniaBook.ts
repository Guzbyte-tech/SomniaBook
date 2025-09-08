import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as dotenv from "dotenv";

dotenv.config();


export default buildModule("SomniaBookModule", (m) => {
    
    const FeeAddress = process.env.FEE_RECIPIENT || "0xYourFeeRecipientAddressHere";
  

  const somnia = m.contract("SomniaBook", [FeeAddress]);


  return { somnia };
});
