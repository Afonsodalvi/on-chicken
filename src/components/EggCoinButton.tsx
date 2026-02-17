import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const EGGCOIN_OPEN_EVENT = "openEggCoinMint";

/** Dispara o evento que a EggCoinSection escuta para abrir o modal de mint. */
export function openEggCoinMintModal() {
  window.dispatchEvent(new CustomEvent(EGGCOIN_OPEN_EVENT));
}

interface EggCoinButtonProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const EggCoinButton: React.FC<EggCoinButtonProps> = ({
  size = "sm",
  className = ""
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handlePudgyEggsClick = () => {
    // Se não estiver na home, ir para a home e depois scroll + abrir modal
    if (location.pathname !== "/") {
      navigate("/", { state: { openEggCoinMint: true } });
      return;
    }
    document.getElementById("eggcoin")?.scrollIntoView({ behavior: "smooth" });
    openEggCoinMintModal();
  };

  return (
    <Button
      onClick={handlePudgyEggsClick}
      variant="outline"
      size={size}
      className={`border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary-foreground font-medium px-4 py-2 min-w-[100px] ${className}`}
    >
      <span className="text-lg mr-2">🥚</span>
      <span className="text-sm">PudgyEggs</span>
    </Button>
  );
};
