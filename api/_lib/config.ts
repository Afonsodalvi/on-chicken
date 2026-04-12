// Server-side environment validation
// SECURITY: These variables must NEVER have the VITE_ prefix (would expose to frontend bundle)
// Store them ONLY in:
//   - Vercel Dashboard > Settings > Environment Variables (for deploy)
//   - .env.local (for local dev, git-ignored)
//
// NAMING CONVENTION:
// For secrets that differ between environments (admin private key, Stripe keys),
// you can use the _DEV / _PROD suffix to keep both in the same .env file, or
// rely on Vercel's per-environment variable scoping (Preview/Development vs Production).
// Resolution order for each secret:
//   1. `<NAME>_PROD` (if isProduction()) or `<NAME>_DEV` (otherwise)
//   2. Fallback to plain `<NAME>`

// Environment detection: use VERCEL_ENV or NODE_ENV
export function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

/**
 * Resolve a secret that may have environment-specific variants.
 * Prefers `<name>_PROD` in production and `<name>_DEV` otherwise; falls back to plain `<name>`.
 */
function pickEnv(name: string): string | undefined {
  const suffix = isProduction() ? "_PROD" : "_DEV";
  return process.env[`${name}${suffix}`] || process.env[name];
}

export function getConfig() {
  const required = {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Stripe: different accounts/keys for test vs live
    STRIPE_SECRET_KEY: pickEnv("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: pickEnv("STRIPE_WEBHOOK_SECRET"),
    // CDP: same credentials work across environments (network is selected at runtime)
    CDP_API_KEY_ID: process.env.CDP_API_KEY_ID,
    CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME,
    CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY,
    // Admin wallet private key: MUST be different per network (testnet vs mainnet)
    ADMIN_PRIVATE_KEY: pickEnv("ADMIN_PRIVATE_KEY"),
  } as const;

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return required as Record<keyof typeof required, string>;
}

// Contract addresses per environment (PudgyChicken Diamond collection)
const CONTRACT_ADDRESSES = {
  testnet: "0x27Bb62C5B5Ea7EE6A365084d73D05565AbA49503" as const, // Base Sepolia – First Collection
  mainnet: "0xd9114E1D7fEec3C9332673B6D048Cc40741D79dC" as const, // Base mainnet – First Collection
};

const RPC_URLS = {
  testnet: "https://sepolia.base.org",
  mainnet: "https://mainnet.base.org",
};

const CDP_NETWORK_IDS = {
  testnet: "base-sepolia",
  mainnet: "base-mainnet",
};

export function getNetworkConfig() {
  const env = isProduction() ? "mainnet" : "testnet";
  return {
    contractAddress: CONTRACT_ADDRESSES[env],
    rpcUrl: RPC_URLS[env],
    cdpNetworkId: CDP_NETWORK_IDS[env],
    chainId: env === "mainnet" ? 8453 : 84532,
  };
}

// PIX configuration
export const PIX_EXPIRATION_MINUTES = 30;
export const MAX_ORDERS_PER_EMAIL_PER_HOUR = 5;
export const MINT_MAX_RETRIES = 3;
export const MINT_RETRY_DELAYS = [1000, 5000, 15000]; // ms
