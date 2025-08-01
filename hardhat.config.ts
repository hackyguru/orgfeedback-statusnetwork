import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    statusTestnet: {
      url: "https://public.sepolia.rpc.status.network",
      chainId: 1660990954,
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;