import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { Address } from "viem";
import {
  getTokenBalance,
  getPudgyChickenCollectionAddress,
  isTokenAlive,
  getRarityTier,
} from "@/lib/contracts-helpers";
import { getTokenAsset } from "@/lib/token-assets";
import { isSupportedBaseChain } from "@/lib/contracts";
import { RarityTier } from "@/lib/contracts-helpers";
import {
  UNIQUE_COLLECTIBLES_TOKEN_IDS,
  fetchUniqueCollectibleMetadata,
  type UniqueCollectibleMetadata,
} from "@/lib/unique-collectibles";

export type UserNFTRarity = "common" | "rare" | "epic" | "legendary";

export interface UserNFTItem {
  tokenId: number;
  name: string;
  image: string;
  description?: string;
  rarity: UserNFTRarity;
  collection: string;
  owner: string;
  isAlive: boolean;
  balance: bigint;
  /** true para tokens 11–18 (colecionáveis únicos) */
  isSpecial: boolean;
  /** Atributos do metadado (preenchido para 11–18) */
  attributes?: Array< { trait_type: string; value: string }>;
}

/**
 * Busca todos os NFTs do usuário: tokens 1–10 (coleção padrão) e 11–18 (colecionáveis únicos).
 * Para 11–18 usa metadado do IPFS.
 */
export function useAllUserNFTs() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<UserNFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      if (!isConnected || !address || !publicClient || !chainId) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      if (!isSupportedBaseChain(chainId)) {
        setError("Por favor, conecte-se à rede Base Sepolia");
        setNfts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const collectionAddress = getPudgyChickenCollectionAddress(chainId);
        if (!collectionAddress) {
          throw new Error("Contrato não encontrado para esta rede");
        }

        // Buscar TODOS os balances em paralelo — o transport agrupa via multicall3
        // (1 request HTTP em vez de 18). Mesmo nas RPCs públicas, cai bem abaixo do rate limit.
        const standardTokenIds = Array.from({ length: 10 }, (_, i) => i + 1);
        const allTokenIds = [...standardTokenIds, ...UNIQUE_COLLECTIBLES_TOKEN_IDS];

        const balances = await Promise.all(
          allTokenIds.map((tokenId) =>
            getTokenBalance(collectionAddress, address as Address, BigInt(tokenId), publicClient)
          )
        );

        // Filtrar apenas IDs com saldo > 0 antes de buscar dados extras
        const ownedIds = allTokenIds.filter((_, i) => balances[i] > 0n);
        const ownedBalances = new Map(allTokenIds.map((id, i) => [id, balances[i]]));
        const standardOwned = ownedIds.filter((id) => id <= 10);
        const specialOwned = ownedIds.filter((id) => id >= 11);

        // Para tokens 1–10: alive + rarity em paralelo (também via multicall)
        const [aliveResults, rarityResults] = await Promise.all([
          Promise.all(
            standardOwned.map((id) =>
              isTokenAlive(collectionAddress, BigInt(id), publicClient).catch(() => true)
            )
          ),
          Promise.all(
            standardOwned.map((id) =>
              getRarityTier(collectionAddress, BigInt(id), publicClient).catch(() => null)
            )
          ),
        ]);

        const owned: UserNFTItem[] = [];

        standardOwned.forEach((tokenId, idx) => {
          const asset = getTokenAsset(tokenId);
          if (!asset) return;

          let rarity: UserNFTRarity = "common";
          const tier = rarityResults[idx];
          if (tier !== null) {
            switch (tier) {
              case RarityTier.LEGENDARY: rarity = "legendary"; break;
              case RarityTier.EPIC: rarity = "epic"; break;
              case RarityTier.RARE: rarity = "rare"; break;
              default: rarity = "common";
            }
          } else {
            if (tokenId <= 2) rarity = "legendary";
            else if (tokenId <= 4) rarity = "epic";
            else if (tokenId <= 7) rarity = "rare";
          }

          owned.push({
            tokenId,
            name: asset.metadata.name || `Pudgy Chicken #${String(tokenId).padStart(3, "0")}`,
            image: asset.image,
            description: asset.metadata.description,
            rarity,
            collection: "Pudgy Chickens",
            owner: address,
            isAlive: aliveResults[idx],
            balance: ownedBalances.get(tokenId) ?? 0n,
            isSpecial: false,
          });
        });

        // Tokens 11–18: metadados IPFS em paralelo
        const specialMetadata = await Promise.all(
          specialOwned.map((id) => fetchUniqueCollectibleMetadata(id).catch(() => null))
        );
        specialOwned.forEach((tokenId, idx) => {
          const metadata: UniqueCollectibleMetadata | null = specialMetadata[idx];
          owned.push({
            tokenId,
            name: metadata?.name ?? `Pudgy Chicken #${tokenId}`,
            image: metadata?.image ?? "",
            description: metadata?.description,
            rarity: "legendary",
            collection: "Pudgy Chickens",
            owner: address,
            isAlive: true,
            balance: ownedBalances.get(tokenId) ?? 0n,
            isSpecial: true,
            attributes: metadata?.attributes,
          });
        });

        owned.sort((a, b) => a.tokenId - b.tokenId);
        setNfts(owned);
      } catch (err: any) {
        console.error("Erro ao buscar NFTs do usuário:", err);
        setError(err.message ?? "Erro ao buscar NFTs");
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, [isConnected, address, publicClient, chainId]);

  return { nfts, isLoading, error };
}
