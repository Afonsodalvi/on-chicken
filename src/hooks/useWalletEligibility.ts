import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { Address } from "viem";
import { getPudgyChickenCollectionAddress, getTokenBalance, isWhitelisted } from "@/lib/contracts-helpers";
import { isSupportedBaseChain } from "@/lib/contracts";
import { whitelistService } from "@/lib/supabase";
import {
  UNIQUE_COLLECTIBLES_TOKEN_IDS,
  fetchUniqueCollectibleMetadata,
  type UniqueCollectibleMetadata,
} from "@/lib/unique-collectibles";

export interface UniqueCollectibleInfo {
  tokenId: number;
  metadata: UniqueCollectibleMetadata;
}

export interface WalletEligibilityResult {
  isWhitelisted: boolean | null;
  whitelistSource: "onchain" | "database" | null;
  uniqueCollectible: UniqueCollectibleInfo | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Verifica se a carteira conectada está na whitelist e/ou possui algum colecionável único (token 11–18).
 * Se possuir 11–18, busca o metadado do primeiro encontrado.
 */
export function useWalletEligibility(): WalletEligibilityResult {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [isWhitelistedUser, setIsWhitelistedUser] = useState<boolean | null>(null);
  const [whitelistSource, setWhitelistSource] = useState<"onchain" | "database" | null>(null);
  const [uniqueCollectible, setUniqueCollectible] = useState<UniqueCollectibleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      if (!isConnected || !address || !publicClient || !chainId) {
        setIsWhitelistedUser(null);
        setWhitelistSource(null);
        setUniqueCollectible(null);
        setError(null);
        return;
      }

      if (!isSupportedBaseChain(chainId)) {
        setError("Connect to Base Sepolia");
        setIsWhitelistedUser(null);
        setWhitelistSource(null);
        setUniqueCollectible(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const collectionAddress = getPudgyChickenCollectionAddress(chainId);
        if (!collectionAddress) {
          setError("Contract not found for this network");
          setIsLoading(false);
          return;
        }

        // On-chain é a verdade primária. Supabase aprovado é fallback opcional.
        const [whitelistedOnChain, approvedInDB, ...balances] = await Promise.all([
          isWhitelisted(collectionAddress, address as Address, publicClient),
          whitelistService.isApprovedInDB(address as string),
          ...UNIQUE_COLLECTIBLES_TOKEN_IDS.map((id) =>
            getTokenBalance(collectionAddress, address as Address, BigInt(id), publicClient)
          ),
        ]);

        if (whitelistedOnChain) {
          setIsWhitelistedUser(true);
          setWhitelistSource("onchain");
        } else if (approvedInDB) {
          setIsWhitelistedUser(true);
          setWhitelistSource("database");
        } else {
          setIsWhitelistedUser(false);
          setWhitelistSource(null);
        }

        const firstOwnedIndex = (balances as bigint[]).findIndex((b) => b > 0n);
        if (firstOwnedIndex === -1) {
          setUniqueCollectible(null);
          setIsLoading(false);
          return;
        }

        const tokenId = UNIQUE_COLLECTIBLES_TOKEN_IDS[firstOwnedIndex];
        const metadata = await fetchUniqueCollectibleMetadata(tokenId);
        if (metadata) {
          setUniqueCollectible({ tokenId, metadata });
        } else {
          setUniqueCollectible(null);
        }
      } catch (e: any) {
        console.error("useWalletEligibility error:", e);
        setError(e?.message ?? "Error checking eligibility");
        setUniqueCollectible(null);
      } finally {
        setIsLoading(false);
      }
    }

    run();
  }, [isConnected, address, publicClient, chainId]);

  return {
    isWhitelisted: isWhitelistedUser,
    whitelistSource,
    uniqueCollectible,
    isLoading,
    error,
  };
}
