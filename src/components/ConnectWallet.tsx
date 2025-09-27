import React from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown } from "lucide-react";
import { rabbykit } from "@/lib/rabbykit";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConnectWalletProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showBalance?: boolean;
  className?: string;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({
  variant = "default",
  size = "sm",
  showBalance = false,
  className = ""
}) => {
  const { t } = useLanguage();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  // Função para formatar endereço
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Se não estiver conectado, mostrar botão de conexão
  if (!isConnected) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => rabbykit.open()}
        className={`bg-gradient-hero text-primary-foreground hover:opacity-90 ${className}`}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {t('nav.connect')}
      </Button>
    );
  }

  // Se conectado e for size pequeno (header), mostrar versão compacta
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => rabbykit.open()}
        className="border-border hover:bg-secondary flex items-center gap-2"
      >
        {/* Status indicator */}
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        
        {/* Address */}
        <span className="font-mono text-xs">
          {address && formatAddress(address)}
        </span>
        
        <ChevronDown className="h-3 w-3" />
      </Button>
    </div>
  );
};
