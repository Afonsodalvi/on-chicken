import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccount } from "wagmi";
import { CHAIN_IDS } from "@/lib/contracts";
import { getPudgyChickenCollectionAddress } from "@/lib/contracts-helpers";
import type { UniqueCollectibleMetadata } from "@/lib/unique-collectibles";

const OPENSEA_BASE_SEPOLIA = "https://testnets.opensea.io/assets/base-sepolia";
const BASESCAN_SEPOLIA = "https://sepolia.basescan.org";
const OPENSEA_BASE = "https://opensea.io/assets/base";
const BASESCAN_BASE = "https://basescan.org";

function getCollectibleLinks(collectionAddress: string, tokenId: number, chainId: number) {
  const isTestnet = chainId === CHAIN_IDS.baseSepolia;
  const openSeaBase = isTestnet ? OPENSEA_BASE_SEPOLIA : OPENSEA_BASE;
  const basescanBase = isTestnet ? BASESCAN_SEPOLIA : BASESCAN_BASE;
  return {
    openSea: `${openSeaBase}/${collectionAddress}/${tokenId}`,
    basescan: `${basescanBase}/token/${collectionAddress}?a=${tokenId}`,
  };
}

interface UniqueCollectibleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: number;
  metadata: UniqueCollectibleMetadata;
}

export const UniqueCollectibleModal: React.FC<UniqueCollectibleModalProps> = ({
  open,
  onOpenChange,
  tokenId,
  metadata,
}) => {
  const { t } = useLanguage();
  const { chainId } = useAccount();
  const collectionAddress = chainId ? getPudgyChickenCollectionAddress(chainId) : null;
  const links = collectionAddress ? getCollectibleLinks(collectionAddress, tokenId, chainId ?? 0) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <DialogTitle>{t("uniqueCollectible.modal.title")}</DialogTitle>
          </div>
          <DialogDescription>{t("uniqueCollectible.modal.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="rounded-xl overflow-hidden border bg-muted/30 aspect-square max-h-80 w-full mx-auto">
            <img
              src={metadata.image}
              alt={metadata.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h3 className="font-semibold text-lg text-foreground">{metadata.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{metadata.description}</p>
          </div>

          {metadata.attributes && metadata.attributes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">
                {t("uniqueCollectible.modal.attributes")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {metadata.attributes.map((attr, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {attr.trait_type}: {attr.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {links && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={links.openSea} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  OpenSea
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={links.basescan} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t("uniqueCollectible.modal.viewOnChain")}
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
