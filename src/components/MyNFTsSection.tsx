import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useAllUserNFTs } from "@/hooks/useAllUserNFTs";
import { getPudgyChickenCollectionAddress } from "@/lib/contracts-helpers";
import { CHAIN_IDS } from "@/lib/contracts";
import { Loader2, Wallet, Sparkles, ExternalLink } from "lucide-react";
import type { UserNFTItem } from "@/hooks/useAllUserNFTs";

function getTokenExplorerUrl(chainId: number | undefined, collectionAddress: string | null, tokenId: number): string {
  const address = collectionAddress || "0x479500002B54D4F4C45A3944aB7EC0FF84eb20AB";
  const base = chainId === CHAIN_IDS.base ? "https://basescan.org" : "https://sepolia.basescan.org";
  return `${base}/token/${address}?a=${tokenId}`;
}

function RarityBadge({ rarity }: { rarity: UserNFTItem["rarity"] }) {
  const { t } = useLanguage();
  const key = `myNFTs.rarity.${rarity}` as const;
  const variant = rarity === "legendary" ? "default" : rarity === "epic" ? "secondary" : "outline";
  return <Badge variant={variant}>{t(key)}</Badge>;
}

export const MyNFTsSection = () => {
  const { t } = useLanguage();
  const { address, isConnected, chainId } = useAccount();
  const { nfts, isLoading, error } = useAllUserNFTs();
  const collectionAddress = chainId ? getPudgyChickenCollectionAddress(chainId) : null;

  if (!isConnected) {
    return (
      <section id="my-nfts" className="py-16 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold font-display">
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                {t("myNFTs.title")}
              </span>
            </h2>
            <p className="text-muted-foreground">{t("myNFTs.subtitle")}</p>
            <div className="flex justify-center">
              <ConnectWallet />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="my-nfts" className="py-16 border-t border-border/50 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold font-display mb-2">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t("myNFTs.title")}
            </span>
          </h2>
          <p className="text-muted-foreground">{t("myNFTs.subtitle")}</p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto text-center text-destructive text-sm mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : nfts.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12 px-6 rounded-xl border border-dashed border-border bg-card/50">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t("myNFTs.empty.title")}</h3>
            <p className="text-muted-foreground text-sm mb-6">{t("myNFTs.empty.description")}</p>
            <Button asChild variant="outline">
              <a href="/whitelist">{t("myNFTs.empty.cta")}</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {nfts.map((nft) => (
              <Card key={nft.tokenId} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <RarityBadge rarity={nft.rarity} />
                    {nft.isSpecial && (
                      <Badge className="bg-amber-500/90 text-white border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {t("myNFTs.special")}
                      </Badge>
                    )}
                  </div>
                  {nft.balance > 1n && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">×{nft.balance.toString()}</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate" title={nft.name}>
                    {nft.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    #{nft.tokenId} · {t("myNFTs.collection")}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a
                      href={getTokenExplorerUrl(chainId ?? 0, collectionAddress, nft.tokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("myNFTs.viewOnChain")}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
