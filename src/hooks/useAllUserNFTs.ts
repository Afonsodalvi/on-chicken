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
import { CHAIN_IDS } from "@/lib/contracts";
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

      if (chainId !== CHAIN_IDS.baseSepolia) {
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

        const owned: UserNFTItem[] = [];

        // Tokens 1–10 (assets locais + contrato)
        for (let tokenId = 1; tokenId <= 10; tokenId++) {
          try {
            const balance = await getTokenBalance(
              collectionAddress,
              address as Address,
              BigInt(tokenId),
              publicClient
            );
            if (balance === 0n) continue;

            const alive = await isTokenAlive(
              collectionAddress,
              BigInt(tokenId),
              publicClient
            );
            const asset = getTokenAsset(tokenId);
            if (!asset) continue;

            let rarity: UserNFTRarity = "common";
            try {
              const tier = await getRarityTier(
                collectionAddress,
                BigInt(tokenId),
                publicClient
              );
              switch (tier) {
                case RarityTier.LEGENDARY: rarity = "legendary"; break;
                case RarityTier.EPIC: rarity = "epic"; break;
                case RarityTier.RARE: rarity = "rare"; break;
                default: rarity = "common";
              }
            } catch {
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
              isAlive: alive,
              balance,
              isSpecial: false,
            });
          } catch (err) {
            console.error(`Erro ao verificar token ${tokenId}:`, err);
          }
        }

        // Tokens 11–18 (metadado IPFS)
        for (const tokenId of UNIQUE_COLLECTIBLES_TOKEN_IDS) {
          try {
            const balance = await getTokenBalance(
              collectionAddress,
              address as Address,
              BigInt(tokenId),
              publicClient
            );
            if (balance === 0n) continue;

            const metadata: UniqueCollectibleMetadata | null = await fetchUniqueCollectibleMetadata(tokenId);
            owned.push({
              tokenId,
              name: metadata?.name ?? `Pudgy Chicken #${tokenId}`,
              image: metadata?.image ?? "",
              description: metadata?.description,
              rarity: "legendary",
              collection: "Pudgy Chickens",
              owner: address,
              isAlive: true,
              balance,
              isSpecial: true,
              attributes: metadata?.attributes,
            });
          } catch (err) {
            console.error(`Erro ao verificar token especial ${tokenId}:`, err);
          }
        }

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
