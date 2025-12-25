/**
 * Contract Helpers and Type Definitions
 * 
 * Este arquivo contém helpers e tipos TypeScript para facilitar
 * a interação com os contratos inteligentes.
 */

import { Address } from "viem";
import { CHICKEN_MANAGER_FARM_ABI, PUDGY_CHICKEN_ABI } from "./abi";
import { CONTRACTS, CHAIN_IDS } from "./contracts";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Payment Types para mint e outras operações
 * 0 = ETH
 * 1 = USDC
 * 2 = USDT
 * 3 = EggCoin
 */
export enum PaymentType {
  ETH = 0,
  USDC = 1,
  USDT = 2,
  EGG_COIN = 3,
}

/**
 * Battle Types para createMatchById
 */
export enum BattleType {
  // TODO: Definir os tipos de batalha baseado no contrato
  STANDARD = 0,
  // Adicionar outros tipos conforme necessário
}

/**
 * Skills structure do PudgyChicken
 */
export interface ChickenSkills {
  power: bigint;
  speed: bigint;
  health: bigint;
  clucking: bigint;
  broodPower: bigint;
}

/**
 * Status structure do PudgyChicken
 */
export interface ChickenStatus {
  battleWins: bigint;
  isIncubating: boolean;
}

/**
 * Rarity Tiers
 */
export enum RarityTier {
  COMMON = 0,
  UNCOMMON = 1,
  RARE = 2,
  EPIC = 3,
  LEGENDARY = 4,
}

// ============================================================================
// HELPER FUNCTIONS - ChickenManagerFarm
// ============================================================================

/**
 * Obtém o endereço do contrato ChickenManagerFarm para a chain atual
 */
export function getManagerFarmAddress(chainId: number): Address | null {
  const chainName = Object.entries(CHAIN_IDS).find(([, id]) => id === chainId)?.[0] as keyof typeof CONTRACTS.CHICKEN_MANAGER_FARM;
  if (!chainName) return null;
  const address = CONTRACTS.CHICKEN_MANAGER_FARM[chainName];
  return address === "0x" ? null : address;
}

/**
 * Obtém o endereço de uma coleção PudgyChicken pelo ID
 * @param collectionId - ID da coleção (geralmente 0 para a primeira)
 */
export async function getPudgyChickenAddress(
  collectionId: bigint,
  chainId: number,
  publicClient: any
): Promise<Address | null> {
  const managerAddress = getManagerFarmAddress(chainId);
  if (!managerAddress) return null;

  try {
    const address = await publicClient.readContract({
      address: managerAddress,
      abi: CHICKEN_MANAGER_FARM_ABI,
      functionName: "getPudgyChicken",
      args: [collectionId],
    });
    return address as Address;
  } catch (error) {
    console.error("Error getting PudgyChicken address:", error);
    return null;
  }
}

/**
 * Obtém o ID da coleção pelo endereço do contrato
 */
export async function getCollectionIdByAddress(
  collectionAddress: Address,
  chainId: number,
  publicClient: any
): Promise<bigint | null> {
  const managerAddress = getManagerFarmAddress(chainId);
  if (!managerAddress) return null;

  try {
    const id = await publicClient.readContract({
      address: managerAddress,
      abi: CHICKEN_MANAGER_FARM_ABI,
      functionName: "getPudgyChickenByContract",
      args: [collectionAddress],
    });
    return id as bigint;
  } catch (error) {
    console.error("Error getting collection ID:", error);
    return null;
  }
}

/**
 * Obtém o preço de deployment em ETH
 */
export async function getDeploymentPriceETH(
  chainId: number,
  publicClient: any
): Promise<bigint | null> {
  const managerAddress = getManagerFarmAddress(chainId);
  if (!managerAddress) return null;

  try {
    const price = await publicClient.readContract({
      address: managerAddress,
      abi: CHICKEN_MANAGER_FARM_ABI,
      functionName: "getDeploymentPriceETH",
    });
    return price as bigint;
  } catch (error) {
    console.error("Error getting deployment price:", error);
    return null;
  }
}

/**
 * Obtém o preço de deployment em USDC
 */
export async function getDeploymentPriceUSDC(
  chainId: number,
  publicClient: any
): Promise<bigint | null> {
  const managerAddress = getManagerFarmAddress(chainId);
  if (!managerAddress) return null;

  try {
    const price = await publicClient.readContract({
      address: managerAddress,
      abi: CHICKEN_MANAGER_FARM_ABI,
      functionName: "getDeploymentPriceUSDC",
    });
    return price as bigint;
  } catch (error) {
    console.error("Error getting deployment price USDC:", error);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS - PudgyChicken Collection
// ============================================================================

/**
 * Obtém o endereço da coleção PudgyChicken para a chain atual
 * Por padrão, retorna a primeira coleção (baseSepolia)
 */
export function getPudgyChickenCollectionAddress(chainId: number): Address | null {
  const chainName = Object.entries(CHAIN_IDS).find(([, id]) => id === chainId)?.[0] as keyof typeof CONTRACTS.PUDGY_CHICKEN_COLLECTION;
  if (!chainName) return null;
  const address = CONTRACTS.PUDGY_CHICKEN_COLLECTION[chainName];
  return address === "0x" ? null : address;
}

/**
 * Obtém o balance de um token específico para um endereço
 */
export async function getTokenBalance(
  collectionAddress: Address,
  account: Address,
  tokenId: bigint,
  publicClient: any
): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "balanceOf",
      args: [account, tokenId],
    });
    return balance as bigint;
  } catch (error) {
    console.error("Error getting token balance:", error);
    return 0n;
  }
}

/**
 * Obtém as skills de um token
 */
export async function getTokenSkills(
  collectionAddress: Address,
  tokenId: bigint,
  publicClient: any
): Promise<ChickenSkills | null> {
  try {
    const skills = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "getTokenSkills",
      args: [tokenId],
    });
    return skills as ChickenSkills;
  } catch (error) {
    console.error("Error getting token skills:", error);
    return null;
  }
}

/**
 * Obtém o status de um token (battleWins, isIncubating)
 */
export async function getTokenStatus(
  collectionAddress: Address,
  tokenId: bigint,
  publicClient: any
): Promise<ChickenStatus | null> {
  try {
    const status = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "getTokenStatus",
      args: [tokenId],
    });
    return status as ChickenStatus;
  } catch (error) {
    console.error("Error getting token status:", error);
    return null;
  }
}

/**
 * Obtém o preço de um token para um tipo de pagamento específico
 */
export async function getTokenPrice(
  collectionAddress: Address,
  tokenId: bigint,
  paymentType: PaymentType,
  publicClient: any
): Promise<bigint | null> {
  try {
    const price = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "getPrice",
      args: [tokenId, BigInt(paymentType)],
    });
    return price as bigint;
  } catch (error) {
    console.error("Error getting token price:", error);
    return null;
  }
}

/**
 * Verifica se um endereço está na whitelist
 */
export async function isWhitelisted(
  collectionAddress: Address,
  account: Address,
  publicClient: any
): Promise<boolean> {
  try {
    const whitelisted = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "isWhitelisted",
      args: [account],
    });
    return whitelisted as boolean;
  } catch (error) {
    console.error("Error checking whitelist:", error);
    return false;
  }
}

/**
 * Verifica se um token está vivo (não expirou)
 */
export async function isTokenAlive(
  collectionAddress: Address,
  tokenId: bigint,
  publicClient: any
): Promise<boolean> {
  try {
    const alive = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "isTokenAlive",
      args: [tokenId],
    });
    return alive as boolean;
  } catch (error) {
    console.error("Error checking token alive status:", error);
    return false;
  }
}

/**
 * Obtém o URI do token (metadata)
 */
export async function getTokenURI(
  collectionAddress: Address,
  tokenId: bigint,
  publicClient: any
): Promise<string | null> {
  try {
    const uri = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "getTokenURI",
      args: [tokenId],
    });
    return uri as string;
  } catch (error) {
    console.error("Error getting token URI:", error);
    return null;
  }
}

/**
 * Obtém a tier de raridade de um token
 */
export async function getRarityTier(
  collectionAddress: Address,
  tokenId: bigint,
  publicClient: any
): Promise<RarityTier | null> {
  try {
    const tier = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "getRarityTier",
      args: [tokenId],
    });
    return Number(tier) as RarityTier;
  } catch (error) {
    console.error("Error getting rarity tier:", error);
    return null;
  }
}

/**
 * Obtém o supply atual de um token
 */
export async function getTokenSupply(
  collectionAddress: Address,
  tokenId: bigint,
  publicClient: any
): Promise<bigint | null> {
  try {
    const supply = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "getSupply",
      args: [tokenId],
    });
    return supply as bigint;
  } catch (error) {
    console.error("Error getting token supply:", error);
    return null;
  }
}

/**
 * Obtém o max supply de um token
 */
export async function getMaxSupply(
  collectionAddress: Address,
  tokenId: bigint,
  publicClient: any
): Promise<bigint | null> {
  try {
    const maxSupply = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "getMaxSupply",
      args: [tokenId],
    });
    return maxSupply as bigint;
  } catch (error) {
    console.error("Error getting max supply:", error);
    return null;
  }
}

/**
 * Verifica se um tipo de pagamento está habilitado
 */
export async function isPaymentTypeEnabled(
  collectionAddress: Address,
  paymentType: PaymentType,
  publicClient: any
): Promise<boolean> {
  try {
    const enabled = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "isPaymentTypeEnabled",
      args: [BigInt(paymentType)],
    });
    return enabled as boolean;
  } catch (error) {
    console.error("Error checking payment type:", error);
    return false;
  }
}

/**
 * Obtém os free mints restantes para um endereço
 */
export async function getRemainingFreeMints(
  collectionAddress: Address,
  account: Address,
  publicClient: any
): Promise<bigint> {
  try {
    const remaining = await publicClient.readContract({
      address: collectionAddress,
      abi: PUDGY_CHICKEN_ABI,
      functionName: "getRemainingFreeMints",
      args: [account],
    });
    return remaining as bigint;
  } catch (error) {
    console.error("Error getting remaining free mints:", error);
    return 0n;
  }
}

// ============================================================================
// WRITE FUNCTION HELPERS (para uso com writeContract)
// ============================================================================

/**
 * Prepara os parâmetros para a função mint
 */
export function prepareMintParams(
  to: Address,
  tokenId: bigint,
  quantity: bigint,
  paymentType: PaymentType
) {
  return {
    functionName: "mint" as const,
    args: [to, tokenId, quantity, BigInt(paymentType)],
  };
}

/**
 * Prepara os parâmetros para a função mintFree
 */
export function prepareMintFreeParams(
  to: Address,
  tokenId: bigint,
  quantity: bigint
) {
  return {
    functionName: "mintFree" as const,
    args: [to, tokenId, quantity],
  };
}

/**
 * Prepara os parâmetros para createMatchById (battle)
 */
export function prepareCreateMatchParams(
  id: bigint,
  player: Address,
  tokenId: bigint,
  battleType: BattleType,
  betAmount: bigint,
  paymentType: PaymentType
) {
  return {
    functionName: "createMatchById" as const,
    args: [id, player, tokenId, battleType, betAmount, paymentType],
  };
}

/**
 * Prepara os parâmetros para joinMatchById
 */
export function prepareJoinMatchParams(
  matchId: bigint,
  id: bigint,
  tokenId: bigint
) {
  return {
    functionName: "joinMatchById" as const,
    args: [matchId, id, tokenId],
  };
}

// ============================================================================
// ERC20 TOKEN HELPERS
// ============================================================================

import { ERC20_ABI } from "./abi";

/**
 * Obtém o endereço do token ERC20 baseado no tipo de pagamento
 */
export function getTokenAddress(
  paymentType: PaymentType,
  chainId: number
): Address | null {
  const chainName = Object.entries(CHAIN_IDS).find(([, id]) => id === chainId)?.[0] as keyof typeof CONTRACTS.USDC;
  
  if (!chainName) return null;

  switch (paymentType) {
    case PaymentType.USDC:
      return CONTRACTS.USDC[chainName] === "0x" ? null : CONTRACTS.USDC[chainName];
    case PaymentType.USDT:
      return CONTRACTS.USDT[chainName] === "0x" ? null : CONTRACTS.USDT[chainName];
    case PaymentType.EGG_COIN:
      return CONTRACTS.EGG_COIN[chainName] === "0x" ? null : CONTRACTS.EGG_COIN[chainName];
    case PaymentType.ETH:
      return null; // ETH não é um token ERC20
    default:
      return null;
  }
}

/**
 * Obtém o saldo de um token ERC20
 */
export async function getERC20Balance(
  tokenAddress: Address,
  account: Address,
  publicClient: any
): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account],
    });
    return balance as bigint;
  } catch (error) {
    console.error("Error getting ERC20 balance:", error);
    return 0n;
  }
}

/**
 * Obtém o allowance de um token ERC20
 */
export async function getERC20Allowance(
  tokenAddress: Address,
  owner: Address,
  spender: Address,
  publicClient: any
): Promise<bigint> {
  try {
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [owner, spender],
    });
    return allowance as bigint;
  } catch (error) {
    console.error("Error getting ERC20 allowance:", error);
    return 0n;
  }
}

/**
 * Obtém o saldo de ETH
 */
export async function getETHBalance(
  account: Address,
  publicClient: any
): Promise<bigint> {
  try {
    const balance = await publicClient.getBalance({ address: account });
    return balance;
  } catch (error) {
    console.error("Error getting ETH balance:", error);
    return 0n;
  }
}

/**
 * Formata o valor para exibição (considerando decimals)
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18
): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  
  if (remainder === 0n) {
    return whole.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, "0");
  const trimmed = remainderStr.replace(/0+$/, "");
  
  if (trimmed === "") {
    return whole.toString();
  }
  
  return `${whole}.${trimmed}`;
}

