import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { coinbaseWallet, walletConnect, injected } from "@wagmi/connectors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink, Smartphone, Globe, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

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
  className = "",
}) => {
  const { t } = useLanguage();
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success(t("wallet.addressCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
    toast.success(t("wallet.disconnected"));
  };

  const handleConnect = (connectorType: "coinbase" | "walletconnect" | "injected") => {
    try {
      switch (connectorType) {
        case "coinbase":
          connect({
            connector: coinbaseWallet({
              appName: "Pudgy Farms",
              preference: "smartWalletOnly",
            }),
          });
          break;
        case "walletconnect":
          connect({
            connector: walletConnect({
              projectId: WALLETCONNECT_PROJECT_ID,
              showQrModal: true,
              metadata: {
                name: "Pudgy Farms",
                description: "Pudgy Farms - RWAnimal Tokenization Protocol",
                url: "https://pudgyfarms.com",
                icons: ["https://pudgyfarms.com/favicon.ico"],
              },
            }),
          });
          break;
        case "injected":
          connect({ connector: injected() });
          break;
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Connection error:", err);
      toast.error(t("wallet.connectionError"));
    }
  };

  // Not connected — show connect button
  if (!isConnected) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsModalOpen(true)}
          className={`bg-gradient-hero text-primary-foreground hover:opacity-90 ${className}`}
          disabled={isPending}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isPending ? t("wallet.connecting") : t("nav.connect")}
        </Button>

        {/* Wallet Selection Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                {t("wallet.selectWallet")}
              </DialogTitle>
              <DialogDescription>
                {t("wallet.selectDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              {/* Coinbase Smart Wallet */}
              <button
                onClick={() => handleConnect("coinbase")}
                disabled={isPending}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-[#0052FF] hover:bg-[#0052FF]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0052FF] flex items-center justify-center shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-foreground group-hover:text-[#0052FF] transition-colors">
                    Coinbase Smart Wallet
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("wallet.coinbaseDesc")}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* WalletConnect */}
              <button
                onClick={() => handleConnect("walletconnect")}
                disabled={isPending}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-[#3B99FC] hover:bg-[#3B99FC]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#3B99FC] flex items-center justify-center shrink-0">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-foreground group-hover:text-[#3B99FC] transition-colors">
                    WalletConnect
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("wallet.walletConnectDesc")}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Browser Wallet (MetaMask, Rabby, etc.) */}
              <button
                onClick={() => handleConnect("injected")}
                disabled={isPending}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t("wallet.browserWallet")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("wallet.browserWalletDesc")}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-2">
              {t("wallet.newToWallets")}
            </p>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Connected — show address dropdown
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="border-border hover:bg-secondary flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="font-mono text-xs">{address && formatAddress(address)}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
      </Button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-3 space-y-2">
            <div className="p-2 bg-secondary/50 rounded text-xs font-mono break-all">{address}</div>
            {chain && (
              <div className="text-xs text-muted-foreground">
                {t("wallet.network")}: {chain.name}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAddress} className="flex-1 text-xs">
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? t("wallet.copied") : t("wallet.copy")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="flex-1 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-3 w-3 mr-1" />
                {t("wallet.disconnect")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
      )}
    </div>
  );
};
