import React from "react";
import { getAllTokenAssets, type TokenAsset } from "@/lib/token-assets";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExchangeRate, formatBRL, formatUSD } from "@/hooks/useExchangeRate";
import { getTokenPriceUSD, TOKEN_RARITY, getRarityColor } from "@/lib/nft-prices";
import { Loader2 } from "lucide-react";

interface NftSelectorProps {
  onSelect: (token: TokenAsset) => void;
  selectedTokenId: number | null;
}

export const NftSelector: React.FC<NftSelectorProps> = ({ onSelect, selectedTokenId }) => {
  const { t } = useLanguage();
  const tokens = getAllTokenAssets();
  const { data: rate, isLoading: rateLoading } = useExchangeRate();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{t("pix.selectNft")}</h3>
      {rateLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("pix.loadingPrices")}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {tokens.map((token) => {
          const priceUsd = getTokenPriceUSD(token.tokenId);
          const priceBrl = rate ? priceUsd * rate : null;
          const rarity = TOKEN_RARITY[token.tokenId] || "Comum";
          const rarityGradient = getRarityColor(rarity);

          return (
            <Card
              key={token.tokenId}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                selectedTokenId === token.tokenId
                  ? "ring-2 ring-primary shadow-primary/20 shadow-lg"
                  : "hover:ring-1 hover:ring-primary/40"
              }`}
              onClick={() => onSelect(token)}
            >
              <CardContent className="p-2">
                <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                  <img
                    src={token.image}
                    alt={token.metadata.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className={`absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white bg-gradient-to-r ${rarityGradient}`}>
                    {rarity}
                  </span>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-medium truncate">{token.metadata.name}</p>
                  <p className="text-sm font-bold text-primary">
                    {priceBrl ? formatBRL(priceBrl) : formatUSD(priceUsd)}
                  </p>
                  {priceBrl && (
                    <p className="text-[10px] text-muted-foreground">{formatUSD(priceUsd)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
