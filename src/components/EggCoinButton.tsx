import React from "react";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface EggCoinButtonProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const EggCoinButton: React.FC<EggCoinButtonProps> = ({
  size = "sm",
  className = ""
}) => {
  const { t } = useLanguage();

  const handleEggCoinClick = () => {
    // TODO: Implement EggCoin purchase logic
    console.log("EggCoin purchase clicked");
  };

  return (
    <Button
      onClick={handleEggCoinClick}
      variant="outline"
      size={size}
      className={`border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary-foreground font-medium px-4 py-2 min-w-[100px] ${className}`}
    >
      <Coins className="w-4 h-4 mr-2" />
      <span className="text-sm">EggCoin</span>
    </Button>
  );
};
