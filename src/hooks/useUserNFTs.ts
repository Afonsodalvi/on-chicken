import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { Address } from "viem";
import { getTokenBalance, getPudgyChickenCollectionAddress, isTokenAlive, getRarityTier } from "@/lib/contracts-helpers";
import { getTokenAsset } from "@/lib/token-assets";
import { CHAIN_IDS } from "@/lib/contracts";
import { RarityTier } from "@/lib/contracts-helpers";

export interface UserNFT {
  id: number;
  name: string;
  image: string;
  tokenId: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  collection: string;
  owner: string;
  isAlive: boolean;
  balance: bigint; // Quantidade de tokens deste ID que o usuário possui
}

/**
 * Hook para buscar NFTs do usuário conectado
 * Verifica balanceOf para tokens IDs 1-10
 */
export function useUserNFTs() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserNFTs() {
      if (!isConnected || !address || !publicClient || !chainId) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      // Verificar se está na rede correta (Base Sepolia)
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

        const ownedNFTs: UserNFT[] = [];

        // Verificar tokens IDs 1-10
        for (let tokenId = 1; tokenId <= 10; tokenId++) {
          try {
            const balance = await getTokenBalance(
              collectionAddress,
              address as Address,
              BigInt(tokenId),
              publicClient
            );

            // Se o usuário possui pelo menos 1 token deste ID
            if (balance > 0n) {
              // Verificar se o token está vivo
              const alive = await isTokenAlive(
                collectionAddress,
                BigInt(tokenId),
                publicClient
              );

              // Obter asset do token (imagem e metadados)
              const asset = getTokenAsset(tokenId);
              if (!asset) {
                continue;
              }

              // Obter raridade do contrato
              let rarity: "common" | "rare" | "epic" | "legendary" = "common";
              try {
                const rarityTier = await getRarityTier(
                  collectionAddress,
                  BigInt(tokenId),
                  publicClient
                );
                
                // Converter RarityTier enum para string
                switch (rarityTier) {
                  case RarityTier.LEGENDARY:
                    rarity = "legendary";
                    break;
                  case RarityTier.EPIC:
                    rarity = "epic";
                    break;
                  case RarityTier.RARE:
                    rarity = "rare";
                    break;
                  default:
                    rarity = "common";
                }
              } catch (err) {
                // Se falhar, usar lógica baseada no ID (ID 1 = legendary, ID 10 = common)
                if (tokenId <= 2) {
                  rarity = "legendary";
                } else if (tokenId <= 4) {
                  rarity = "epic";
                } else if (tokenId <= 7) {
                  rarity = "rare";
                } else {
                  rarity = "common";
                }
              }

              ownedNFTs.push({
                id: tokenId,
                name: asset.metadata.name || `Pudgy Chicken #${tokenId.toString().padStart(3, "0")}`,
                image: asset.image,
                tokenId,
                rarity,
                collection: "Pudgy Chickens",
                owner: address,
                isAlive: alive,
                balance, // Incluir o balance (quantidade) do token
              });
            }
          } catch (err) {
            console.error(`Erro ao verificar token ${tokenId}:`, err);
            // Continuar verificando outros tokens mesmo se um falhar
          }
        }

        setNfts(ownedNFTs);
      } catch (err: any) {
        console.error("Erro ao buscar NFTs do usuário:", err);
        setError(err.message || "Erro ao buscar NFTs");
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserNFTs();
  }, [isConnected, address, publicClient, chainId]);

  return { nfts, isLoading, error };
}

