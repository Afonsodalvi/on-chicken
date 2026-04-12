// USD prices per token ID (matching Shop.tsx)
// Token 1 = most rare/expensive, Token 10 = most common/cheapest
export const TOKEN_PRICES_USD: Record<number, number> = {
  1: 65,
  2: 60,
  3: 55,
  4: 50,
  5: 45,
  6: 40,
  7: 35,
  8: 30,
  9: 25,
  10: 20,
};

// Rarity labels per token (matching Shop.tsx)
export const TOKEN_RARITY: Record<number, string> = {
  1: "Legendário",
  2: "Mítico",
  3: "Mítico",
  4: "Lendário",
  5: "Épico",
  6: "Épico",
  7: "Raro",
  8: "Raro",
  9: "Comum",
  10: "Comum",
};

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "Legendário": return "from-yellow-500 to-amber-600";
    case "Mítico": return "from-purple-500 to-pink-500";
    case "Lendário": return "from-orange-500 to-red-500";
    case "Épico": return "from-violet-500 to-purple-500";
    case "Raro": return "from-blue-500 to-cyan-500";
    default: return "from-gray-400 to-gray-500";
  }
}

export function getTokenPriceUSD(tokenId: number): number {
  return TOKEN_PRICES_USD[tokenId] ?? 0;
}
