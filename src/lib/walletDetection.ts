import { useEffect, useState } from "react";

export interface DetectedWallet {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: DetectedWallet;
  provider: unknown;
}

interface EIP6963AnnounceEvent extends Event {
  detail: EIP6963ProviderDetail;
}

export const useDetectedWallets = (): {
  wallets: DetectedWallet[];
  hasInjected: boolean;
} => {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const seen = new Map<string, DetectedWallet>();

    const onAnnounce = (event: Event) => {
      const e = event as EIP6963AnnounceEvent;
      const info = e.detail?.info;
      if (!info?.uuid) return;
      if (seen.has(info.uuid)) return;
      seen.set(info.uuid, info);
      setWallets(Array.from(seen.values()));
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);

  const hasInjected =
    wallets.length > 0 ||
    (typeof window !== "undefined" &&
      typeof (window as { ethereum?: unknown }).ethereum !== "undefined");

  return { wallets, hasInjected };
};
