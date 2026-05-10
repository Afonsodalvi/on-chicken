import React, { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect, type Connector } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  ChevronDown,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Globe,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useDetectedWallets } from "@/lib/walletDetection";

interface ConnectWalletProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showBalance?: boolean;
  className?: string;
}

const isCoinbaseConnector = (c: Connector) =>
  c.id === "coinbaseWalletSDK" || c.id === "coinbaseWallet" || /coinbase/i.test(c.name);

const isWalletConnectConnector = (c: Connector) =>
  c.id === "walletConnect" || /walletconnect/i.test(c.name);

const isInjectedConnector = (c: Connector) =>
  c.type === "injected" && !isCoinbaseConnector(c) && !isWalletConnectConnector(c);

const friendlyConnectError = (err: unknown): string => {
  if (!err) return "";
  const message = err instanceof Error ? err.message : String(err);
  if (/User rejected|User denied|rejected the request/i.test(message))
    return "Conexão cancelada na carteira.";
  if (/already pending|Request of type 'wallet_requestPermissions'/i.test(message))
    return "Já existe uma solicitação aberta — abra a extensão da carteira.";
  if (/No injected provider|window\.ethereum is undefined|No Ethereum provider/i.test(message))
    return "Nenhuma carteira detectada neste navegador. Instale MetaMask/Rabby/Coinbase ou use WalletConnect.";
  if (/Project ID|projectId|403|Unauthorized/i.test(message))
    return "WalletConnect indisponível (projectId inválido). Use uma carteira de navegador.";
  return message.length > 160 ? `${message.slice(0, 157)}…` : message;
};

export const ConnectWallet: React.FC<ConnectWalletProps> = ({
  variant = "default",
  size = "sm",
  showBalance = false,
  className = "",
}) => {
  const { t } = useLanguage();
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { wallets: detectedWallets, hasInjected } = useDetectedWallets();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const coinbaseConnector = useMemo(
    () => connectors.find(isCoinbaseConnector),
    [connectors]
  );
  const walletConnectConnector = useMemo(
    () => connectors.find(isWalletConnectConnector),
    [connectors]
  );
  const injectedConnectors = useMemo(
    () => connectors.filter(isInjectedConnector),
    [connectors]
  );

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success(t("wallet.addressCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
    toast.success(t("wallet.disconnected"));
  };

  const handleConnect = (connector: Connector | undefined) => {
    if (!connector) {
      toast.error("Conector não disponível neste momento.");
      console.error("[ConnectWallet] Connector requested but not configured", {
        availableIds: connectors.map((c) => c.id),
      });
      return;
    }
    reset();
    connect(
      { connector },
      {
        onSuccess: () => {
          setIsModalOpen(false);
        },
        onError: (err) => {
          console.error("[ConnectWallet] Connect failed", {
            connectorId: connector.id,
            connectorName: connector.name,
            error: err,
          });
          toast.error(friendlyConnectError(err) || t("wallet.connectionError"));
        },
      }
    );
  };

  const handleOpenModal = () => {
    reset();
    setIsModalOpen(true);
  };

  if (!isConnected) {
    const showInjectedFallbackMsg = !hasInjected && injectedConnectors.length === 0;

    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={handleOpenModal}
          className={`bg-gradient-hero text-primary-foreground hover:opacity-90 ${className}`}
          disabled={isPending}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isPending ? t("wallet.connecting") : t("nav.connect")}
        </Button>

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

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="break-words">{friendlyConnectError(error)}</span>
              </div>
            )}

            <div className="space-y-3 mt-2">
              {coinbaseConnector && (
                <button
                  onClick={() => handleConnect(coinbaseConnector)}
                  disabled={isPending}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-[#0052FF] hover:bg-[#0052FF]/5 transition-all group disabled:opacity-50"
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
              )}

              {walletConnectConnector && (
                <button
                  onClick={() => handleConnect(walletConnectConnector)}
                  disabled={isPending}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-[#3B99FC] hover:bg-[#3B99FC]/5 transition-all group disabled:opacity-50"
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
              )}

              {detectedWallets.length > 0 ? (
                detectedWallets.map((wallet) => {
                  const matched =
                    injectedConnectors.find((c) => c.id === wallet.rdns) ||
                    injectedConnectors.find((c) =>
                      c.name?.toLowerCase().includes(wallet.name.toLowerCase())
                    ) ||
                    injectedConnectors[0];
                  return (
                    <button
                      key={wallet.uuid}
                      onClick={() => handleConnect(matched)}
                      disabled={isPending || !matched}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                        {wallet.icon ? (
                          <img src={wallet.icon} alt={wallet.name} className="h-8 w-8 object-contain" />
                        ) : (
                          <Globe className="h-6 w-6 text-foreground" />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {wallet.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("wallet.browserWalletDesc")}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })
              ) : injectedConnectors.length > 0 ? (
                <button
                  onClick={() => handleConnect(injectedConnectors[0])}
                  disabled={isPending}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
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
              ) : null}

              {showInjectedFallbackMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Nenhuma carteira de navegador detectada. Use Coinbase Smart Wallet ou WalletConnect acima — ou instale MetaMask/Rabby/Phantom.
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground mt-2">
              {t("wallet.newToWallets")}
            </p>
          </DialogContent>
        </Dialog>
      </>
    );
  }

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
