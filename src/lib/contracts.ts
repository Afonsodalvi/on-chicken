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
    baseSepolia: "0xda95d5c228d9D12C2E9F80D3687AF651496B9E71" as Address, // Base Sepolia Testnet
  },
  
  // Pudgy Chicken Collection Contract (ERC-1155 NFT)
  // This is the first deployed collection address
  PUDGY_CHICKEN_COLLECTION: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x05BE25F8292d61d10a0ad77cB0Ad4d4BB7D1209D" as Address, // First Collection on Base Sepolia
  },
  
  // Pudgy Chicken Implementation (for reference, not directly used)
  PUDGY_CHICKEN_IMPLEMENTATION: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x760EEC87EB1E34617E908980A1e7338Ec9527a9E" as Address,
  },
  
  // Pudgy Chicken Fight Contract (Battle Arena)
  PUDGY_CHICKEN_FIGHT: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x5F3fde74442A75Dd63C66299b0b7b349B2a4DB1D" as Address, // Base Sepolia Testnet
  },
  
  // EggCoin Token (ERC-20)
  EGG_COIN: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0xf80d1037eBedbb582F818b2921b7253F4261E2e1" as Address, // Base Sepolia Testnet
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
    baseSepolia: "0x05BE25F8292d61d10a0ad77cB0Ad4d4BB7D1209D" as Address,
  },
  
  BATTLE_ARENA: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x5F3fde74442A75Dd63C66299b0b7b349B2a4DB1D" as Address,
  },
  
  FARM_TOKEN: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0xf80d1037eBedbb582F818b2921b7253F4261E2e1" as Address,
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
