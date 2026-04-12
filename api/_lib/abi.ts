// adminMint ABI subset from PudgyChicken contract
export const ADMIN_MINT_ABI = [
  {
    type: "function",
    name: "adminMint",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      { name: "quantity", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
