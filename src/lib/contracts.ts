import { Address } from "viem";

// Tipos para os contratos
export interface ContractConfig {
  address: Address;
  chainId: number;
}

// Endereços dos contratos por rede
export const CONTRACTS = {
  // Pudgy Chickens NFT Contract
  PUDGY_CHICKENS: {
    mainnet: "0x" as Address, // TODO: Deploy contract
    polygon: "0x" as Address, // TODO: Deploy contract
    base: "0x" as Address, // TODO: Deploy contract
    sepolia: "0x" as Address, // TODO: Deploy contract
    polygonMumbai: "0x" as Address, // TODO: Deploy contract
    baseSepolia: "0x" as Address, // TODO: Deploy contract
  },
  
  // RWAnimals Tokenization Contract
  RW_ANIMALS: {
    mainnet: "0x" as Address, // TODO: Deploy contract
    polygon: "0x" as Address, // TODO: Deploy contract
    base: "0x" as Address, // TODO: Deploy contract
    sepolia: "0x" as Address, // TODO: Deploy contract
    polygonMumbai: "0x" as Address, // TODO: Deploy contract
    baseSepolia: "0x" as Address, // TODO: Deploy contract
  },
  
  // Battle Arena Contract
  BATTLE_ARENA: {
    mainnet: "0x" as Address, // TODO: Deploy contract
    polygon: "0x" as Address, // TODO: Deploy contract
    base: "0x" as Address, // TODO: Deploy contract
    sepolia: "0x" as Address, // TODO: Deploy contract
    polygonMumbai: "0x" as Address, // TODO: Deploy contract
    baseSepolia: "0x" as Address, // TODO: Deploy contract
  },
  
  // Farm Token Contract
  FARM_TOKEN: {
    mainnet: "0x" as Address, // TODO: Deploy contract
    polygon: "0x" as Address, // TODO: Deploy contract
    base: "0x" as Address, // TODO: Deploy contract
    sepolia: "0x" as Address, // TODO: Deploy contract
    polygonMumbai: "0x" as Address, // TODO: Deploy contract
    baseSepolia: "0x" as Address, // TODO: Deploy contract
  },

  // USDC Addresses (for payments)
  USDC: {
    mainnet: (import.meta.env.VITE_USDC_ADDRESS_MAINNET || "0xA0b86a33E6417aFE351b048c06b8c16E3F6E8F2a") as Address,
    polygon: (import.meta.env.VITE_USDC_ADDRESS_POLYGON || "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") as Address,
    base: (import.meta.env.VITE_USDC_ADDRESS_BASE || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address,
    sepolia: "0x" as Address, // TODO: Get testnet USDC
    polygonMumbai: "0x" as Address, // TODO: Get testnet USDC
    baseSepolia: "0x" as Address, // TODO: Get testnet USDC
  },
} as const;

// Chain IDs
export const CHAIN_IDS = {
  mainnet: 1,
  polygon: 137,
  base: 8453,
  sepolia: 11155111,
  polygonMumbai: 80001,
  baseSepolia: 84532,
} as const;

// Função helper para obter endereço do contrato
export function getContractAddress(
  contractType: keyof typeof CONTRACTS,
  chainId: number
): Address | null {
  const chainName = Object.entries(CHAIN_IDS).find(([, id]) => id === chainId)?.[0] as keyof typeof CONTRACTS[typeof contractType];
  
  if (!chainName) return null;
  
  const address = CONTRACTS[contractType][chainName];
  return address === "0x" ? null : address;
}

// Função para verificar se um contrato está deployado
export function isContractDeployed(
  contractType: keyof typeof CONTRACTS,
  chainId: number
): boolean {
  const address = getContractAddress(contractType, chainId);
  return address !== null && address !== "0x";
}
