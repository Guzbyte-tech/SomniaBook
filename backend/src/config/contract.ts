
import { JsonRpcProvider, Contract} from "ethers";
import * as dotenv from "dotenv";
import { ABI } from "../abi";

dotenv.config();

const providerUrl = process.env.RPC_URL! || "";
const contractAddress = process.env.CONTRACT_ADDRESS! || "";

const provider = new JsonRpcProvider(providerUrl)
const contract = new Contract(contractAddress, ABI, provider)

export default contract;