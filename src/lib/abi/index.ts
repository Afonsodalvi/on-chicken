// ABI exports – arquitetura Diamond (CONTRACTS_USAGE.md)
// ABIs oficiais: ChickenManagerFarm.json, PudgyChicken.json, PudgyChickenView.json, PudgyChickenFight.json

import chickenManagerFarmRaw from "./ChickenManagerFarm.json";
import pudgyChickenRaw from "./PudgyChicken.json";
import pudgyChickenView from "./PudgyChickenView.json";
import pudgyChickenFight from "./PudgyChickenFight.json";
import eggCoinRaw from "./EggCoin.json";

type AbiItem = { type?: string; name?: string; [key: string]: unknown };

/** Remove constructor e receive para uso em proxy/Diamond (endereço já deployado). */
function withoutConstructorOrReceive(abi: AbiItem[]): AbiItem[] {
  return abi.filter(
    (item) => item.type !== "constructor" && item.type !== "receive"
  );
}

// ChickenManagerFarm – factory + createMatchById / joinMatchById
const chickenManagerFarmAbi = withoutConstructorOrReceive(
  chickenManagerFarmRaw as AbiItem[]
);

// Coleção Diamond = PudgyChicken (sem constructor) + PudgyChickenView (todas as views)
const pudgyChickenAbiOnly = withoutConstructorOrReceive(
  pudgyChickenRaw as AbiItem[]
);
const PUDGY_CHICKEN_COLLECTION_ABI = [
  ...pudgyChickenAbiOnly,
  ...(pudgyChickenView as AbiItem[]),
];

// PudgyChickenFight – Diamond da arena (matches, VRF, taxas)
const pudgyChickenFightAbi = pudgyChickenFight as AbiItem[];

// EggCoin – token PudgyEggs (getPrice, mintWithETH, mintWithUSDC)
const eggCoinAbi = withoutConstructorOrReceive(eggCoinRaw as AbiItem[]);
export const EGG_COIN_ABI = eggCoinAbi;

// ERC-20 ABI (for USDC, USDT, EggCoin)
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// ERC-1155 ABI (compatibilidade; coleção Diamond já inclui balanceOf, setApprovalForAll, etc.)
export const ERC1155_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOfBatch",
    stateMutability: "view",
    inputs: [
      { name: "accounts", type: "address[]" },
      { name: "ids", type: "uint256[]" },
    ],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "id", type: "uint256" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "uri",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// ABIs dos contratos deployados (Diamond)
export const CHICKEN_MANAGER_FARM_ABI = chickenManagerFarmAbi;
export const PUDGY_CHICKEN_ABI = PUDGY_CHICKEN_COLLECTION_ABI;
export const PUDGY_CHICKEN_FIGHT_ABI = pudgyChickenFightAbi;

// Type exports
export type ChickenManagerFarmABI = typeof CHICKEN_MANAGER_FARM_ABI;
export type PudgyChickenABI = typeof PUDGY_CHICKEN_ABI;

// Legacy (mesmos valores)
export const PUDGY_CHICKENS_ABI = PUDGY_CHICKEN_ABI;
export const BATTLE_ARENA_ABI = PUDGY_CHICKEN_FIGHT_ABI;
