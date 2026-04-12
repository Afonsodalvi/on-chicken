/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_USDC_ADDRESS_MAINNET?: string;
  readonly VITE_USDC_ADDRESS_POLYGON?: string;
  readonly VITE_USDC_ADDRESS_BASE?: string;
  readonly VITE_UNIQUE_COLLECTIBLES_METADATA_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
