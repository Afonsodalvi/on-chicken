import React, { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown, LogOut, Copy, Check } from "lucide-react";
import { rabbykit } from "@/lib/rabbykit";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Função para formatar endereço
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Função para copiar endereço
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Endereço copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Função para desconectar
  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
    toast.success("Carteira desconectada");
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

  // Se conectado, mostrar dropdown com opções
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="border-border hover:bg-secondary flex items-center gap-2"
      >
        {/* Status indicator */}
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        
        {/* Address */}
        <span className="font-mono text-xs">
          {address && formatAddress(address)}
        </span>
        
        <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-3 space-y-2">
            {/* Endereço completo */}
            <div className="p-2 bg-secondary/50 rounded text-xs font-mono break-all">
              {address}
            </div>
            
            {/* Chain info */}
            {chain && (
              <div className="text-xs text-muted-foreground">
                Rede: {chain.name}
              </div>
            )}
            
            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
                className="flex-1 text-xs"
              >
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="flex-1 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Desconectar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};
