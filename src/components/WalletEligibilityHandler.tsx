import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWalletEligibility } from "@/hooks/useWalletEligibility";
import { UniqueCollectibleModal } from "./UniqueCollectibleModal";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gift, X } from "lucide-react";

const UNIQUE_MODAL_SHOWN_KEY = "pudgy_unique_collectible_modal_shown";

/**
 * Verifica whitelist e colecionáveis únicos (11–18). Se whitelist, mostra CTA para free mint.
 * Se possui token 11–18, mostra modal do colecionável único (uma vez por sessão).
 */
export const WalletEligibilityHandler: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { isWhitelisted, uniqueCollectible, isLoading } = useWalletEligibility();
  const [uniqueModalOpen, setUniqueModalOpen] = useState(false);
  const [whitelistBannerDismissed, setWhitelistBannerDismissed] = useState(false);
  const hasShownUniqueModalRef = useRef(false);

  // Mostrar modal do colecionável único no máximo uma vez por sessão
  useEffect(() => {
    if (isLoading || !uniqueCollectible) return;
    if (hasShownUniqueModalRef.current) return;
    const sessionKey = `${UNIQUE_MODAL_SHOWN_KEY}_${uniqueCollectible.tokenId}`;
    if (sessionStorage.getItem(sessionKey) === "1") return;
    hasShownUniqueModalRef.current = true;
    sessionStorage.setItem(sessionKey, "1");
    setUniqueModalOpen(true);
  }, [uniqueCollectible, isLoading]);

  const showWhitelistBanner =
    isWhitelisted === true &&
    !whitelistBannerDismissed &&
    location.pathname !== "/whitelist";

  return (
    <>
      {showWhitelistBanner && (
        <div className="fixed top-16 left-0 right-0 z-40 px-4 py-2 bg-primary/95 text-primary-foreground shadow-md">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Gift className="h-4 w-4 shrink-0" />
              {t("eligibility.whitelist.cta")}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                className="text-primary bg-primary-foreground hover:bg-primary-foreground/90"
                onClick={() => navigate("/whitelist")}
              >
                {t("eligibility.whitelist.goToMint")}
              </Button>
              <button
                type="button"
                aria-label="Fechar"
                className="p-1 rounded hover:bg-white/20"
                onClick={() => setWhitelistBannerDismissed(true)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {uniqueCollectible && (
        <UniqueCollectibleModal
          open={uniqueModalOpen}
          onOpenChange={setUniqueModalOpen}
          tokenId={uniqueCollectible.tokenId}
          metadata={uniqueCollectible.metadata}
        />
      )}
    </>
  );
};
