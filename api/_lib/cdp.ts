import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { getSupabaseAdmin } from "./supabase-admin.js";
import { getConfig, getNetworkConfig } from "./config.js";

let configured = false;

function ensureCdpConfigured() {
  if (configured) return;

  const config = getConfig();

  // CDP SDK uses apiKeyName as the identifier (the UUID from portal.cdp.coinbase)
  // and privateKey for signing API requests
  Coinbase.configure({
    apiKeyName: config.CDP_API_KEY_ID,
    privateKey: config.CDP_API_KEY_PRIVATE_KEY,
  });
  configured = true;
}

/**
 * Gets or creates a CDP Server Wallet for the given email.
 * Idempotent: returns existing wallet address if one exists.
 * Uses SELECT ... FOR UPDATE pattern via atomic upsert to prevent race conditions.
 *
 * Uses testnet (base-sepolia) or mainnet (base-mainnet) based on environment.
 * ADMIN_PRIVATE_KEY must match the environment (testnet deployer vs mainnet deployer).
 */
export async function getOrCreateWallet(email: string): Promise<{
  walletId: string;
  address: string;
}> {
  const supabase = getSupabaseAdmin();
  const network = getNetworkConfig();

  // Check for existing wallet
  const { data: existing } = await supabase
    .from("pix_users")
    .select("cdp_wallet_id, cdp_wallet_address")
    .eq("email", email)
    .single();

  if (existing?.cdp_wallet_id && existing?.cdp_wallet_address) {
    return {
      walletId: existing.cdp_wallet_id,
      address: existing.cdp_wallet_address,
    };
  }

  // Create new CDP Server Wallet on the correct network
  ensureCdpConfigured();
  const wallet = await Wallet.create({ networkId: network.cdpNetworkId });
  const defaultAddress = await wallet.getDefaultAddress();
  const walletId = wallet.getId()!;
  const address = defaultAddress.getId();

  // Atomic update: only write if wallet fields are still null (prevents race condition)
  const { data: updated } = await supabase
    .from("pix_users")
    .update({
      cdp_wallet_id: walletId,
      cdp_wallet_address: address,
    })
    .eq("email", email)
    .is("cdp_wallet_id", null)
    .select("cdp_wallet_id, cdp_wallet_address")
    .single();

  // If update returned nothing, another process already wrote a wallet — read it
  if (!updated) {
    const { data: raceWinner } = await supabase
      .from("pix_users")
      .select("cdp_wallet_id, cdp_wallet_address")
      .eq("email", email)
      .single();

    if (raceWinner?.cdp_wallet_id && raceWinner?.cdp_wallet_address) {
      // Our wallet is orphaned, but user gets the first-created one (consistent)
      console.warn(`[cdp] Race condition: orphaned wallet ${walletId} for ${email}, using ${raceWinner.cdp_wallet_id}`);
      return {
        walletId: raceWinner.cdp_wallet_id,
        address: raceWinner.cdp_wallet_address,
      };
    }

    throw new Error(`Failed to assign wallet to user ${email}`);
  }

  return { walletId, address };
}
