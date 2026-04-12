import React, { useState, useCallback } from "react";
import { NftSelector } from "./NftSelector";
import { PixEmailForm } from "./PixEmailForm";
import { PixQrCode } from "./PixQrCode";
import { PixStatus } from "./PixStatus";
import { PixSuccess } from "./PixSuccess";
import { useCreatePixOrder, useOrderStatus } from "@/hooks/usePixOrder";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";
import type { TokenAsset } from "@/lib/token-assets";
import type { CreateOrderResponse } from "@/lib/pix-api";
import { PixServiceUnavailableError } from "@/lib/pix-api";

type Step = "select_nft" | "enter_email" | "show_qr" | "processing" | "success" | "unavailable";

export const PixBuyFlow: React.FC = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("select_nft");
  const [selectedToken, setSelectedToken] = useState<TokenAsset | null>(null);
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const createOrder = useCreatePixOrder();
  const orderStatus = useOrderStatus(orderData?.orderId || null, userEmail);

  // Detect status changes from polling
  React.useEffect(() => {
    if (!orderStatus.data) return;

    const { status } = orderStatus.data;
    if (status === "paid" || status === "minting") {
      setStep("processing");
    } else if (status === "minted") {
      setStep("success");
    }
  }, [orderStatus.data?.status]);

  const handleSelectNft = useCallback((token: TokenAsset) => {
    setSelectedToken(token);
    setStep("enter_email");
  }, []);

  const handleEmailSubmit = useCallback(
    async (data: { email: string; cpf: string }) => {
      if (!selectedToken) return;

      try {
        const result = await createOrder.mutateAsync({
          email: data.email,
          cpf: data.cpf,
          tokenId: selectedToken.tokenId,
          quantity: 1,
        });

        setOrderData(result);
        setUserEmail(data.email);
        setStep("show_qr");
      } catch (error) {
        if (error instanceof PixServiceUnavailableError) {
          setStep("unavailable");
        } else {
          toast.error(error instanceof Error ? error.message : t("pix.errorCreatingOrder"));
        }
      }
    },
    [selectedToken, createOrder, t]
  );

  const handleExpired = useCallback(() => {
    toast.error(t("pix.statusExpired"));
    setStep("select_nft");
  }, [t]);

  const handleRetry = useCallback(() => {
    setOrderData(null);
    setStep("select_nft");
  }, []);

  // Progress indicator
  const steps = [
    { key: "select_nft", label: t("pix.step1") },
    { key: "enter_email", label: t("pix.step2") },
    { key: "show_qr", label: t("pix.step3") },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Step indicator */}
      {step !== "success" && step !== "processing" && step !== "unavailable" && (
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <div
                className={`flex items-center gap-2 ${
                  i <= currentStepIndex ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i <= currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span className="hidden sm:inline text-sm">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-px ${
                    i < currentStepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step content */}
      {step === "select_nft" && (
        <NftSelector
          onSelect={handleSelectNft}
          selectedTokenId={selectedToken?.tokenId || null}
        />
      )}

      {step === "enter_email" && (
        <PixEmailForm
          onSubmit={handleEmailSubmit}
          onBack={() => setStep("select_nft")}
          isLoading={createOrder.isPending}
        />
      )}

      {step === "show_qr" && orderData && (
        <PixQrCode
          qrCodeUrl={orderData.pixQrCode}
          copyPasteCode={orderData.pixCopyPaste}
          expiresAt={orderData.expiresAt}
          amount={orderData.amount}
          onExpired={handleExpired}
        />
      )}

      {step === "processing" && orderStatus.data && (
        <PixStatus status={orderStatus.data.status} onRetry={handleRetry} />
      )}

      {step === "success" && orderStatus.data && (
        <PixSuccess
          tokenId={orderStatus.data.tokenId}
          quantity={orderStatus.data.quantity}
          txHash={orderStatus.data.txHash}
          walletAddress={orderStatus.data.walletAddress}
          onNewPurchase={handleRetry}
        />
      )}

      {step === "unavailable" && (
        <Card className="max-w-md mx-auto border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Construction className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {t("pix.unavailable.title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("pix.unavailable.description")}
            </p>
            <Button
              variant="outline"
              onClick={handleRetry}
              className="mt-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("pix.unavailable.back")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
