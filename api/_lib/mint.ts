import { createWalletClient, createPublicClient, http, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, base } from "viem/chains";
import { ADMIN_MINT_ABI } from "./abi.js";
import { getConfig, getNetworkConfig, MINT_MAX_RETRIES, MINT_RETRY_DELAYS } from "./config.js";
import { getSupabaseAdmin } from "./supabase-admin.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CHAINS: Record<number, Chain> = {
  84532: baseSepolia,
  8453: base,
};

/**
 * Calls adminMint on the PudgyChicken contract.
 *
 * SECURITY: ADMIN_PRIVATE_KEY is the deployer wallet with DEFAULT_ADMIN_ROLE.
 * - Testnet: use the testnet deployer key (has role on Base Sepolia contract)
 * - Mainnet: use the mainnet deployer key (has role on Base mainnet contract)
 * These MUST be different keys. Set them per environment in Vercel:
 *   - Preview/Development: testnet key
 *   - Production: mainnet key
 */
export async function adminMintNFT(params: {
  recipientAddress: string;
  tokenId: number;
  quantity: number;
  orderId: string;
}): Promise<string> {
  const config = getConfig();
  const network = getNetworkConfig();
  const supabase = getSupabaseAdmin();

  const chain = CHAINS[network.chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${network.chainId}`);
  }

  const account = privateKeyToAccount(config.ADMIN_PRIVATE_KEY as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(network.rpcUrl),
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(network.rpcUrl),
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MINT_MAX_RETRIES; attempt++) {
    try {
      // Log mint attempt
      const { data: logEntry } = await supabase
        .from("mint_log")
        .insert({
          order_id: params.orderId,
          wallet_address: params.recipientAddress,
          token_id: params.tokenId,
          quantity: params.quantity,
          status: "pending",
        })
        .select("id")
        .single();

      // Submit transaction
      const hash = await walletClient.writeContract({
        address: network.contractAddress as `0x${string}`,
        abi: ADMIN_MINT_ABI,
        functionName: "adminMint",
        args: [
          params.recipientAddress as `0x${string}`,
          BigInt(params.tokenId),
          BigInt(params.quantity),
        ],
      });

      // Update log to submitted
      if (logEntry?.id) {
        await supabase
          .from("mint_log")
          .update({ status: "submitted", tx_hash: hash })
          .eq("id", logEntry.id);
      }

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        if (logEntry?.id) {
          await supabase
            .from("mint_log")
            .update({ status: "confirmed", tx_hash: hash })
            .eq("id", logEntry.id);
        }
        return hash;
      }

      throw new Error(`Transaction reverted: ${hash}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log failure
      await supabase
        .from("mint_log")
        .insert({
          order_id: params.orderId,
          wallet_address: params.recipientAddress,
          token_id: params.tokenId,
          quantity: params.quantity,
          status: "failed",
          error_message: lastError.message,
        });

      // Wait before retry (unless last attempt)
      if (attempt < MINT_MAX_RETRIES - 1) {
        await sleep(MINT_RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError || new Error("Mint failed after retries");
}
