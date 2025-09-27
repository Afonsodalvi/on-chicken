import { createConfig, http } from "wagmi";
import { mainnet, polygon, base, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rabby-wallet/rabbykit";

// Environment variables para configuração das chains
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

// Chains que suportaremos - simplificado para evitar erros
const chains = [
  mainnet,
  polygon, 
  base,
  sepolia
] as const;

// Configuração das RPCs - usando RPCs públicas confiáveis
export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Pudgy Farms",
    projectId: walletConnectProjectId,
    chains,
    transports: {
      [mainnet.id]: http("https://cloudflare-eth.com"),
      [polygon.id]: http("https://polygon-rpc.com"),
      [base.id]: http("https://mainnet.base.org"),
      [sepolia.id]: http("https://rpc.sepolia.org"),
    },
  })
);

// Exported types para TypeScript
export type SupportedChain = typeof chains[number];
export { chains };
