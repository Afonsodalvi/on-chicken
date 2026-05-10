import { createConfig, fallback, http } from "wagmi";
import { mainnet, polygon, base, sepolia, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "@wagmi/connectors";

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

if (!walletConnectProjectId) {
  console.warn(
    "[wagmi] VITE_WALLETCONNECT_PROJECT_ID is empty — WalletConnect (mobile + browsers without injected wallet) will fail with 403/permission errors. Set it in Vercel env vars."
  );
}

const env = import.meta.env;
const alchemyBaseUrl =
  env.VITE_ALCHEMY_BASE_URL || env.VITE_ALCHEMY_MAINNET_URL || "";
const alchemyBaseSepoliaUrl =
  env.VITE_ALCHEMY_BASE_SEPOLIA_URL || env.VITE_ALCHEMY_SEPOLIA_URL || "";
const alchemyEthMainnetUrl = env.VITE_ALCHEMY_ETH_MAINNET_URL || "";
const alchemyEthSepoliaUrl = env.VITE_ALCHEMY_ETH_SEPOLIA_URL || "";
const alchemyPolygonUrl = env.VITE_ALCHEMY_POLYGON_URL || "";

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

const chains = [
  mainnet,
  polygon,
  base,
  sepolia,
  baseSepolia,
] as const;

const APP_URL =
  typeof window !== "undefined" ? window.location.origin : "https://pudgyfarms.xyz";

const connectors = [
  injected({ shimDisconnect: true }),
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: "Pudgy Farms",
            description: "Pudgy Farms — RWAnimal Tokenization Protocol",
            url: APP_URL,
            icons: [`${APP_URL}/favicon.ico`],
          },
        }),
      ]
    : []),
  coinbaseWallet({
    appName: "Pudgy Farms",
    appLogoUrl: `${APP_URL}/favicon.ico`,
    preference: "all",
  }),
];

export const wagmiConfig = createConfig({
  chains,
  connectors,
  multiInjectedProviderDiscovery: true,
  transports: {
    [mainnet.id]: transportWithFallback(alchemyEthMainnetUrl, "https://cloudflare-eth.com"),
    [polygon.id]: transportWithFallback(alchemyPolygonUrl, "https://polygon-rpc.com"),
    [base.id]: transportWithFallback(alchemyBaseUrl, "https://mainnet.base.org"),
    [sepolia.id]: transportWithFallback(alchemyEthSepoliaUrl, "https://rpc.sepolia.org"),
    [baseSepolia.id]: transportWithFallback(alchemyBaseSepoliaUrl, "https://sepolia.base.org"),
  },
});

export type SupportedChain = typeof chains[number];
export { chains };
