import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Eye,
  Layers,
  LineChart,
  Loader2,
  Lock,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  Table2,
  Wallet,
  Zap,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConnectWallet } from "@/components/ConnectWallet";
import { NetworkBadge } from "@/components/NetworkBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCollectionHolder } from "@/hooks/useCollectionHolder";
import {
  hasPanelApiCredentials,
  resolvePanelBundle,
  type DefiSummary,
  type HlAgent,
  type HlClosedTrade,
  type HlSummary,
  type LabLateral,
  type MetaAgents,
  type MetaWallets,
  type DcaStatus,
  type DirectionalBias,
  type LivePosition,
  type NewsPanelSummary,
  type NewsSection,
  type NewsSuggestion,
  type NewsTopItem,
  type PanelBundle,
  type PanelDataSource,
  type PanelEnv,
  type PanelResolvedBundle,
  type PnlBySymbolSide,
} from "@/lib/panel-api";

const chartColors = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#38bdf8",
  "#e879f9",
  "#a3e635",
];

const statusOrder: Record<string, number> = {
  live: 0,
  shadow: 1,
  neutro: 2,
  quarentena: 3,
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return currency.format(value);
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return numberFormat.format(value);
}

function formatPct(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${numberFormat.format(value)}%`;
}

function formatDateTime(value: string | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function agentLabel(agentId: string | undefined) {
  if (!agentId) return "-";
  return agentId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pnlClass(value: number | null | undefined) {
  if (typeof value !== "number") return "text-muted-foreground";
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-muted-foreground";
}

function sourceLabel(source: PanelDataSource | undefined) {
  if (source === "live") return "Live localhost";
  if (source === "remote-snapshot") return "Snapshot remoto";
  if (source === "browser-cache") return "Cache local";
  if (source === "static-snapshot") return "Snapshot deploy";
  return "Carregando";
}

function statusClass(status: string | undefined) {
  if (status === "live") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (status === "shadow") return "border-sky-500/40 bg-sky-500/10 text-sky-300";
  if (status === "quarentena") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-border bg-muted/40 text-muted-foreground";
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: typeof Activity;
}) {
  return (
    <div className="surface rounded-lg p-4 min-h-[118px] flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Activity;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="surface rounded-lg border-dashed p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function AccessPanel() {
  const holder = useCollectionHolder();
  const { switchChain } = useSwitchChain();

  if (!holder.isConnected) {
    return (
      <div className="mx-auto max-w-xl surface rounded-lg p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-5 text-3xl font-semibold">Holders</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Conecte a carteira que possui um Pudgy Chicken para abrir o painel.
        </p>
        <div className="mt-6 flex justify-center">
          <ConnectWallet />
        </div>
      </div>
    );
  }

  if (holder.isWrongNetwork) {
    return (
      <div className="mx-auto max-w-2xl surface rounded-lg p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-5 text-3xl font-semibold">Rede incorreta</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Use Base Sepolia ou Base para validar seus NFTs da colecao.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => switchChain({ chainId: baseSepolia.id })}>
            <Zap className="mr-2 h-4 w-4" />
            Base Sepolia
          </Button>
          <Button variant="outline" onClick={() => switchChain({ chainId: base.id })}>
            <Wallet className="mr-2 h-4 w-4" />
            Base
          </Button>
          <NetworkBadge allowMainnet />
        </div>
      </div>
    );
  }

  if (holder.isLoading) {
    return (
      <div className="mx-auto max-w-xl surface rounded-lg p-8 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        <h1 className="mt-5 text-3xl font-semibold">Verificando holder</h1>
        <p className="mt-3 text-sm text-muted-foreground">Lendo balances da colecao on-chain.</p>
      </div>
    );
  }

  if (holder.error) {
    return (
      <div className="mx-auto max-w-xl surface rounded-lg p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-5 text-3xl font-semibold">Nao foi possivel validar</h1>
        <p className="mt-3 text-sm text-muted-foreground">{holder.error}</p>
        <Button className="mt-6" variant="outline" onClick={() => holder.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!holder.isHolder) {
    return (
      <div className="mx-auto max-w-xl surface rounded-lg p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-5 text-3xl font-semibold">Acesso para holders</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta carteira ainda nao possui NFTs Pudgy Chickens reconhecidos.
        </p>
        <Button asChild className="mt-6">
          <Link to="/mint">Ir para Mint</Link>
        </Button>
      </div>
    );
  }

  return null;
}

function AgentCards({
  hl,
  metaAgents,
}: {
  hl?: HlSummary | null;
  metaAgents?: MetaAgents | null;
}) {
  const agents = useMemo(() => {
    return [...(hl?.agents ?? [])].sort((a, b) => {
      const statusDelta = (statusOrder[a.status ?? ""] ?? 9) - (statusOrder[b.status ?? ""] ?? 9);
      if (statusDelta !== 0) return statusDelta;
      return (b.realized_pnl_usd ?? 0) - (a.realized_pnl_usd ?? 0);
    });
  }, [hl?.agents]);

  if (!agents.length) return <EmptyBlock label="Nenhum agente retornado pela API." />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {agents.map((agent) => {
        const meta = metaAgents?.agents?.[agent.agent_id];
        const winRate = agent.trades ? ((agent.wins ?? 0) / agent.trades) * 100 : 0;
        return (
          <article key={agent.agent_id} className="surface rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{agentLabel(agent.agent_id)}</h3>
                <p className="mt-1 text-xs uppercase text-muted-foreground">{meta?.family ?? "agent"}</p>
              </div>
              <Badge variant="outline" className={statusClass(agent.status)}>
                {agent.status ?? "neutro"}
              </Badge>
            </div>
            <p className="mt-4 min-h-[54px] text-sm leading-relaxed text-muted-foreground">
              {meta?.desc ?? "Sem descricao no catalogo meta."}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Trades</div>
                <div className="font-semibold tabular-nums">{formatNumber(agent.trades)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Win rate</div>
                <div className="font-semibold tabular-nums">{formatPct(winRate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">PnL</div>
                <div className={`font-semibold tabular-nums ${pnlClass(agent.realized_pnl_usd)}`}>
                  {formatCurrency(agent.realized_pnl_usd)}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function WalletTopology({
  hl,
  metaWallets,
}: {
  hl?: HlSummary | null;
  metaWallets?: MetaWallets | null;
}) {
  const walletMeta = new Map((metaWallets?.wallets ?? []).map((wallet) => [wallet.id, wallet]));
  const wallets = (hl?.wallets?.length ? hl.wallets : metaWallets?.wallets) ?? [];

  if (!wallets.length) return <EmptyBlock label="Nenhuma carteira retornada pela API." />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {wallets.map((wallet) => {
        const meta = walletMeta.get(wallet.id) ?? wallet;
        return (
          <article key={wallet.id} className="surface rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{wallet.label ?? meta.label ?? wallet.id}</h3>
                <p className="mt-1 text-xs uppercase text-muted-foreground">{wallet.role ?? meta.role}</p>
              </div>
              <Badge variant="outline">{wallet.leverage ?? meta.leverage ?? 1}x</Badge>
            </div>
            <p className="mt-4 min-h-[40px] text-sm text-muted-foreground">{meta.desc ?? "-"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(meta.agents ?? []).map((agent) => (
                <Badge key={agent} variant="secondary" className="bg-secondary/80">
                  {agentLabel(agent)}
                </Badge>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Trades</div>
                <div className="font-semibold tabular-nums">{formatNumber(wallet.trades)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">PnL realizado</div>
                <div className={`font-semibold tabular-nums ${pnlClass(wallet.realized_pnl_usd)}`}>
                  {formatCurrency(wallet.realized_pnl_usd)}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PnlChart({ rows }: { rows: PnlBySymbolSide[] }) {
  const data = rows.slice(0, 14).map((row) => ({
    label: `${row.symbol} ${row.side}`,
    pnl: row.pnl_usd,
    trades: row.trades ?? 0,
  }));

  if (!data.length) return <EmptyBlock label="Sem PnL por ativo para exibir." />;

  return (
    <div className="surface rounded-lg p-4">
      <ChartContainer
        config={{ pnl: { label: "PnL", color: "hsl(var(--primary))" } }}
        className="h-[300px] w-full aspect-auto"
      >
        <BarChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((row, index) => (
              <Cell
                key={`${row.label}-${index}`}
                fill={row.pnl >= 0 ? "hsl(var(--accent))" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function DiversificationChart({ defi }: { defi?: DefiSummary | null }) {
  const data = Object.entries(defi?.diversification ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([asset, value]) => ({ asset, value }));

  if (!data.length) return <EmptyBlock label="Sem diversificacao DeFi retornada." />;

  return (
    <div className="surface rounded-lg p-4">
      <ChartContainer
        config={{ value: { label: "Peso", color: "hsl(var(--accent))" } }}
        className="h-[280px] w-full aspect-auto"
      >
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="asset" />} />
          <Pie data={data} dataKey="value" nameKey="asset" innerRadius={64} outerRadius={104} paddingAngle={2}>
            {data.map((row, index) => (
              <Cell key={row.asset} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((row, index) => (
          <span key={row.asset} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartColors[index % chartColors.length] }}
            />
            {row.asset} {formatPct(row.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function PositionsTable({ rows }: { rows: NonNullable<PanelBundle["hlPositions"]>["positions"] }) {
  const positions = rows ?? [];
  if (!positions.length) return <EmptyBlock label="Nenhuma posicao aberta agora." />;

  return (
    <div className="surface rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ativo</TableHead>
            <TableHead>Lado</TableHead>
            <TableHead>Carteira</TableHead>
            <TableHead>Agente</TableHead>
            <TableHead>Alav.</TableHead>
            <TableHead>Abertura</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position, index) => (
            <TableRow key={`${position.symbol}-${position.open_ts}-${index}`}>
              <TableCell className="font-medium">{position.symbol ?? "-"}</TableCell>
              <TableCell>{position.side ?? "-"}</TableCell>
              <TableCell>{position.wallet_id ?? "-"}</TableCell>
              <TableCell>{agentLabel(position.agent_id)}</TableCell>
              <TableCell>{formatNumber(position.leverage)}</TableCell>
              <TableCell>{formatDateTime(position.open_ts)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TradesTable({ rows }: { rows: HlClosedTrade[] }) {
  if (!rows.length) return <EmptyBlock label="Nenhuma operacao fechada no snapshot atual." />;

  return (
    <div className="surface rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fechamento</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead>Lado</TableHead>
            <TableHead>Agente</TableHead>
            <TableHead>Carteira</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Saida</TableHead>
            <TableHead className="text-right">PnL</TableHead>
            <TableHead className="text-right">ROE max/min</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((trade, index) => (
            <TableRow key={`${trade.closed_at}-${trade.symbol}-${index}`}>
              <TableCell className="whitespace-nowrap">{formatDateTime(trade.closed_at)}</TableCell>
              <TableCell className="font-medium">{trade.symbol ?? "-"}</TableCell>
              <TableCell>{trade.side ?? "-"}</TableCell>
              <TableCell>{agentLabel(trade.agent_id)}</TableCell>
              <TableCell>{trade.wallet_id ?? "-"}</TableCell>
              <TableCell>{formatNumber(trade.entry_px ?? undefined)}</TableCell>
              <TableCell>{formatNumber(trade.exit_px ?? undefined)}</TableCell>
              <TableCell className={`text-right font-semibold tabular-nums ${pnlClass(trade.realized_pnl_usd ?? undefined)}`}>
                {formatCurrency(trade.realized_pnl_usd ?? undefined)}
              </TableCell>
              <TableCell className="text-right">
                {formatPct(trade.max_roe_pct ?? undefined)} / {formatPct(trade.min_roe_pct ?? undefined)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DefiPositionsTable({ defi }: { defi?: DefiSummary | null }) {
  const positions = defi?.positions ?? [];
  if (!positions.length) return <EmptyBlock label="Sem posicoes DeFi retornadas." />;

  return (
    <div className="surface rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Par</TableHead>
            <TableHead>Rede</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">APR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position, index) => (
            <TableRow key={`${position.pair}-${position.network}-${index}`}>
              <TableCell className="font-medium">{position.pair ?? "-"}</TableCell>
              <TableCell>{position.network ?? "-"}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(position.value_usd)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPct(position.apr_pct)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SuggestionsTable({ defi }: { defi?: DefiSummary | null }) {
  const suggestions = defi?.suggestions ?? [];
  if (!suggestions.length) return <EmptyBlock label="Nenhuma sugestao DeFi retornada." />;

  return (
    <div className="surface rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acao</TableHead>
            <TableHead>De</TableHead>
            <TableHead>Para</TableHead>
            <TableHead>Rede</TableHead>
            <TableHead className="text-right">Ganho APR</TableHead>
            <TableHead className="text-right">Mes estimado</TableHead>
            <TableHead className="text-right">Notional</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suggestions.map((suggestion, index) => (
            <TableRow key={`${suggestion.from_pair}-${suggestion.to_pair}-${index}`}>
              <TableCell className="font-medium">{suggestion.action ?? "-"}</TableCell>
              <TableCell>{suggestion.from_pair ?? "-"}</TableCell>
              <TableCell>{suggestion.to_pair || "-"}</TableCell>
              <TableCell>{suggestion.network ?? "-"}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPct(suggestion.apr_gain_pct)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(suggestion.est_monthly_usd)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(suggestion.notional_usd)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OverviewTab({ bundle }: { bundle: PanelBundle }) {
  const overview = bundle.overview;
  const breaker = overview?.circuit_breaker;
  const regime = overview?.regime;
  const hlKpis = overview?.hl_kpis ?? bundle.hl?.kpis;
  const defiKpis = overview?.defi_kpis ?? bundle.defi?.kpis;
  const win = bundle.hl?.performance?.windows ?? {};
  const cur = win["since_current"];
  const cor = win["since_corrected"];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricTile
          label="Equity Trading (A+B)"
          value={formatCurrency(hlKpis?.equity_trading_usd)}
          detail="decide a producao"
          icon={LineChart}
        />
        <MetricTile
          label="DCA BTC (longo prazo)"
          value={formatCurrency(hlKpis?.equity_dca_usd)}
          detail="fora dos percentuais"
          icon={Database}
        />
        <MetricTile
          label="PnL liquido 30d (trading)"
          value={formatCurrency(hlKpis?.realized_pnl_usd)}
          detail={`Win rate ${formatPct(hlKpis?.win_rate_pct)}`}
          icon={Activity}
        />
        <MetricTile label="Valor DeFi" value={formatCurrency(defiKpis?.value_usd)} detail={`${formatNumber(defiKpis?.positions)} posicoes`} icon={Layers} />
        <MetricTile label="Rewards DeFi" value={formatCurrency(defiKpis?.rewards_usd)} detail={`${formatPct(defiKpis?.in_range_pct)} in range`} icon={Zap} />
      </div>

      <article className="surface rounded-lg p-5">
        <SectionTitle icon={Activity} title="Entendendo os numeros (leitura honesta)" />
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            O sistema passou por <b className="text-foreground">3 fases</b>: uma fase de
            calibracao (14–23/05, comportamento corrigido pelas auditorias), uma fase
            pos-correcoes (23–30/05) e a <b className="text-foreground">configuracao
            ATUAL</b> (30/05 em diante — apenas os agentes comprovados operam). O numero
            "30 dias" mistura as tres fases; o que representa o sistema de hoje e a
            janela da configuracao atual.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {cur && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="text-xs uppercase text-muted-foreground">Config atual (30/05→)</div>
                <div className={`text-lg font-semibold ${pnlClass(cur.net_usd)}`}>{formatCurrency(cur.net_usd)}</div>
                <div className="text-xs">
                  {cur.trades ?? 0} trades · win {formatPct(cur.win_rate_pct)} · ≈ {formatSignedPct(cur.monthly_pct_estimate)}/mes
                </div>
              </div>
            )}
            {cor && (
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="text-xs uppercase text-muted-foreground">Pos-correcoes (23/05→)</div>
                <div className={`text-lg font-semibold ${pnlClass(cor.net_usd)}`}>{formatCurrency(cor.net_usd)}</div>
                <div className="text-xs">
                  {cor.trades ?? 0} trades · win {formatPct(cor.win_rate_pct)} · ≈ {formatSignedPct(cor.monthly_pct_estimate)}/mes
                </div>
              </div>
            )}
          </div>
          <p>
            Contexto importante: a semana da configuracao atual coincidiu com uma{" "}
            <b className="text-foreground">queda brusca do mercado</b> (BTC -15%, ETH
            -23%). Os agentes atuais venceram quase todas as operacoes proprias no
            periodo; a perda visivel veio de uma posicao legada da fase anterior. Nenhum
            numero aqui inclui o DCA — ele e acumulacao de longo prazo e aparece
            separado.
          </p>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface rounded-lg p-5">
          <SectionTitle icon={ShieldCheck} title="Circuit breaker" />
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-1 font-semibold">{breaker?.available ? "Disponivel" : "Indisponivel"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Data</div>
              <div className="mt-1 font-semibold">{breaker?.date ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Pico</div>
              <div className="mt-1 font-semibold">{formatCurrency(breaker?.peak_usd)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Threshold</div>
              <div className="mt-1 font-semibold">{formatPct(breaker?.threshold_pct)}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{breaker?.halt_mode ?? "-"}</p>
        </div>

        <div className="surface rounded-lg p-5">
          <SectionTitle icon={BarChart3} title="Regime" />
          <div className="mt-5 flex items-center gap-3">
            <Badge className="bg-primary/15 text-primary border-primary/30" variant="outline">
              {regime?.macro_regime ?? "-"}
            </Badge>
            <span className="text-sm text-muted-foreground">{formatDateTime(regime?.ts)}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{regime?.note ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}

function NewsSentinelAgentCard({ bundle }: { bundle: PanelBundle }) {
  const sentinel = bundle.news?.sentinel;
  const meta = bundle.metaAgents?.agents?.["news_sentinel"];
  // Mostra o card mesmo sem dados (sentinel pode vir null se o endpoint /news
  // ainda nao estiver no snapshot) — explica o papel do agente.
  return (
    <article className="surface rounded-lg border-sky-500/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Newspaper className="h-4 w-4 text-sky-300" />
            News Sentinel
          </h3>
          <p className="mt-1 text-xs uppercase text-muted-foreground">
            {meta?.family ?? "news_sentiment"}
          </p>
        </div>
        <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300">
          advisory
        </Badge>
      </div>
      <p className="mt-4 min-h-[54px] text-sm leading-relaxed text-muted-foreground">
        {meta?.desc ??
          "Monitora noticias (cripto, Brasil, global, macro), mede sentimento e " +
            "sugere acoes. Atua em CONJUNTO: vota no consenso com os agentes tecnicos " +
            "e bloqueia entradas em evento critico. Nunca executa ordens proprias."}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Noticias 24h</div>
          <div className="font-semibold tabular-nums">{formatNumber(sentinel?.news_24h)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Sugestoes ativas</div>
          <div className="font-semibold tabular-nums">{formatNumber(sentinel?.suggestions_active)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Decisoes conjuntas (7d)</div>
          <div className="font-semibold tabular-nums">{formatNumber(sentinel?.joint_decisions_7d)}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {typeof sentinel?.critical_24h === "number" && sentinel.critical_24h > 0 && (
          <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-300">
            {sentinel.critical_24h} evento(s) critico(s) 24h
          </Badge>
        )}
        <span>
          Resultado de um agente consultivo nao e PnL proprio — veja a aba{" "}
          <b className="text-foreground">Noticias</b> para sugestoes, mercados e impacto.
        </span>
      </div>
    </article>
  );
}

function AgentsTab({ bundle }: { bundle: PanelBundle }) {
  return (
    <div className="space-y-8">
      <AgentCards hl={bundle.hl} metaAgents={bundle.metaAgents} />
      <div className="space-y-4">
        <SectionTitle
          icon={Newspaper}
          title="Agente de inteligencia (advisory)"
          description="Trabalha junto dos agentes trader: adiciona contexto de noticias e veta entradas de risco, sem operar sozinho."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <NewsSentinelAgentCard bundle={bundle} />
        </div>
      </div>
      <div className="space-y-4">
        <SectionTitle icon={Wallet} title="Carteiras de trading" />
        <WalletTopology hl={bundle.hl} metaWallets={bundle.metaWallets} />
      </div>
    </div>
  );
}

function HyperLiquidTab({ bundle }: { bundle: PanelBundle }) {
  const hl = bundle.hl;
  const kpis = hl?.kpis;
  const accounts = hl?.accounts;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricTile
          label="Equity TRADING (A+B)"
          value={formatCurrency(kpis?.equity_trading_usd)}
          icon={LineChart}
        />
        <MetricTile
          label="DCA BTC (longo prazo)"
          value={formatCurrency(kpis?.equity_dca_usd)}
          icon={Database}
        />
        <MetricTile label="PnL liquido 30d (trading)" value={formatCurrency(kpis?.realized_pnl_usd)} icon={Activity} />
        <MetricTile label="Win rate (trading)" value={formatPct(kpis?.win_rate_pct)} icon={CheckCircle2} />
        <MetricTile
          label="% mes estimado (trading)"
          value={formatSignedPct(kpis?.monthly_pct_estimate)}
          icon={BarChart3}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Percentuais e PnL acima sao SOMENTE das carteiras de trading (A+B). O DCA e
        acumulacao de longo prazo e e mostrado separado abaixo — o resultado dele nao
        contamina o desempenho dos agentes.
      </p>

      <DcaCard dca={hl?.dca} />

      {hl?.performance?.windows && Object.keys(hl.performance.windows).length > 0 && (
        <div className="space-y-4">
          <SectionTitle icon={Activity} title="Resultado por janela (fonte: corretora, com taxas)" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(hl.performance.windows)
              .sort(([a], [b]) => windowRank(a) - windowRank(b))
              .map(([name, w]) => (
                <article key={name} className="surface rounded-lg p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {name === "since_current" ? "config atual (30/05→)" : name === "since_corrected" ? "pos-correcoes (23/05→)" : name}
                  </div>
                  <div className={`mt-2 text-xl font-semibold ${pnlClass(w.net_usd)}`}>
                    {formatCurrency(w.net_usd)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {w.trades ?? 0} trades · win {formatPct(w.win_rate_pct)} · taxas {formatCurrency(w.fees_usd)}
                  </div>
                  <div className="mt-1 text-xs">≈ {formatSignedPct(w.monthly_pct_estimate)}/mes</div>
                </article>
              ))}
          </div>
        </div>
      )}

      {accounts && (
        <div className="space-y-4">
          <SectionTitle icon={Database} title="Carteiras na corretora" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MetricTile
              label="Equity total (trading + DCA)"
              value={formatCurrency(accounts.equity_total_usd)}
              icon={LineChart}
            />
            <MetricTile
              label="Posicoes abertas (corretora)"
              value={formatNumber(accounts.open_positions_exchange)}
              icon={Table2}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(accounts.wallets ?? []).map((w, i) => (
              <article
                key={w.wallet_id ?? `w-${i}`}
                className={`surface rounded-lg p-4 ${w.kind === "dca" ? "border-indigo-500/30" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold capitalize">{w.wallet_id}</div>
                  {w.kind === "dca" && (
                    <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30">DCA · longo prazo</Badge>
                  )}
                  {w.kind === "trading" && (
                    <Badge className="bg-primary/10 text-primary border-primary/30">trading</Badge>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Perp (margem)</div>
                    <div className="font-medium">{formatCurrency(w.perp_usd)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Spot USDC</div>
                    <div className="font-medium">{formatCurrency(w.spot_usdc)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="font-medium">{formatCurrency(w.total_usd)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Posicoes</div>
                    <div className="font-medium">{formatNumber(w.open_positions)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Saldos lidos direto da corretora pelo Master Observer. As carteiras de TRADING
            (A direcional, B contraria) decidem a producao; a DCA acumula BTC no longo prazo
            e e avaliada separadamente.
          </p>
        </div>
      )}

      <DirectionalBiasSection bias={hl?.directional_bias} live={hl?.live_positions} />

      <div className="space-y-4">
        <SectionTitle icon={BarChart3} title="PnL por ativo e lado" />
        <PnlChart rows={hl?.pnl_by_symbol_side ?? []} />
      </div>

      <div className="space-y-4">
        <SectionTitle icon={Activity} title="Posicoes abertas" />
        <PositionsTable rows={bundle.hlPositions?.positions} />
      </div>
    </div>
  );
}

function DirectionalBiasSection({
  bias,
  live,
}: {
  bias?: DirectionalBias | null;
  live?: LivePosition[] | null;
}) {
  if (!bias) return null;
  const buy = bias.buy_trades ?? 0;
  const sell = bias.sell_trades ?? 0;
  const total = buy + sell;
  const shortPct = total ? Math.round((sell / total) * 100) : 0;
  const longPct = 100 - shortPct;
  const agents = (bias.by_agent ?? []).filter((a) => (a.buy ?? 0) + (a.sell ?? 0) > 0);

  return (
    <div className="space-y-4">
      <SectionTitle icon={Activity} title="Vies Long / Short — os agentes operam os dois lados?" />
      <article className="surface rounded-lg p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-emerald-400">LONG (compra) · {longPct}%</span>
          <span className="font-medium text-red-400">{shortPct}% · SHORT (venda)</span>
        </div>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-muted/40">
          <div className="bg-emerald-500/70" style={{ width: `${longPct}%` }} />
          <div className="bg-red-500/70" style={{ width: `${shortPct}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {buy} operacoes long · {sell} operacoes short (historico fechado)
        </div>
        <p className="mt-3 rounded-md border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
          Predominancia de SHORT reflete o <b className="text-foreground">mercado de queda</b> do
          periodo — nao e uma trava de codigo. Os motores sao bidirecionais: abrem LONG quando
          aparece o setup de alta (cruzamento de medias para cima / fundo de range) e SHORT na
          queda. Quando o mercado virar, os longs aparecem aqui.
        </p>

        {agents.length > 0 && (
          <div className="mt-4 space-y-2">
            {agents.map((a) => {
              const t = (a.buy ?? 0) + (a.sell ?? 0);
              const sp = t ? Math.round(((a.sell ?? 0) / t) * 100) : 0;
              return (
                <div key={a.agent_id} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 font-medium">{agentLabel(a.agent_id)}</span>
                  <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                    <div className="bg-emerald-500/70" style={{ width: `${100 - sp}%` }} />
                    <div className="bg-red-500/70" style={{ width: `${sp}%` }} />
                  </div>
                  <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
                    {a.buy ?? 0}L / {a.sell ?? 0}S
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {live && live.length > 0 && (
        <div className="surface rounded-lg overflow-hidden">
          <div className="border-b border-border/60 px-4 py-3 text-sm font-medium">
            Posicoes abertas agora (ao vivo, com P&amp;L no papel)
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Direcao</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead className="text-right">P&amp;L (papel)</TableHead>
                <TableHead className="text-right">ROE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {live.map((p, i) => (
                <TableRow key={`${p.symbol}-${p.wallet_id}-${i}`}>
                  <TableCell className="font-medium">{p.symbol}</TableCell>
                  <TableCell>
                    <span className={p.side === "LONG" ? "text-emerald-400" : "text-red-400"}>
                      {p.side} {p.leverage ? `${p.leverage}x` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.agent_id ? agentLabel(p.agent_id) : p.wallet_id ?? "—"}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${pnlClass(p.unrealized_usd)}`}>
                    {formatCurrency(p.unrealized_usd)}
                  </TableCell>
                  <TableCell className={`text-right ${pnlClass(p.roe_pct)}`}>
                    {formatSignedPct(p.roe_pct)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="px-4 py-3 text-xs text-muted-foreground">
            P&amp;L "no papel" oscila ate a posicao fechar. Cada uma tem stop-loss e o robo de
            saida fecha sozinho no lucro (ROE ≥ 2,8%) — nao precisa intervir.
          </p>
        </div>
      )}
    </div>
  );
}

function formatSignedPct(v?: number | null) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return `${v > 0 ? "+" : ""}${numberFormat.format(v)}%`;
}

const WINDOW_ORDER = ["since_current", "since_corrected", "7d", "30d"];

function windowRank(key: string) {
  const i = WINDOW_ORDER.indexOf(key);
  return i === -1 ? WINDOW_ORDER.length : i; // desconhecidos vao pro fim
}

function statusBadge(status?: string) {
  if (status === "go") return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">GO</Badge>;
  if (status === "no_go") return <Badge className="bg-red-500/15 text-red-400 border-red-500/30">NO-GO</Badge>;
  if (status === "out_of_scope")
    return <Badge className="bg-slate-500/15 text-slate-300 border-slate-500/30">FORA DA DECISAO</Badge>;
  return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">PENDENTE</Badge>;
}

function DcaCard({ dca }: { dca?: DcaStatus | null }) {
  const w = dca?.wallets?.[0];
  if (!w) return null;
  const negative = typeof w.unrealized_usd === "number" && w.unrealized_usd < 0;
  return (
    <article className="surface rounded-lg border-indigo-500/30 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">DCA BTC — longo prazo</h3>
        <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30">FORA DA DECISAO DE PRODUCAO</Badge>
        {w.cash_ok ? (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">CAIXA OK</Badge>
        ) : (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">SEM CAIXA</Badge>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Compra {w.asset ?? "BTC"} automaticamente nas quedas para construir um preco medio bom e
        realiza lucro em momentos ideais. O resultado dela e de LONGO PRAZO (no papel) e nao entra
        nos percentuais de trading nem na decisao de producao.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Posicao</div>
          <div className="font-medium">{w.qty ?? 0} {w.asset ?? "BTC"}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Preco medio</div>
          <div className="font-medium">{formatCurrency(w.avg_basis)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Investido</div>
          <div className="font-medium">{formatCurrency(w.invested_usd)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">No papel</div>
          <div className={`font-medium ${negative ? "text-red-400" : "text-emerald-400"}`}>
            {formatCurrency(w.unrealized_usd)}
            {typeof w.unrealized_pct === "number" ? ` (${formatSignedPct(w.unrealized_pct)})` : ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Caixa disponivel</div>
          <div className="font-medium">{formatCurrency(w.available_usd)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Precisa p/ proxima compra</div>
          <div className="font-medium">{formatCurrency(w.needed_usd)}</div>
        </div>
      </div>
      {w.message && (
        <p className="mt-4 rounded-md border border-border/60 bg-muted/20 p-3 text-sm">{w.message}</p>
      )}
    </article>
  );
}

function ReadinessTab({ bundle }: { bundle: PanelBundle }) {
  const r = bundle.readiness;
  if (!r) return <EmptyBlock label="Scorecard de producao indisponivel neste snapshot." />;
  const overallLabel =
    r.overall === "go" ? "PRONTO (GO)" : r.overall === "no_go" ? "NAO PRONTO" : "CONDICIONAL";
  return (
    <div className="space-y-6">
      <div className="surface rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Prontos para producao?</h2>
          {statusBadge(r.overall === "conditional" ? "pending" : r.overall)}
          <span className="text-sm text-muted-foreground">{overallLabel}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {r.summary || "Sem resumo no snapshot."}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Janela de validacao: {r.validation_window ?? "—"}</span>
          <span>Decisao em: {r.decision_date ?? "—"}</span>
          <span>Avaliado: {formatDateTime(r.as_of)}</span>
        </div>
        {r.config_atual?.nota && (
          <div className="mt-4 rounded-md border border-border/60 bg-muted/20 p-3 text-sm">
            <span className="font-medium">Config atual (desde {r.config_atual.desde ?? "—"}): </span>
            {r.config_atual.nota}
            {typeof r.config_atual.monthly_pct_estimate === "number" && (
              <span> · ritmo estimado {formatSignedPct(r.config_atual.monthly_pct_estimate)}/mes</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {(r.components ?? []).map((c, index) => (
          <article
            key={c.id ?? `comp-${index}`}
            className="surface flex flex-col gap-2 rounded-lg p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-center gap-3">
              {statusBadge(c.status)}
              <span className="font-medium">{c.label ?? c.id ?? "componente"}</span>
            </div>
            <p className="text-sm text-muted-foreground md:max-w-[60%] md:text-right">{c.reason ?? ""}</p>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Scorecard computado automaticamente dos dados (corretora + brain + lab) segundo
        docs/GO-LIVE-CRITERIA.md — nao e opiniao manual.
      </p>
    </div>
  );
}

const CURRENT_CONFIG_SINCE = "2026-05-30";

function OperationsTab({ bundle }: { bundle: PanelBundle }) {
  const trades = bundle.hlClosed?.trades ?? [];
  const isCurrent = (t: HlClosedTrade) => (t.closed_at ?? "") >= CURRENT_CONFIG_SINCE;
  const current = trades.filter(isCurrent);
  const legacy = trades.filter((t) => !isCurrent(t));
  const net = (arr: HlClosedTrade[]) =>
    arr.reduce((s, t) => s + (t.realized_pnl_usd ?? 0), 0);
  const wins = (arr: HlClosedTrade[]) =>
    arr.filter((t) => (t.realized_pnl_usd ?? 0) > 0).length;
  const hasEthLegacy = current.some(
    (t) => t.agent_id === "momentum_hunter" && (t.realized_pnl_usd ?? 0) < -10
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="surface rounded-lg border-emerald-500/30 p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Configuracao ATUAL (desde 30/05) — o sistema que vale hoje
          </div>
          <div className={`mt-2 text-2xl font-semibold ${pnlClass(net(current))}`}>
            {formatCurrency(net(current))}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {current.length} operacoes · {wins(current)} vencedoras (
            {current.length ? Math.round((wins(current) / current.length) * 100) : 0}%)
          </div>
        </article>
        <article className="surface rounded-lg p-4 opacity-80">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Fases anteriores (antes de 30/05) — configuracoes que NAO existem mais
          </div>
          <div className={`mt-2 text-2xl font-semibold ${pnlClass(net(legacy))}`}>
            {formatCurrency(net(legacy))}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {legacy.length} operacoes · {wins(legacy)} vencedoras — fase de
            calibracao (auditorias de 23/05 e 30/05 corrigiram o comportamento)
          </div>
        </article>
      </div>

      {hasEthLegacy && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          ⚠️ A unica perda relevante da configuracao atual e uma posicao LEGADA do
          Momentum Hunter (ETH), aberta ANTES da quarentena de 30/05 e fechada durante a
          queda brusca do mercado. Os agentes ativos hoje nao abririam essa operacao.
        </p>
      )}

      <div className="space-y-3">
        <SectionTitle icon={Activity} title="Operacoes da configuracao atual" />
        {current.length ? (
          <TradesTable rows={current} />
        ) : (
          <EmptyBlock label="Sem operacoes fechadas na configuracao atual ainda." />
        )}
      </div>

      <details className="space-y-3">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Ver {legacy.length} operacoes das fases anteriores (historico de calibracao)
        </summary>
        <div className="mt-3 opacity-75">
          <TradesTable rows={legacy} />
        </div>
      </details>
    </div>
  );
}

function DefiTab({ bundle }: { bundle: PanelBundle }) {
  const defi = bundle.defi;
  const kpis = defi?.kpis;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Valor" value={formatCurrency(kpis?.value_usd)} icon={Layers} />
        <MetricTile label="Rewards" value={formatCurrency(kpis?.rewards_usd)} icon={Zap} />
        <MetricTile label="Posicoes" value={formatNumber(kpis?.positions)} icon={Table2} />
        <MetricTile label="In range" value={formatPct(kpis?.in_range_pct)} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <SectionTitle icon={BarChart3} title="Diversificacao" />
          <DiversificationChart defi={defi} />
        </div>
        <div className="space-y-4">
          <SectionTitle icon={Layers} title="Top posicoes" />
          <DefiPositionsTable defi={defi} />
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle icon={Zap} title="Sugestoes" />
        <SuggestionsTable defi={defi} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(defi?.wallets ?? []).map((wallet) => (
          <article key={wallet.network} className="surface rounded-lg p-4">
            <div className="text-sm font-semibold capitalize">{wallet.network}</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Valor</div>
                <div className="font-semibold">{formatCurrency(wallet.value_usd)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Posicoes</div>
                <div className="font-semibold">{formatNumber(wallet.positions)}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NewsSentinel — aba Notícias (didática, padrão DeFi/HL)
// ---------------------------------------------------------------------------

const NEWS_ACTION_LABEL: Record<string, string> = {
  BUY: "Comprar",
  INCREASE: "Aumentar",
  HOLD: "Manter",
  WATCH: "Observar",
  WAIT_CONFIRMATION: "Aguardar confirmacao",
  SELL: "Vender",
  REDUCE: "Reduzir",
  HEDGE: "Proteger (hedge)",
  BLOCK_TRADE: "Entrada bloqueada",
};

const NEWS_MARKET_FLAG: Record<string, string> = {
  CRYPTO: "🪙",
  TRADITIONAL_BR: "🇧🇷",
  TRADITIONAL_GLOBAL: "🌎",
  MACRO_CROSS_MARKET: "🌐",
};

function newsActionClass(action?: string) {
  if (action === "BUY" || action === "INCREASE")
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (action === "SELL" || action === "REDUCE")
    return "border-orange-500/40 bg-orange-500/10 text-orange-300";
  if (action === "BLOCK_TRADE")
    return "border-red-500/40 bg-red-500/10 text-red-300";
  if (action === "HEDGE")
    return "border-indigo-500/40 bg-indigo-500/10 text-indigo-300";
  if (action === "WAIT_CONFIRMATION")
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-sky-500/40 bg-sky-500/10 text-sky-300"; // WATCH/HOLD
}

function newsRiskClass(risk?: string) {
  if (risk === "CRITICAL") return "border-red-500/40 bg-red-500/10 text-red-300";
  if (risk === "HIGH") return "border-orange-500/40 bg-orange-500/10 text-orange-300";
  if (risk === "MEDIUM") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
}

function sentimentBadge(sentiment?: string) {
  if (sentiment === "positive")
    return <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300">otimista</Badge>;
  if (sentiment === "negative")
    return <Badge className="border-red-500/40 bg-red-500/10 text-red-300">pessimista</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">neutra</Badge>;
}

function safeNewsUrl(url?: string) {
  if (!url) return undefined;
  return url.startsWith("https://") || url.startsWith("http://") ? url : undefined;
}

function NewsItemCard({ item }: { item: NewsTopItem }) {
  const href = safeNewsUrl(item.url);
  return (
    <article className="surface rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-2">
        {sentimentBadge(item.sentiment)}
        {(item.symbols ?? []).slice(0, 4).map((symbol) => (
          <Badge key={symbol} variant="secondary" className="bg-secondary/80">
            {symbol}
          </Badge>
        ))}
        <span className="text-xs text-muted-foreground">
          {item.source ?? "-"} · {formatDateTime(item.published_at)}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium leading-snug">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1 hover:text-primary"
          >
            {item.title ?? "-"}
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </a>
        ) : (
          item.title ?? "-"
        )}
      </p>
      {item.summary && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
      )}
      <div className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        impacto {formatNumber(item.impact_score)} / 100 · relevancia {formatNumber(item.relevance_score)} / 100
      </div>
    </article>
  );
}

function NewsSuggestionsTable({ suggestions }: { suggestions: NewsSuggestion[] }) {
  if (!suggestions.length) return null;
  return (
    <div className="surface rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ativo</TableHead>
            <TableHead>Sugestao</TableHead>
            <TableHead className="text-right">Confianca</TableHead>
            <TableHead>Risco</TableHead>
            <TableHead>Por que</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suggestions.map((suggestion, index) => (
            <TableRow key={`${suggestion.asset}-${suggestion.action}-${index}`}>
              <TableCell className="font-medium">
                {suggestion.asset === "*" ? "Todos os mercados" : suggestion.asset ?? "-"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={newsActionClass(suggestion.action)}>
                  {NEWS_ACTION_LABEL[suggestion.action ?? ""] ?? suggestion.action ?? "-"}
                </Badge>
                {suggestion.requires_human_review && (
                  <Badge variant="outline" className="ml-2 border-amber-500/40 bg-amber-500/10 text-amber-300">
                    revisao humana
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPct(
                  typeof suggestion.confidence === "number" ? suggestion.confidence * 100 : undefined,
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={newsRiskClass(suggestion.risk)}>
                  {suggestion.risk ?? "-"}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[420px] text-sm text-muted-foreground">
                {suggestion.reason ?? "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function NewsMarketSection({ section }: { section: NewsSection }) {
  const news = section.topNews ?? [];
  const suggestions = section.suggestions ?? [];
  if (!news.length && !suggestions.length) return null;
  const flag = NEWS_MARKET_FLAG[section.market ?? ""] ?? "📰";
  return (
    <div className="space-y-4">
      <SectionTitle
        icon={Newspaper}
        title={`${flag} ${section.title ?? section.market ?? "Mercado"}`}
        description={section.summary}
      />
      {suggestions.length > 0 && <NewsSuggestionsTable suggestions={suggestions} />}
      {news.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {news.map((item, index) => (
            <NewsItemCard key={`${item.url}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <EmptyBlock label="Sem noticias relevantes nesta janela." />
      )}
    </div>
  );
}

function NewsTab({ bundle }: { bundle: PanelBundle }) {
  const news: NewsPanelSummary | null | undefined = bundle.news;
  const sentinel = news?.sentinel;

  if (!news) {
    return (
      <EmptyBlock label="Painel de noticias indisponivel neste snapshot — atualize o snapshot com o endpoint /news/summary." />
    );
  }
  if (news.empty) {
    return (
      <div className="space-y-6">
        <EmptyBlock label={news.reason ?? "Sem noticias na janela — aguardando o proximo ciclo do NewsSentinel."} />
        {sentinel && <NewsSentinelPerformance sentinel={sentinel} />}
      </div>
    );
  }

  const blocks = (news.top_risks ?? []).filter((r) => r.action === "BLOCK_TRADE");

  return (
    <div className="space-y-8">
      {/* Como ler — didatico, mesmo espirito do card "Entendendo os numeros" */}
      <article className="surface rounded-lg p-5">
        <SectionTitle icon={Newspaper} title="Como ler este painel (em 30 segundos)" />
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            O <b className="text-foreground">NewsSentinel</b> e o agente de noticias do time: ele le
            fontes gratuitas de <b className="text-foreground">cripto, Brasil, mercado global e macroeconomia</b>,
            mede o sentimento de cada noticia e transforma isso em <b className="text-foreground">sugestoes
            por ativo</b> — comprar, observar, reduzir, proteger ou bloquear entrada.
          </p>
          <p>
            Importante: ele <b className="text-foreground">nunca executa ordens</b>. As sugestoes entram na
            decisao CONJUNTA com os agentes tecnicos (Swing Rider, Mean Reverter, etc.) e o gestor de
            risco — noticia sozinha nao move dinheiro. Noticia critica (hack, insolvencia) apenas{" "}
            <b className="text-foreground">bloqueia novas entradas</b> no ativo; nunca fecha posicao.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className={newsActionClass("BUY")}>Comprar = noticia + tecnico alinhados</Badge>
            <Badge variant="outline" className={newsActionClass("WATCH")}>Observar = relevante, sem direcao clara</Badge>
            <Badge variant="outline" className={newsActionClass("WAIT_CONFIRMATION")}>Aguardar = fonte unica, falta confirmacao</Badge>
            <Badge variant="outline" className={newsActionClass("BLOCK_TRADE")}>Bloqueio = evento critico no ativo</Badge>
          </div>
        </div>
      </article>

      {/* KPIs do ciclo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Noticias (24h)"
          value={formatNumber(sentinel?.news_24h)}
          detail={`ultimo ciclo ${formatDateTime(sentinel?.last_cycle_ts ?? undefined)}`}
          icon={Newspaper}
        />
        <MetricTile
          label="Eventos criticos (24h)"
          value={formatNumber(sentinel?.critical_24h)}
          detail="hack / insolvencia / depeg"
          icon={AlertTriangle}
        />
        <MetricTile
          label="Sugestoes ativas"
          value={formatNumber(sentinel?.suggestions_active)}
          detail={`${formatNumber(sentinel?.human_review_pending)} aguardando revisao humana`}
          icon={Eye}
        />
        <MetricTile
          label="Confianca media"
          value={formatPct(
            typeof sentinel?.avg_confidence_active === "number"
              ? sentinel.avg_confidence_active * 100
              : undefined,
          )}
          detail="das sugestoes ativas"
          icon={CheckCircle2}
        />
      </div>

      {/* Bloqueios criticos em destaque */}
      {blocks.length > 0 && (
        <div className="surface rounded-lg border-red-500/30 p-4">
          <div className="flex items-center gap-2 font-semibold text-red-300">
            <AlertTriangle className="h-4 w-4" />
            Entradas bloqueadas por evento critico
          </div>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {blocks.map((block, index) => (
              <p key={`${block.asset}-${index}`}>
                <b className="text-foreground">{block.asset}</b>: {block.block_trade_reason ?? block.reason}
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Bloqueio vale apenas para NOVAS entradas — posicoes abertas continuam gerenciadas
            pelos daemons de protecao (mesmo contrato do circuit breaker).
          </p>
        </div>
      )}

      {/* Oportunidades + riscos */}
      {(news.top_opportunities?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <SectionTitle
            icon={Zap}
            title="Oportunidades em observacao"
            description="Sugestoes positivas — so viram operacao com confirmacao dos agentes tecnicos."
          />
          <NewsSuggestionsTable suggestions={news.top_opportunities ?? []} />
        </div>
      )}
      {(news.top_risks?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <SectionTitle
            icon={ShieldCheck}
            title="Riscos e protecoes"
            description="Onde o agente sugere reduzir, proteger ou esperar."
          />
          <NewsSuggestionsTable suggestions={news.top_risks ?? []} />
        </div>
      )}

      {/* 4 mercados */}
      {(news.sections ?? []).map((section) => (
        <NewsMarketSection key={section.market} section={section} />
      ))}

      {/* Performance do agente */}
      {sentinel && <NewsSentinelPerformance sentinel={sentinel} />}

      <p className="text-xs text-muted-foreground">{news.disclaimer}</p>
    </div>
  );
}

function NewsSentinelPerformance({
  sentinel,
}: {
  sentinel: NonNullable<NewsPanelSummary["sentinel"]>;
}) {
  const byAction = Object.entries(sentinel.by_action_7d ?? {});
  return (
    <article className="surface rounded-lg border-primary/30 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">NewsSentinel — performance do agente</h3>
        <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30">ADVISORY · nunca executa</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Por ser um agente consultivo, a performance dele nao e PnL proprio: e a qualidade da
        inteligencia produzida — noticias processadas, sugestoes emitidas e decisoes conjuntas
        com os agentes tecnicos. Quando as decisoes conjuntas acumularem resultado, a taxa de
        acerto aparece aqui.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Sugestoes (7 dias)</div>
          <div className="font-semibold tabular-nums">{formatNumber(sentinel.suggestions_7d)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Decisoes conjuntas (7d)</div>
          <div className="font-semibold tabular-nums">{formatNumber(sentinel.joint_decisions_7d)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Revisao humana pendente</div>
          <div className="font-semibold tabular-nums">{formatNumber(sentinel.human_review_pending)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Ultimo ciclo</div>
          <div className="font-semibold">{formatDateTime(sentinel.last_cycle_ts ?? undefined)}</div>
        </div>
      </div>
      {byAction.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase text-muted-foreground">Distribuicao das sugestoes (7 dias)</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {byAction.map(([action, count]) => (
              <Badge key={action} variant="outline" className={newsActionClass(action)}>
                {NEWS_ACTION_LABEL[action] ?? action}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function LabTab({ bundle }: { bundle: PanelBundle }) {
  const lab = bundle.lab;
  const byAgent = Object.entries(lab?.by_agent ?? {});
  const labReadiness = (bundle.readiness?.components ?? []).find(
    (c) => c.id === "mean_reverter_lateral"
  );
  const m = (labReadiness?.metrics ?? {}) as {
    trades?: number;
    net_usd?: number;
    payoff?: number | null;
    top1_share?: number | null;
  };
  const crit = [
    {
      label: "Amostra ≥ 40 operacoes",
      ok: (m.trades ?? 0) >= 40,
      atual: `${m.trades ?? 0}/40`,
    },
    {
      label: "Lucro liquido > $0 (14d)",
      ok: (m.net_usd ?? 0) > 0,
      atual: formatCurrency(m.net_usd),
    },
    {
      label: "Payoff (ganho medio / perda media) ≥ 2",
      ok: (m.payoff ?? 0) >= 2,
      atual: m.payoff != null ? `${m.payoff}x` : "—",
    },
    {
      label: "Maior trade < 50% do lucro (sem depender de 1 acerto)",
      ok: m.top1_share != null && m.top1_share < 0.5,
      atual: m.top1_share != null ? `${Math.round(m.top1_share * 100)}%` : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricTile label="Closed" value={formatNumber(lab?.closed)} icon={Table2} />
        <MetricTile label="Open" value={formatNumber(lab?.open)} icon={Activity} />
        <MetricTile label="Wins" value={formatNumber(lab?.wins)} icon={CheckCircle2} />
        <MetricTile label="Win rate" value={formatPct(lab?.win_rate_pct)} icon={BarChart3} />
        <MetricTile label="Net PnL (simulado)" value={formatCurrency(lab?.net_pnl_usd)} icon={LineChart} />
      </div>

      <p className="text-xs text-muted-foreground">
        O Lab opera em SOMBRA: simula as operacoes com precos reais, mas sem dinheiro.
        O lucro acima e hipotetico — serve para provar (ou descartar) a estrategia antes
        de coloca-la junto dos agentes reais.
      </p>

      <article className="surface rounded-lg border-primary/30 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Quando o Lab entra no time?</h3>
          {statusBadge(labReadiness?.status)}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Decisao em <b>{bundle.readiness?.decision_date ?? "13/06"}</b>: se o Mean
          Reverter (a estrategia promissora do Lab) cumprir TODOS os criterios abaixo,
          ele e promovido — passa a operar de verdade com valores pequenos ($25–50 por
          ordem), gated por mercado lateral, e a partir dai os resultados dele CONTAM no
          % mensal estimado do time.
        </p>
        <div className="mt-4 space-y-2">
          {crit.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/10 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
                {c.label}
              </span>
              <span className={c.ok ? "text-emerald-400" : "text-amber-400"}>{c.atual}</span>
            </div>
          ))}
        </div>
        {labReadiness?.reason && (
          <p className="mt-3 text-xs text-muted-foreground">Status: {labReadiness.reason}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Por que esperar? O lucro atual depende muito de poucos acertos grandes (feitos
          durante a queda do mercado). Os criterios garantem que a estrategia funciona de
          forma consistente antes de receber dinheiro. O Scalper ja foi REPROVADO em
          definitivo (542 operacoes provaram que as taxas comem o ganho).
        </p>
      </article>

      {!byAgent.length ? (
        <EmptyBlock label="Sem dados de laboratorio lateral." />
      ) : (
        <div className="surface rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead className="text-right">Closed</TableHead>
                <TableHead className="text-right">Wins</TableHead>
                <TableHead className="text-right">Net PnL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byAgent.map(([agent, stats]) => (
                <TableRow key={agent}>
                  <TableCell className="font-medium">{agentLabel(agent)}</TableCell>
                  <TableCell className="text-right">{formatNumber(stats.closed)}</TableCell>
                  <TableCell className="text-right">{formatNumber(stats.wins)}</TableCell>
                  <TableCell className={`text-right font-semibold ${pnlClass(stats.net_pnl_usd)}`}>
                    {formatCurrency(stats.net_pnl_usd)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function SnapshotTab({ bundle, source, liveError }: PanelResolvedBundle) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricTile label="Fonte" value={sourceLabel(source)} icon={Database} />
        <MetricTile label="Env" value={bundle.env} icon={Layers} />
        <MetricTile label="Capturado" value={formatDateTime(bundle.capturedAt)} icon={Clock3} />
      </div>

      {(liveError || bundle.endpointErrors) && (
        <div className="surface rounded-lg border-amber-500/30 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Avisos
          </div>
          {liveError && <p className="mt-2 text-muted-foreground">Live: {liveError}</p>}
          {bundle.endpointErrors && (
            <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 text-xs text-muted-foreground">
              {JSON.stringify(bundle.endpointErrors, null, 2)}
            </pre>
          )}
        </div>
      )}

      <pre className="max-h-[620px] overflow-auto rounded-lg border border-border bg-background/80 p-4 text-xs leading-relaxed text-muted-foreground">
        {JSON.stringify(bundle, null, 2)}
      </pre>
    </div>
  );
}

function Dashboard({
  env,
  onEnvChange,
  resolved,
  isLoading,
  isFetching,
  error,
  onRefresh,
  holderTokenIds,
}: {
  env: PanelEnv;
  onEnvChange: (env: PanelEnv) => void;
  resolved: PanelResolvedBundle | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  onRefresh: () => void;
  holderTokenIds: number[];
}) {
  const bundle = resolved?.bundle;
  const hasCredentials = hasPanelApiCredentials();

  if (isLoading && !bundle) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando painel dos agentes.</p>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="mx-auto max-w-2xl surface rounded-lg p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h2 className="mt-5 text-2xl font-semibold">Painel indisponivel</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {error?.message ?? "Nao existe live/cache/snapshot para este ambiente."}
        </p>
        <Button className="mt-6" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Holder
            </Badge>
            <Badge variant="outline">{holderTokenIds.map((id) => `#${id}`).join(" ")}</Badge>
            <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
              {sourceLabel(resolved.source)}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold md:text-5xl">Holders</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Agentes trader, HyperLiquid, DeFi, noticias de mercado, risco, laboratorio e
            operacoes fechadas.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Atualizado {formatDateTime(bundle.capturedAt)}</span>
            <span>{bundle.env}</span>
            {!hasCredentials && <span>Sem key live no bundle publico</span>}
            {resolved.liveError && <span>Live falhou: {resolved.liveError}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            {(["testnet", "prod"] as const).map((option) => (
              <button
                key={option}
                onClick={() => onEnvChange(option)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  env === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {bundle.overview?.empty && (
        <div className="surface rounded-lg border-amber-500/30 p-4 text-sm text-amber-200">
          {bundle.overview.reason ?? "Ambiente sem dados."}
        </div>
      )}

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="agents" className="gap-2">
            <Bot className="h-4 w-4" />
            Agentes Trader
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="hl" className="gap-2">
            <LineChart className="h-4 w-4" />
            HyperLiquid
          </TabsTrigger>
          <TabsTrigger value="defi" className="gap-2">
            <Layers className="h-4 w-4" />
            DeFi
          </TabsTrigger>
          <TabsTrigger value="news" className="gap-2">
            <Newspaper className="h-4 w-4" />
            Noticias
          </TabsTrigger>
          <TabsTrigger value="ops" className="gap-2">
            <Table2 className="h-4 w-4" />
            Operacoes
          </TabsTrigger>
          <TabsTrigger value="lab" className="gap-2">
            <Zap className="h-4 w-4" />
            Lab
          </TabsTrigger>
          <TabsTrigger value="producao" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Producao
          </TabsTrigger>
          <TabsTrigger value="snapshot" className="gap-2">
            <Database className="h-4 w-4" />
            Snapshot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <AgentsTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="overview">
          <OverviewTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="hl">
          <HyperLiquidTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="defi">
          <DefiTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="news">
          <NewsTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="ops">
          <OperationsTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="lab">
          <LabTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="producao">
          <ReadinessTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="snapshot">
          <SnapshotTab bundle={bundle} source={resolved.source} liveError={resolved.liveError} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Holders = () => {
  const holder = useCollectionHolder();
  const [env, setEnv] = useState<PanelEnv>("testnet");

  const panelQuery = useQuery<PanelResolvedBundle, Error>({
    queryKey: ["holders-panel", env],
    enabled: holder.isHolder,
    queryFn: () => resolvePanelBundle(env),
    staleTime: 20_000,
    refetchInterval: hasPanelApiCredentials() ? 30_000 : false,
    refetchIntervalInBackground: false,
  });

  const gateVisible =
    !holder.isConnected || holder.isWrongNetwork || holder.isLoading || Boolean(holder.error) || !holder.isHolder;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <section className="border-b border-border/50 bg-muted/10 py-8">
          <div className="container mx-auto px-4">
            {gateVisible ? (
              <AccessPanel />
            ) : (
              <Dashboard
                env={env}
                onEnvChange={setEnv}
                resolved={panelQuery.data}
                isLoading={panelQuery.isLoading}
                isFetching={panelQuery.isFetching}
                error={panelQuery.error}
                onRefresh={() => panelQuery.refetch()}
                holderTokenIds={holder.tokenIds}
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Holders;
