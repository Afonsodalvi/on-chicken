import { Address } from "viem";

// Tipos para os contratos
export interface ContractConfig {
  address: Address;
  chainId: number;
}

// Endereços dos contratos por rede
export const CONTRACTS = {
  // Chicken Manager Farm Contract (deploys and manages PudgyChicken collections)
  CHICKEN_MANAGER_FARM: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x9a449b5c6d6b1a66B8134Da6A0f5258f63F7D1b7" as Address, // Base Sepolia Testnet
  },
  
  // Pudgy Chicken Collection Contract (ERC-1155 NFT)
  // This is the first deployed collection address
  PUDGY_CHICKEN_COLLECTION: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x1fD6B9a94abe117D2f98201cbd4f1A0F9516B9bA" as Address, // First Collection on Base Sepolia
  },
  
  // Pudgy Chicken Implementation (for reference, not directly used)
  PUDGY_CHICKEN_IMPLEMENTATION: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0xf75A041d8268C54F82a155b418391695388e62E0" as Address,
  },
  
  // Pudgy Chicken Fight Contract (Battle Arena)
  PUDGY_CHICKEN_FIGHT: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x93A5EA99044343b1247624dCe2eb91046C161BC7" as Address, // Base Sepolia Testnet
  },
  
  // EggCoin Token (ERC-20)
  EGG_COIN: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x66A937Fa011f67862063272eFa8B28024675A05c" as Address, // Base Sepolia Testnet
  },

  // USDC Addresses (for payments)
  USDC: {
    mainnet: (import.meta.env.VITE_USDC_ADDRESS_MAINNET || "0xA0b86a33E6417aFE351b048c06b8c16E3F6E8F2a") as Address,
    polygon: (import.meta.env.VITE_USDC_ADDRESS_POLYGON || "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") as Address,
    base: (import.meta.env.VITE_USDC_ADDRESS_BASE || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address,
    sepolia: "0x" as Address, // TODO: Get testnet USDC
    polygonMumbai: "0x" as Address, // TODO: Get testnet USDC
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address, // Base Sepolia Testnet
  },

  // USDT Addresses (for payments)
  USDT: {
    mainnet: "0x" as Address, // TODO: Add mainnet USDT
    polygon: "0x" as Address, // TODO: Add polygon USDT
    base: "0x" as Address, // TODO: Add base USDT
    sepolia: "0x" as Address, // TODO: Get testnet USDT
    polygonMumbai: "0x" as Address, // TODO: Get testnet USDT
    baseSepolia: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" as Address, // Base Sepolia Testnet
  },
  
  // Legacy exports for backward compatibility
  PUDGY_CHICKENS: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x1fD6B9a94abe117D2f98201cbd4f1A0F9516B9bA" as Address,
  },
  
  BATTLE_ARENA: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x93A5EA99044343b1247624dCe2eb91046C161BC7" as Address,
  },
  
  FARM_TOKEN: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x66A937Fa011f67862063272eFa8B28024675A05c" as Address,
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
