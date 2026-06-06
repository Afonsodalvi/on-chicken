import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { UNIQUE_COLLECTIBLES_TOKEN_IDS } from "@/lib/unique-collectibles";
import { getPudgyChickenCollectionAddress, getTokenBalance } from "@/lib/contracts-helpers";
import { isSupportedBaseChain } from "@/lib/contracts";

const STANDARD_TOKEN_IDS = Array.from({ length: 10 }, (_, index) => index + 1);
export const COLLECTION_HOLDER_TOKEN_IDS = [...STANDARD_TOKEN_IDS, ...UNIQUE_COLLECTIBLES_TOKEN_IDS];

export function useCollectionHolder() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const isWrongNetwork = Boolean(isConnected && chainId && !isSupportedBaseChain(chainId));

  const enabled = Boolean(isConnected && address && publicClient && chainId && !isWrongNetwork);

  const query = useQuery({
    queryKey: ["collection-holder", chainId, address],
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      if (!address || !publicClient || !chainId) {
        return { isHolder: false, tokenIds: [] as number[], balances: {} as Record<number, string> };
      }

      const collectionAddress = getPudgyChickenCollectionAddress(chainId);
      if (!collectionAddress) {
        throw new Error("Contrato da colecao nao encontrado nesta rede");
      }

      const balances = await Promise.all(
        COLLECTION_HOLDER_TOKEN_IDS.map((tokenId) =>
          getTokenBalance(collectionAddress, address as Address, BigInt(tokenId), publicClient)
        )
      );

      const tokenIds = COLLECTION_HOLDER_TOKEN_IDS.filter((_, index) => balances[index] > 0n);
      const balanceMap = COLLECTION_HOLDER_TOKEN_IDS.reduce<Record<number, string>>((acc, tokenId, index) => {
        if (balances[index] > 0n) acc[tokenId] = balances[index].toString();
        return acc;
      }, {});

      return {
        isHolder: tokenIds.length > 0,
        tokenIds,
        balances: balanceMap,
      };
    },
  });

  return useMemo(
    () => ({
      isConnected,
      chainId,
      isWrongNetwork,
      isLoading: enabled && query.isLoading,
      isFetching: enabled && query.isFetching,
      isHolder: query.data?.isHolder ?? false,
      tokenIds: query.data?.tokenIds ?? [],
      balances: query.data?.balances ?? {},
      error: isWrongNetwork
        ? "Conecte-se a Base Sepolia ou Base"
        : query.error instanceof Error
          ? query.error.message
          : null,
      refetch: query.refetch,
    }),
    [
      isConnected,
      chainId,
      isWrongNetwork,
      enabled,
      query.isLoading,
      query.isFetching,
      query.data?.isHolder,
      query.data?.tokenIds,
      query.data?.balances,
      query.error,
      query.refetch,
    ]
  );
}
