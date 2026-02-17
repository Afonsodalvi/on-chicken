import { Address } from "viem";

// Tipos para os contratos
export interface ContractConfig {
  address: Address;
  chainId: number;
}

// Endereços dos contratos por rede (arquitetura Diamond – ver CONTRACTS_USAGE.md)
export const CONTRACTS = {
  // Chicken Manager Farm – factory + createMatchById / joinMatchById
  CHICKEN_MANAGER_FARM: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x0ec1464c01E80f41B6eE4dd0c13e629063353980" as Address, // Base Sepolia
  },

  // First Collection – Diamond da primeira coleção ERC-1155 (PudgyChicken + PudgyChickenView)
  PUDGY_CHICKEN_COLLECTION: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x479500002B54D4F4C45A3944aB7EC0FF84eb20AB" as Address, // Base Sepolia – First Collection Diamond
  },

  // Implementação de referência (Beacon); não chamar no front
  PUDGY_CHICKEN_IMPLEMENTATION: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x5656cA1679ee45BF9353825F61f46e5c919d1572" as Address, // Base Sepolia
  },

  // Pudgy Chicken Fight – Diamond da arena (matches, VRF, taxas)
  PUDGY_CHICKEN_FIGHT: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0x3Bd7B94fB03B0e8E544529b0E661E5a379B42a27" as Address, // Base Sepolia
  },

  // Beacon para upgrades das coleções (referência; não chamar no front)
  BEACON: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0xfe872CD14258B6848E29467Bdc3efF7F144E5c7a" as Address, // Base Sepolia
  },

  // EggCoin Token (ERC-20)
  EGG_COIN: {
    mainnet: "0x" as Address, // TODO: Deploy to mainnet
    polygon: "0x" as Address, // TODO: Deploy to polygon
    base: "0x" as Address, // TODO: Deploy to base
    sepolia: "0x" as Address, // TODO: Deploy to sepolia
    polygonMumbai: "0x" as Address, // TODO: Deploy to mumbai
    baseSepolia: "0xc849cfAB96cc7a073854009aDB8C5E370C5d0063" as Address, // Base Sepolia
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
  
  // Legacy exports (mesmos endereços que PUDGY_CHICKEN_COLLECTION, PUDGY_CHICKEN_FIGHT, EGG_COIN)
  PUDGY_CHICKENS: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x479500002B54D4F4C45A3944aB7EC0FF84eb20AB" as Address,
  },
  BATTLE_ARENA: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x3Bd7B94fB03B0e8E544529b0E661E5a379B42a27" as Address,
  },
  FARM_TOKEN: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x" as Address,
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0xc849cfAB96cc7a073854009aDB8C5E370C5d0063" as Address,
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
