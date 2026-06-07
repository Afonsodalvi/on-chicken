export type PanelEnv = "testnet" | "prod";

export type PanelDataSource = "live" | "remote-snapshot" | "browser-cache" | "static-snapshot";

export interface PanelKpis {
  equity_usd?: number;
  /** "exchange_portfolio" = fonte corretora (3 carteiras); "decisions_ab" = fallback */
  equity_source?: string;
  /** Equity das carteiras de TRADING (A+B) — base da decisão de produção. */
  equity_trading_usd?: number | null;
  /** Equity da carteira DCA (longo prazo) — reportada à parte. */
  equity_dca_usd?: number | null;
  realized_pnl_usd?: number;
  win_rate_pct?: number;
  open_positions?: number;
  liquidations?: number;
  /** retorno % mensal estimado (janela 30d da corretora) */
  monthly_pct_estimate?: number | null;
  value_usd?: number;
  rewards_usd?: number;
  positions?: number;
  in_range_pct?: number;
}

export interface PerfWindow {
  trades?: number;
  wins?: number;
  losses?: number;
  win_rate_pct?: number | null;
  gross_usd?: number;
  fees_usd?: number;
  net_usd?: number;
  since?: string;
  days?: number;
  monthly_pct_estimate?: number | null;
}

export interface HlPerformance {
  ts?: string;
  equity_base_usd?: number;
  windows?: Record<string, PerfWindow>;
}

export interface ReadinessComponent {
  id?: string;
  label?: string;
  status?: "go" | "no_go" | "pending" | string;
  reason?: string;
  metrics?: Record<string, unknown>;
}

export interface Readiness {
  as_of?: string;
  decision_date?: string;
  validation_window?: string;
  overall?: "go" | "conditional" | "no_go" | string;
  summary?: string;
  config_atual?: {
    desde?: string;
    net_usd?: number | null;
    monthly_pct_estimate?: number | null;
    nota?: string;
  };
  components?: ReadinessComponent[];
}

export interface PanelOverview {
  env?: PanelEnv | string;
  empty?: boolean;
  reason?: string;
  hl_kpis?: PanelKpis | null;
  defi_kpis?: PanelKpis | null;
  circuit_breaker?: CircuitBreaker;
  regime?: MarketRegime;
  hl_empty?: boolean;
  defi_empty?: boolean;
}

export interface CircuitBreaker {
  available?: boolean;
  date?: string;
  peak_usd?: number;
  threshold_pct?: number;
  halt_mode?: string;
}

export interface MarketRegime {
  macro_regime?: string;
  ts?: string;
  note?: string;
}

export interface HlWallet {
  id: string;
  label?: string;
  leverage?: number;
  role?: string;
  trades?: number;
  realized_pnl_usd?: number;
  agents?: string[];
  desc?: string;
}

export interface HlAgent {
  agent_id: string;
  trades?: number;
  wins?: number;
  realized_pnl_usd?: number;
  status?: "live" | "shadow" | "quarentena" | "neutro" | string;
}

export interface PnlBySymbolSide {
  symbol: string;
  side: "BUY" | "SELL" | string;
  pnl_usd: number;
  trades?: number;
}

export interface HlAccountBalance {
  wallet_id?: string;
  address?: string;
  perp_usd?: number;
  margin_used_usd?: number;
  spot_usdc?: number;
  total_usd?: number;
  open_positions?: number;
  /** "trading" (A/B — decide produção) ou "dca" (longo prazo, à parte). */
  kind?: "trading" | "dca" | string;
}

export interface DcaWalletStatus {
  wallet_id?: string;
  asset?: string;
  qty?: number;
  avg_basis?: number | null;
  invested_usd?: number;
  mark?: number | null;
  unrealized_usd?: number;
  unrealized_pct?: number | null;
  available_usd?: number;
  needed_usd?: number;
  cash_ok?: boolean;
  status?: "pronta" | "sem_caixa" | string;
  message?: string;
}

export interface DcaStatus {
  ts?: string;
  wallets?: DcaWalletStatus[];
}

export interface HlAccounts {
  ts?: string;
  equity_total_usd?: number;
  open_positions_exchange?: number;
  wallets?: HlAccountBalance[];
}

export interface HlSummary {
  env?: PanelEnv | string;
  empty?: boolean;
  reason?: string;
  kpis?: PanelKpis;
  /** Saldos por wallet direto da corretora (inclui a wallet DCA). */
  accounts?: HlAccounts | null;
  /** Janelas de resultado da corretora (escopo TRADING) + % mensal estimado. */
  performance?: HlPerformance | null;
  /** Status didático da carteira DCA (longo prazo, fora da decisão). */
  dca?: DcaStatus | null;
  /** Visão atribuída pelo brain (sem fees) — só para a tabela de agentes. */
  attributed?: {
    realized_pnl_usd?: number;
    win_rate_pct?: number;
    closed_trades?: number;
    open_positions_brain?: number;
  };
  wallets?: HlWallet[];
  agents?: HlAgent[];
  pnl_by_symbol_side?: PnlBySymbolSide[];
}

export interface HlPosition {
  symbol?: string;
  side?: string;
  wallet_id?: string;
  agent_id?: string;
  open_ts?: string;
  leverage?: number;
  [key: string]: unknown;
}

export interface HlPositionsResponse {
  env?: PanelEnv | string;
  positions?: HlPosition[];
}

export interface HlClosedTrade {
  symbol?: string;
  side?: string;
  agent_id?: string;
  wallet_id?: string;
  size?: number | null;
  entry_px?: number | null;
  exit_px?: number | null;
  realized_pnl_usd?: number | null;
  max_roe_pct?: number | null;
  min_roe_pct?: number | null;
  duration_min?: number | null;
  close_reason?: string;
  opened_at?: string;
  closed_at?: string;
}

export interface HlClosedResponse {
  env?: PanelEnv | string;
  count?: number;
  wins?: number;
  net_pnl_usd?: number;
  trades?: HlClosedTrade[];
}

export interface DefiWallet {
  network?: string;
  positions?: number;
  value_usd?: number;
}

export interface DefiPosition {
  pair?: string;
  network?: string;
  value_usd?: number;
  apr_pct?: number;
}

export interface DefiSuggestion {
  action?: string;
  from_pair?: string;
  to_pair?: string;
  network?: string;
  apr_gain_pct?: number;
  est_monthly_usd?: number;
  notional_usd?: number;
  payback_days?: number;
}

export interface DefiSummary {
  env?: PanelEnv | string;
  empty?: boolean;
  reason?: string;
  kpis?: PanelKpis;
  wallets?: DefiWallet[];
  positions?: DefiPosition[];
  diversification?: Record<string, number>;
  suggestions?: DefiSuggestion[];
  last_run?: string;
}

export interface LabLateral {
  lab?: string;
  closed?: number;
  open?: number;
  wins?: number;
  win_rate_pct?: number;
  net_pnl_usd?: number;
  by_agent?: Record<string, { closed?: number; wins?: number; net_pnl_usd?: number }>;
}

export interface MetaAgents {
  agents?: Record<string, { family?: string; desc?: string }>;
}

export interface MetaWallets {
  wallets?: HlWallet[];
}

export interface PanelCatalog {
  service?: string;
  version?: string;
  routes?: string[];
  public_routes?: string[];
  [key: string]: unknown;
}

export interface PanelBundle {
  schemaVersion: 1;
  env: PanelEnv;
  capturedAt: string;
  catalog?: PanelCatalog | null;
  overview?: PanelOverview | null;
  hl?: HlSummary | null;
  hlPositions?: HlPositionsResponse | null;
  hlClosed?: HlClosedResponse | null;
  defi?: DefiSummary | null;
  lab?: LabLateral | null;
  readiness?: Readiness | null;
  metaAgents?: MetaAgents | null;
  metaWallets?: MetaWallets | null;
  endpointErrors?: Record<string, string>;
}

export interface PanelResolvedBundle {
  bundle: PanelBundle;
  source: PanelDataSource;
  liveError?: string;
}

interface PanelSnapshotFile {
  schemaVersion?: number;
  generatedAt?: string;
  bundles?: Partial<Record<PanelEnv, PanelBundle>>;
  bundle?: PanelBundle;
}

const PANEL_CACHE_PREFIX = "pudgy-panel-bundle";
const CLOSED_TRADES_LIMIT = 80;

const API_BASE =
  import.meta.env.VITE_PANEL_API_BASE ||
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:8765";

const API_KEY = import.meta.env.VITE_PANEL_API_KEY || import.meta.env.VITE_API_KEY || "";

// URL publica de um panel-snapshot.json atualizado fora do deploy
// (ex.: Supabase Storage, gist raw, R2). Permite que "Atualizar" puxe dados
// novos sem rebuild do site e sem expor a PANEL_API_KEY no bundle.
const REMOTE_SNAPSHOT_URL = import.meta.env.VITE_PANEL_SNAPSHOT_URL || "";

export function hasPanelApiCredentials(): boolean {
  return Boolean(String(API_KEY).trim());
}

export function getPanelApiBase(): string {
  return API_BASE;
}

function cacheKey(env: PanelEnv) {
  return `${PANEL_CACHE_PREFIX}:${env}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || "Erro desconhecido");
}

async function panelApiGet<T>(
  path: string,
  env: PanelEnv,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const cleanBase = API_BASE.replace(/\/+$/, "");
  const url = new URL(`${cleanBase}/api/v1${path}`);
  url.searchParams.set("env", env);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const headers: HeadersInit = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const response = await fetch(url, { headers, cache: "no-store" });
  if (response.status === 401) throw new Error("API key invalida");
  if (response.status === 503) throw new Error("PANEL_API_KEY ausente no servidor");
  if (!response.ok) throw new Error(`Panel API ${response.status}`);
  return response.json() as Promise<T>;
}

async function panelCatalog(): Promise<PanelCatalog> {
  const cleanBase = API_BASE.replace(/\/+$/, "");
  const response = await fetch(`${cleanBase}/api/v1`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Panel API catalog ${response.status}`);
  return response.json() as Promise<PanelCatalog>;
}

async function endpoint<T>(key: string, request: Promise<T>) {
  try {
    return [key, { data: await request }] as const;
  } catch (error) {
    return [key, { error: errorMessage(error) }] as const;
  }
}

export async function fetchPanelBundle(env: PanelEnv): Promise<PanelBundle> {
  if (!hasPanelApiCredentials()) {
    throw new Error("Configure VITE_PANEL_API_KEY para leitura live local");
  }

  const entries = await Promise.all([
    endpoint("catalog", panelCatalog()),
    endpoint("overview", panelApiGet<PanelOverview>("/overview", env)),
    endpoint("hl", panelApiGet<HlSummary>("/hl/summary", env)),
    endpoint("hlPositions", panelApiGet<HlPositionsResponse>("/hl/positions", env)),
    endpoint("hlClosed", panelApiGet<HlClosedResponse>("/hl/closed", env, { limit: CLOSED_TRADES_LIMIT })),
    endpoint("defi", panelApiGet<DefiSummary>("/defi/summary", env)),
    endpoint("lab", panelApiGet<LabLateral>("/lab/lateral", env)),
    endpoint("readiness", panelApiGet<Readiness>("/readiness", env)),
    endpoint("metaAgents", panelApiGet<MetaAgents>("/meta/agents", env)),
    endpoint("metaWallets", panelApiGet<MetaWallets>("/meta/wallets", env)),
  ]);

  const bundle: PanelBundle = {
    schemaVersion: 1,
    env,
    capturedAt: new Date().toISOString(),
  };
  const endpointErrors: Record<string, string> = {};

  entries.forEach(([key, result]) => {
    if ("data" in result) {
      (bundle as unknown as Record<string, unknown>)[key] = result.data;
    } else {
      endpointErrors[key] = result.error;
      (bundle as unknown as Record<string, unknown>)[key] = null;
    }
  });

  if (Object.keys(endpointErrors).length) {
    bundle.endpointErrors = endpointErrors;
  }

  const hasCoreData = Boolean(bundle.overview || bundle.hl || bundle.defi);
  if (!hasCoreData) {
    throw new Error(Object.values(endpointErrors)[0] || "Panel API indisponivel");
  }

  return bundle;
}

export function savePanelBundleToLocalCache(bundle: PanelBundle): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(bundle.env), JSON.stringify(bundle));
  } catch (error) {
    console.warn("[panel-api] local cache write failed", error);
  }
}

export function loadPanelBundleFromLocalCache(env: PanelEnv): PanelBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(env));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PanelBundle;
    if (parsed?.schemaVersion !== 1 || parsed.env !== env) return null;
    return parsed;
  } catch (error) {
    console.warn("[panel-api] local cache read failed", error);
    return null;
  }
}

function pickBundle(data: PanelSnapshotFile | PanelBundle, env: PanelEnv): PanelBundle | null {
  if ("bundles" in data && data.bundles?.[env]) {
    return data.bundles[env] ?? null;
  }
  if ("bundle" in data && data.bundle?.env === env) {
    return data.bundle;
  }
  if ("env" in data && data.env === env && data.schemaVersion === 1) {
    return data as PanelBundle;
  }
  return null;
}

async function fetchSnapshotFile(url: string, env: PanelEnv): Promise<PanelBundle | null> {
  try {
    const sep = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${sep}env=${env}&t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as PanelSnapshotFile | PanelBundle;
    return pickBundle(data, env);
  } catch {
    return null;
  }
}

export async function loadPanelStaticSnapshot(env: PanelEnv): Promise<PanelBundle | null> {
  return fetchSnapshotFile("/panel-snapshot.json", env);
}

export async function loadPanelRemoteSnapshot(env: PanelEnv): Promise<PanelBundle | null> {
  if (!REMOTE_SNAPSHOT_URL) return null;
  return fetchSnapshotFile(REMOTE_SNAPSHOT_URL, env);
}

function capturedAtMs(bundle: PanelBundle): number {
  const ms = Date.parse(bundle.capturedAt ?? "");
  return Number.isFinite(ms) ? ms : 0;
}

export async function resolvePanelBundle(env: PanelEnv): Promise<PanelResolvedBundle> {
  let liveError: string | undefined;

  if (hasPanelApiCredentials()) {
    try {
      const bundle = await fetchPanelBundle(env);
      savePanelBundleToLocalCache(bundle);
      return { bundle, source: "live" };
    } catch (error) {
      liveError = errorMessage(error);
    }
  }

  // Sem live: junta todos os candidatos e usa o MAIS NOVO (capturedAt).
  // Antes o cache do navegador tinha prioridade e "Atualizar" devolvia
  // dado velho mesmo com snapshot novo no deploy/remoto.
  const [remote, deployed] = await Promise.all([
    loadPanelRemoteSnapshot(env),
    loadPanelStaticSnapshot(env),
  ]);
  const cached = loadPanelBundleFromLocalCache(env);

  const candidates: Array<{ bundle: PanelBundle; source: PanelDataSource }> = [];
  if (remote) candidates.push({ bundle: remote, source: "remote-snapshot" });
  if (deployed) candidates.push({ bundle: deployed, source: "static-snapshot" });
  if (cached) candidates.push({ bundle: cached, source: "browser-cache" });

  if (!candidates.length) {
    throw new Error(liveError || "Snapshot do painel indisponivel");
  }

  candidates.sort((a, b) => capturedAtMs(b.bundle) - capturedAtMs(a.bundle));
  const best = candidates[0];
  if (best.source !== "browser-cache") savePanelBundleToLocalCache(best.bundle);
  return { ...best, liveError };
}
