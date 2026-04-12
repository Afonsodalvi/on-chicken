import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Copy, Check, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTokenAsset } from "@/lib/token-assets";
import { isBaseMainnet } from "@/lib/contracts";
import { useAccount } from "wagmi";
import { toast } from "sonner";

interface PixSuccessProps {
  tokenId: number;
  quantity: number;
  txHash: string | null;
  walletAddress: string | null;
  onNewPurchase: () => void;
}

export const PixSuccess: React.FC<PixSuccessProps> = ({
  tokenId,
  quantity,
  txHash,
  walletAddress,
  onNewPurchase,
}) => {
  const { t } = useLanguage();
  const { chainId } = useAccount();
  const [copiedWallet, setCopiedWallet] = useState(false);
  const token = getTokenAsset(tokenId);

  const handleCopyWallet = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopiedWallet(true);
    toast.success(t("wallet.copied"));
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const basescanBase = isBaseMainnet(chainId) ? "https://basescan.org" : "https://sepolia.basescan.org";
  const basescanUrl = txHash ? `${basescanBase}/tx/${txHash}` : null;

  return (
    <div className="space-y-6 max-w-md mx-auto text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
      <h3 className="text-xl font-bold">{t("pix.success")}</h3>
      <p className="text-muted-foreground">{t("pix.successDesc")}</p>

      {/* NFT preview */}
      {token && (
        <Card className="overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <img
              src={token.image}
              alt={token.metadata.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="text-left">
              <p className="font-semibold">{token.metadata.name}</p>
              <p className="text-sm text-muted-foreground">
                {t("pix.quantity")}: {quantity}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet address */}
      {walletAddress && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("pix.yourWallet")}</p>
          <div className="flex items-center gap-2 justify-center">
            <code className="text-xs bg-secondary/50 px-3 py-2 rounded font-mono break-all">
              {walletAddress}
            </code>
            <Button variant="ghost" size="sm" onClick={handleCopyWallet}>
              {copiedWallet ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Transaction link */}
      {basescanUrl && (
        <a
          href={basescanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          {t("pix.viewTransaction")}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      <Button onClick={onNewPurchase} className="w-full bg-gradient-hero">
        {t("pix.buyAnother")}
      </Button>
    </div>
  );
};
