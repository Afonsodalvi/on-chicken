import React from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, ChevronDown, Globe, CheckCircle, Clock } from "lucide-react";
import { isBaseSepolia, isBaseMainnet, isSupportedBaseChain, isMainnetLive, getMainnetLaunchDate } from "@/lib/contracts";

interface NetworkBadgeProps {
  className?: string;
}

export const NetworkBadge: React.FC<NetworkBadgeProps> = ({ className = "" }) => {
  const { chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected) return null;

  const isTestnet = isBaseSepolia(chainId);
  const isMainnet = isBaseMainnet(chainId);
  const mainnetLive = isMainnetLive();

  const launchDate = getMainnetLaunchDate();
  const launchLabel = launchDate.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit",
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors cursor-pointer focus:outline-none ${
            isTestnet
              ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              : isMainnet && mainnetLive
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              : isMainnet && !mainnetLive
              ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
              : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
          } ${className}`}
        >
          {isTestnet ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="hidden sm:inline">Base Sepolia</span>
              <span className="sm:hidden">Testnet</span>
              <Badge variant="outline" className="ml-0.5 px-1 py-0 text-[10px] border-amber-500/30 text-amber-500">
                BETA
              </Badge>
            </>
          ) : isMainnet && mainnetLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Base</span>
              <span className="sm:hidden">Mainnet</span>
            </>
          ) : isMainnet && !mainnetLive ? (
            <>
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline">Base — {launchLabel}</span>
              <span className="sm:hidden">Em breve</span>
              <Badge variant="outline" className="ml-0.5 px-1 py-0 text-[10px] border-blue-500/30 text-blue-500">
                SOON
              </Badge>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              <span>Rede Incorreta</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => switchChain?.({ chainId: baseSepolia.id })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Globe className="h-4 w-4 text-amber-500" />
          <div className="flex-1">
            <div className="font-medium">Base Sepolia</div>
            <div className="text-xs text-muted-foreground">Testnet (Beta)</div>
          </div>
          {isTestnet && <CheckCircle className="h-4 w-4 text-amber-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (mainnetLive) {
              switchChain?.({ chainId: base.id });
            }
          }}
          className={`flex items-center gap-2 ${mainnetLive ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
          disabled={!mainnetLive}
        >
          <Globe className="h-4 w-4 text-emerald-500" />
          <div className="flex-1">
            <div className="font-medium">Base</div>
            <div className="text-xs text-muted-foreground">
              {mainnetLive ? "Mainnet" : `Mainnet — lança ${launchLabel}`}
            </div>
          </div>
          {isMainnet && mainnetLive && <CheckCircle className="h-4 w-4 text-emerald-500" />}
          {!mainnetLive && <Clock className="h-4 w-4 text-blue-500" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
