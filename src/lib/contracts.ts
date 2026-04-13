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
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x71B48ec5C79b4fAba876cCcCFB6c1BAb805f0F32" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x8dAdA3e910b713b3Cb33579B93F9233B4810Ec31" as Address, // Base Sepolia
  },

  // First Collection – Diamond da primeira coleção ERC-1155 (PudgyChicken + PudgyChickenView)
  PUDGY_CHICKEN_COLLECTION: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0xd9114E1D7fEec3C9332673B6D048Cc40741D79dC" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x27Bb62C5B5Ea7EE6A365084d73D05565AbA49503" as Address, // Base Sepolia
  },

  // Implementação de referência (Beacon); não chamar no front
  PUDGY_CHICKEN_IMPLEMENTATION: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x852626fCeb3eEf7aAeFcDDD58FD37eCEa968f833" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0xbD7cB806a97b25d714D48Da679706578A1fE7FF0" as Address, // Base Sepolia
  },

  // Pudgy Chicken Fight – Diamond da arena (matches, VRF, taxas)
  PUDGY_CHICKEN_FIGHT: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0xCFF5bC8FaD268e5C4cfb42dab145c808E5cF6d4a" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x4279510110aFD50F86CB7d7669b76002B5D735e2" as Address, // Base Sepolia
  },

  // Beacon para upgrades das coleções (referência; não chamar no front)
  BEACON: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x78eE496138211cA731eDbaD9A837DB7d7AAa16B2" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x7B32634F6D83763998d9bEE938622A2cCC3A14EF" as Address, // Base Sepolia
  },

  // EggCoin Token (ERC-20)
  EGG_COIN: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x0534d18ee14a83841f21aa448bE2bc59b1993B2E" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0xF6C19D7f8217EDfD2E8F0E306Dd1Ca21A2ae4253" as Address, // Base Sepolia
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
    base: "0xd9114E1D7fEec3C9332673B6D048Cc40741D79dC" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x27Bb62C5B5Ea7EE6A365084d73D05565AbA49503" as Address,
  },
  BATTLE_ARENA: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0xCFF5bC8FaD268e5C4cfb42dab145c808E5cF6d4a" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0x4279510110aFD50F86CB7d7669b76002B5D735e2" as Address,
  },
  FARM_TOKEN: {
    mainnet: "0x" as Address,
    polygon: "0x" as Address,
    base: "0x0534d18ee14a83841f21aa448bE2bc59b1993B2E" as Address, // Base Mainnet
    sepolia: "0x" as Address,
    polygonMumbai: "0x" as Address,
    baseSepolia: "0xF6C19D7f8217EDfD2E8F0E306Dd1Ca21A2ae4253" as Address,
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

/** Redes Base suportadas pela app: testnet (Sepolia) e mainnet. Contratos na mainnet: preencher endereços quando fizer deploy. */
export const SUPPORTED_BASE_CHAINS: readonly number[] = [CHAIN_IDS.baseSepolia, CHAIN_IDS.base];

export function isSupportedBaseChain(chainId: number | undefined): boolean {
  return chainId !== undefined && SUPPORTED_BASE_CHAINS.includes(chainId);
}

export function isBaseSepolia(chainId: number | undefined): boolean {
  return chainId === CHAIN_IDS.baseSepolia;
}

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

export function isBaseMainnet(chainId: number | undefined): boolean {
  return chainId === CHAIN_IDS.base;
}

/** Date when mainnet goes live (ISO string). Adjust when ready to launch. */
const MAINNET_LAUNCH_DATE = "2026-04-18T00:00:00Z";

export function getMainnetLaunchDate(): string {
  return MAINNET_LAUNCH_DATE;
}

export function isMainnetLive(): boolean {
  return new Date() >= new Date(MAINNET_LAUNCH_DATE);
}

/** Well-known admin wallets for environment badges. */
export function isKnownAdminWallet(address: string | undefined): "dev" | "prod" | null {
  if (!address) return null;
  const lower = address.toLowerCase();
  // Add known admin addresses here
  const DEV_WALLETS = [
    "0x" // placeholder
  ];
  const PROD_WALLETS = [
    "0x" // placeholder
  ];
  if (DEV_WALLETS.some(w => w.toLowerCase() === lower)) return "dev";
  if (PROD_WALLETS.some(w => w.toLowerCase() === lower)) return "prod";
  return null;
}

// Função para verificar se um contrato está deployado
export function isContractDeployed(
  contractType: keyof typeof CONTRACTS,
  chainId: number
): boolean {
  const address = getContractAddress(contractType, chainId);
  return address !== null && address !== "0x";
}
