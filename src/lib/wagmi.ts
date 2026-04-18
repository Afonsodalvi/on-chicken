import { createConfig, fallback, http } from "wagmi";
import { mainnet, polygon, base, sepolia, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rabby-wallet/rabbykit";

// Environment variables para configuração das chains
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

// RPCs privadas (Alchemy/Infura/QuickNode) — definir no Vercel.
// Por serem VITE_*, ficam embutidas no bundle do cliente; portanto, restrinja
// no painel do provedor por domínio (allowed origins) — assim mesmo que vazem,
// só funcionam a partir do domínio autorizado (ex.: pudgyfarms.io / vercel preview).
const env = import.meta.env;
// Base — aceita nomes canônicos OU os antigos (compat com .env existente)
const alchemyBaseUrl =
  env.VITE_ALCHEMY_BASE_URL || env.VITE_ALCHEMY_MAINNET_URL || "";
const alchemyBaseSepoliaUrl =
  env.VITE_ALCHEMY_BASE_SEPOLIA_URL || env.VITE_ALCHEMY_SEPOLIA_URL || "";
// Ethereum L1 (Mainnet/Sepolia) — usar prefixo ETH_ para evitar conflito com Base
const alchemyEthMainnetUrl = env.VITE_ALCHEMY_ETH_MAINNET_URL || "";
const alchemyEthSepoliaUrl = env.VITE_ALCHEMY_ETH_SEPOLIA_URL || "";
const alchemyPolygonUrl = env.VITE_ALCHEMY_POLYGON_URL || "";

// Helper: monta um transport com fallback (privado primeiro, público depois).
// `batch.multicall` coalesce reads concorrentes em 1 chamada multicall3 — corta
// drasticamente o nº de requests e reduz erros 429 nas RPCs públicas.
const transportWithFallback = (privateUrl: string, publicUrl: string) => {
  const opts = {
    batch: { multicall: { wait: 16 } as const },
    retryCount: 3,
    retryDelay: 250,
  } as const;
  return privateUrl
    ? fallback([http(privateUrl, opts), http(publicUrl, opts)], { rank: false })
    : http(publicUrl, opts);
};

// Chains que suportaremos - incluindo Base Sepolia para testnet
const chains = [
  mainnet,
  polygon,
  base,
  sepolia,
  baseSepolia, // Base Sepolia Testnet (Chain ID: 84532)
] as const;

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Pudgy Farms",
    projectId: walletConnectProjectId,
    chains,
    transports: {
      [mainnet.id]: transportWithFallback(alchemyEthMainnetUrl, "https://cloudflare-eth.com"),
      [polygon.id]: transportWithFallback(alchemyPolygonUrl, "https://polygon-rpc.com"),
      [base.id]: transportWithFallback(alchemyBaseUrl, "https://mainnet.base.org"),
      [sepolia.id]: transportWithFallback(alchemyEthSepoliaUrl, "https://rpc.sepolia.org"),
      [baseSepolia.id]: transportWithFallback(alchemyBaseSepoliaUrl, "https://sepolia.base.org"),
    },
  })
);

// Exported types para TypeScript
export type SupportedChain = typeof chains[number];
export { chains };
