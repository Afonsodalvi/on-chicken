import React from "react";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface PixStatusProps {
  status: string;
  onRetry: () => void;
}

export const PixStatus: React.FC<PixStatusProps> = ({ status, onRetry }) => {
  const { t } = useLanguage();

  const statusConfig: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    pending: {
      icon: <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />,
      text: t("pix.statusPending"),
      color: "text-yellow-500",
    },
    paid: {
      icon: <Loader2 className="h-12 w-12 animate-spin text-blue-500" />,
      text: t("pix.statusPaid"),
      color: "text-blue-500",
    },
    minting: {
      icon: <Loader2 className="h-12 w-12 animate-spin text-purple-500" />,
      text: t("pix.statusMinting"),
      color: "text-purple-500",
    },
    minted: {
      icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
      text: t("pix.statusMinted"),
      color: "text-green-500",
    },
    failed: {
      icon: <XCircle className="h-12 w-12 text-destructive" />,
      text: t("pix.statusFailed"),
      color: "text-destructive",
    },
    mint_failed: {
      icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
      text: t("pix.statusMintFailed"),
      color: "text-orange-500",
    },
    expired: {
      icon: <XCircle className="h-12 w-12 text-muted-foreground" />,
      text: t("pix.statusExpired"),
      color: "text-muted-foreground",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {config.icon}
      <p className={`text-lg font-medium ${config.color}`}>{config.text}</p>

      {(status === "failed" || status === "expired" || status === "mint_failed") && (
        <Button onClick={onRetry} variant="outline">
          {t("pix.tryAgain")}
        </Button>
      )}
    </div>
  );
};
