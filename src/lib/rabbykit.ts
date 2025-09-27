import { createModal } from "@rabby-wallet/rabbykit";
import { wagmiConfig } from "./wagmi";

// Singleton RabbyKit modal instance for wallet connections
export const rabbykit = createModal({
  wagmi: wagmiConfig,
});
