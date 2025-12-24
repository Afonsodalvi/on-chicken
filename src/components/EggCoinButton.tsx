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

  const handlePudgyEggsClick = () => {
    // TODO: Implement PudgyEggs acquisition logic
    console.log("PudgyEggs acquisition clicked");
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
