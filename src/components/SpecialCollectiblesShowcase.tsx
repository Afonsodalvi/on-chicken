import { useEffect, useMemo, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPudgyChickenCollectionAddress } from "@/lib/contracts-helpers";
import { isSupportedBaseChain, CHAIN_IDS } from "@/lib/contracts";
import {
  UNIQUE_COLLECTIBLES_TOKEN_IDS,
  fetchUniqueCollectibleMetadataOnChain,
  fetchUniqueCollectibleMetadata,
  type UniqueCollectibleMetadata,
} from "@/lib/unique-collectibles";
import { UniqueCollectibleModal } from "@/components/UniqueCollectibleModal";

interface ShowcaseItem {
  tokenId: number;
  metadata: UniqueCollectibleMetadata | null;
}

function pickDisplayTrait(metadata: UniqueCollectibleMetadata | null): string | null {
  if (!metadata?.attributes) return null;
  const priority = ["Role", "Character", "Theme"];
  for (const key of priority) {
    const hit = metadata.attributes.find((a) => a.trait_type === key);
    if (hit) return hit.value;
  }
  return metadata.attributes[0]?.value ?? null;
}

function pickParticipantName(metadata: UniqueCollectibleMetadata | null, tokenId: number): string {
  if (!metadata?.attributes) return `Pudgy #${tokenId}`;
  const character = metadata.attributes.find((a) => a.trait_type === "Character");
  if (character) return character.value;
  const theme = metadata.attributes.find((a) => a.trait_type === "Theme");
  if (theme) return theme.value;
  return metadata.name?.split("—")?.[1]?.trim() ?? metadata.name ?? `Pudgy #${tokenId}`;
}

export const SpecialCollectiblesShowcase = () => {
  const { t } = useLanguage();
  const publicClient = usePublicClient();
  const { chainId } = useAccount();

  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<{ tokenId: number; metadata: UniqueCollectibleMetadata } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const useOnChain = publicClient && isSupportedBaseChain(chainId);
      const activeChain =
        useOnChain ? (chainId as number) : CHAIN_IDS.baseSepolia;
      const collectionAddress = getPudgyChickenCollectionAddress(activeChain);

      const results = await Promise.all(
        UNIQUE_COLLECTIBLES_TOKEN_IDS.map(async (tokenId) => {
          try {
            if (useOnChain && collectionAddress && publicClient) {
              const metadata = await fetchUniqueCollectibleMetadataOnChain(
                collectionAddress,
                tokenId,
                publicClient
              );
              return { tokenId, metadata };
            }
            // Sem wallet/chain: usa a URL hardcoded (override para 13/17, base para os demais)
            const metadata = await fetchUniqueCollectibleMetadata(tokenId);
            return { tokenId, metadata };
          } catch {
            return { tokenId, metadata: null };
          }
        })
      );

      if (!cancelled) {
        setItems(results);
        setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, chainId]);

  const loaded = useMemo(() => items.filter((it) => it.metadata), [items]);
  const participantCount = loaded.length;

  return (
    <section id="special-collectibles" className="py-16 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            {t("specialShowcase.participants")}: {participantCount}/{UNIQUE_COLLECTIBLES_TOKEN_IDS.length}
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold font-display">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t("specialShowcase.title")}
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("specialShowcase.subtitle")}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("specialShowcase.loading")}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {items.map(({ tokenId, metadata }) => {
              const participantName = pickParticipantName(metadata, tokenId);
              const traitLabel = pickDisplayTrait(metadata);
              return (
                <Card
                  key={tokenId}
                  className="overflow-hidden group border-amber-500/20 hover:border-amber-500/50 transition-colors"
                >
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {metadata?.image ? (
                      <img
                        src={metadata.image}
                        alt={metadata.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                        {t("specialShowcase.error")}
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-amber-500/90 text-white border-0">
                        <Sparkles className="h-3 w-3 mr-1" />#{tokenId}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("specialShowcase.tokenId")} #{tokenId}
                      </p>
                      <h3 className="font-semibold truncate" title={participantName}>
                        {participantName}
                      </h3>
                      {traitLabel && (
                        <p className="text-xs text-muted-foreground truncate" title={traitLabel}>
                          {traitLabel}
                        </p>
                      )}
                    </div>
                    {metadata && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelected({ tokenId, metadata })}
                      >
                        {t("specialShowcase.viewDetails")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <UniqueCollectibleModal
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          tokenId={selected.tokenId}
          metadata={selected.metadata}
        />
      )}
    </section>
  );
};
