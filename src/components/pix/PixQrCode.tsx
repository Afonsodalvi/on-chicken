import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface PixQrCodeProps {
  qrCodeUrl: string | null;
  copyPasteCode: string | null;
  expiresAt: string | null;
  amount: number; // centavos
  onExpired: () => void;
}

export const PixQrCode: React.FC<PixQrCodeProps> = ({
  qrCodeUrl,
  copyPasteCode,
  expiresAt,
  amount,
  onExpired,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        onExpired();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const handleCopy = async () => {
    if (!copyPasteCode) return;
    await navigator.clipboard.writeText(copyPasteCode);
    setCopied(true);
    toast.success(t("pix.codeCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <h3 className="text-lg font-semibold text-center">{t("pix.scanQr")}</h3>

      <Card className="border-primary/20">
        <CardContent className="p-6 space-y-4">
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t("pix.totalAmount")}</p>
            <p className="text-2xl font-bold text-primary">{formattedAmount}</p>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl">
                <img
                  src={qrCodeUrl}
                  alt="PIX QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>
          )}

          {/* Copy-paste code */}
          {copyPasteCode && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">{t("pix.orCopyCode")}</p>
              <div className="flex gap-2">
                <div className="flex-1 p-2 bg-secondary/50 rounded text-xs font-mono break-all max-h-16 overflow-y-auto">
                  {copyPasteCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Timer */}
          {timeLeft && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t("pix.expiresIn")} {timeLeft}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">{t("pix.waitingPayment")}</p>
    </div>
  );
};
