import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { Address, Log } from "viem";
import { PUDGY_CHICKEN_FIGHT_ABI } from "@/lib/abi";
import { getFightAddress } from "@/lib/contracts-helpers";

/**
 * 30 days window the contract enforces for winners to claim.
 * Must match `CLAIM_TIMEOUT` constant in PudgyChickenFight.sol (30 days).
 */
export const CLAIM_TIMEOUT_SECONDS = 30 * 24 * 60 * 60;

/**
 * Canonical match status enum (mirrors IPudgyChickenFight.MatchStatus).
 * 0 = WaitingOpponent, 1 = InProgress, 2 = Resolving (VRF pending),
 * 3 = Resolved (winner decided — NFTs/prize claimable).
 */
export const MATCH_STATUS_RESOLVED = 3;

export interface BattleClaimState {
  /** Block timestamp (seconds) when MatchResolved was emitted, or null if unknown. */
  resolvedAt: bigint | null;
  /** Unix seconds when the 30-day window ends, or null. */
  claimDeadline: bigint | null;
  /** True if block.timestamp is past the deadline. */
  isExpired: boolean;
  /** Loading the resolve timestamp from event logs. */
  isLoadingDeadline: boolean;
}

export interface UseBattleClaimResult extends BattleClaimState {
  /** Call claimResolvedNFTs(matchId). */
  claimNfts: () => void;
  /** Call claimPrize(matchId). */
  claimPrize: () => void;
  /** True while NFT claim tx is pending (wallet + confirmation). */
  isClaimingNfts: boolean;
  /** True while prize claim tx is pending. */
  isClaimingPrize: boolean;
  /** True after NFT claim tx is confirmed onchain. */
  nftsClaimed: boolean;
  /** True after prize claim tx is confirmed onchain. */
  prizeClaimed: boolean;
  /** Most recent error from either claim attempt, if any. */
  error: Error | null;
}

/**
 * Handles the two pull-based rewards of a finished PudgyChickenFight match:
 *   - `claimResolvedNFTs(matchId)` — winner gets both NFTs (or, after 30d,
 *     each player can recover their own).
 *   - `claimPrize(matchId)`        — winner gets the ETH/USDC pot (PAID matches).
 *
 * Also resolves the 30-day deadline by reading the `MatchResolved` event log
 * for this match (the contract does not expose a `resolvedAt` view).
 */
export function useBattleClaim(matchId: bigint | null): UseBattleClaimResult {
  const { chainId } = useAccount();
  const publicClient = usePublicClient();

  const [resolvedAt, setResolvedAt] = useState<bigint | null>(null);
  const [isLoadingDeadline, setIsLoadingDeadline] = useState(false);
  const [nftsClaimed, setNftsClaimed] = useState(false);
  const [prizeClaimed, setPrizeClaimed] = useState(false);

  // Separate write instances so the two buttons don't trample each other's state
  const nftWrite = useWriteContract();
  const prizeWrite = useWriteContract();

  const nftReceipt = useWaitForTransactionReceipt({
    hash: nftWrite.data,
  });
  const prizeReceipt = useWaitForTransactionReceipt({
    hash: prizeWrite.data,
  });

  // Resolve deadline by locating the MatchResolved event for this matchId.
  useEffect(() => {
    if (!publicClient || !chainId || matchId === null) return;
    const fightAddress = getFightAddress(chainId);
    if (!fightAddress) return;

    let cancelled = false;
    setIsLoadingDeadline(true);
    setResolvedAt(null);

    (async () => {
      try {
        const logs = (await publicClient.getLogs({
          address: fightAddress as Address,
          event: {
            type: "event",
            name: "MatchResolved",
            inputs: [
              { name: "matchId", type: "uint256", indexed: true },
              { name: "winner", type: "address", indexed: true },
              { name: "loser", type: "address", indexed: true },
              { name: "winningAttribute", type: "uint8", indexed: false },
              { name: "prizeAmount", type: "uint256", indexed: false },
            ],
          },
          args: { matchId },
          fromBlock: "earliest",
          toBlock: "latest",
        })) as Log[];

        if (cancelled || logs.length === 0) {
          return;
        }

        const block = await publicClient.getBlock({
          blockHash: logs[0].blockHash!,
        });
        if (!cancelled) {
          setResolvedAt(block.timestamp);
        }
      } catch (err) {
        console.warn("[useBattleClaim] Failed to load MatchResolved log:", err);
      } finally {
        if (!cancelled) setIsLoadingDeadline(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicClient, chainId, matchId]);

  // Flip confirmed flags when receipts succeed
  useEffect(() => {
    if (nftReceipt.isSuccess) setNftsClaimed(true);
  }, [nftReceipt.isSuccess]);
  useEffect(() => {
    if (prizeReceipt.isSuccess) setPrizeClaimed(true);
  }, [prizeReceipt.isSuccess]);

  const claimNfts = useCallback(() => {
    if (!chainId || matchId === null) return;
    const fightAddress = getFightAddress(chainId);
    if (!fightAddress) return;
    nftWrite.writeContract({
      address: fightAddress as Address,
      abi: PUDGY_CHICKEN_FIGHT_ABI,
      functionName: "claimResolvedNFTs",
      args: [matchId],
    });
  }, [chainId, matchId, nftWrite]);

  const claimPrize = useCallback(() => {
    if (!chainId || matchId === null) return;
    const fightAddress = getFightAddress(chainId);
    if (!fightAddress) return;
    prizeWrite.writeContract({
      address: fightAddress as Address,
      abi: PUDGY_CHICKEN_FIGHT_ABI,
      functionName: "claimPrize",
      args: [matchId],
    });
  }, [chainId, matchId, prizeWrite]);

  const claimDeadline =
    resolvedAt !== null ? resolvedAt + BigInt(CLAIM_TIMEOUT_SECONDS) : null;
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const isExpired = claimDeadline !== null && nowSec > claimDeadline;

  return {
    resolvedAt,
    claimDeadline,
    isExpired,
    isLoadingDeadline,
    claimNfts,
    claimPrize,
    isClaimingNfts: nftWrite.isPending || nftReceipt.isLoading,
    isClaimingPrize: prizeWrite.isPending || prizeReceipt.isLoading,
    nftsClaimed,
    prizeClaimed,
    error: (nftWrite.error ?? prizeWrite.error ?? nftReceipt.error ?? prizeReceipt.error) as Error | null,
  };
}
