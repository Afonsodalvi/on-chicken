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
  Layers,
  LineChart,
  Loader2,
  Lock,
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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Equity HL" value={formatCurrency(hlKpis?.equity_usd)} detail="HyperLiquid" icon={LineChart} />
        <MetricTile label="PnL realizado" value={formatCurrency(hlKpis?.realized_pnl_usd)} detail={`Win rate ${formatPct(hlKpis?.win_rate_pct)}`} icon={Activity} />
        <MetricTile label="Valor DeFi" value={formatCurrency(defiKpis?.value_usd)} detail={`${formatNumber(defiKpis?.positions)} posicoes`} icon={Layers} />
        <MetricTile label="Rewards DeFi" value={formatCurrency(defiKpis?.rewards_usd)} detail={`${formatPct(defiKpis?.in_range_pct)} in range`} icon={Zap} />
      </div>

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

function AgentsTab({ bundle }: { bundle: PanelBundle }) {
  return (
    <div className="space-y-8">
      <AgentCards hl={bundle.hl} metaAgents={bundle.metaAgents} />
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
        <MetricTile label="Equity (3 carteiras)" value={formatCurrency(kpis?.equity_usd)} icon={LineChart} />
        <MetricTile label="PnL liquido 30d (corretora)" value={formatCurrency(kpis?.realized_pnl_usd)} icon={Activity} />
        <MetricTile label="Win rate (corretora)" value={formatPct(kpis?.win_rate_pct)} icon={CheckCircle2} />
        <MetricTile label="Posicoes (corretora)" value={formatNumber(kpis?.open_positions)} icon={Table2} />
        <MetricTile
          label="% mes estimado (30d)"
          value={kpis?.monthly_pct_estimate != null ? `${kpis.monthly_pct_estimate > 0 ? "+" : ""}${kpis.monthly_pct_estimate}%` : "—"}
          icon={BarChart3}
        />
      </div>

      {hl?.performance?.windows && (
        <div className="space-y-4">
          <SectionTitle icon={Activity} title="Resultado por janela (fonte: corretora, com taxas)" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(hl.performance.windows).map(([name, w]) => (
              <article key={name} className="surface rounded-lg p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {name === "since_current" ? "config atual (30/05→)" : name === "since_corrected" ? "pos-correcoes (23/05→)" : name}
                </div>
                <div className={`mt-2 text-xl font-semibold ${Number(w.net_usd) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(w.net_usd)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {w.trades ?? 0} trades · win {w.win_rate_pct != null ? `${w.win_rate_pct}%` : "—"} · taxas {formatCurrency(w.fees_usd)}
                </div>
                <div className="mt-1 text-xs">
                  ≈ {w.monthly_pct_estimate != null ? `${w.monthly_pct_estimate > 0 ? "+" : ""}${w.monthly_pct_estimate}%/mes` : "—"}
                </div>
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
              label="Equity total (todas as carteiras)"
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
            {(accounts.wallets ?? []).map((w) => (
              <article key={w.wallet_id} className="surface rounded-lg p-4">
                <div className="text-sm font-semibold capitalize">{w.wallet_id}</div>
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
            Saldos lidos direto da corretora pelo Master Observer (inclui a carteira DCA,
            que nao entra no equity de trading acima).
          </p>
        </div>
      )}

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

function statusBadge(status?: string) {
  if (status === "go") return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">GO</Badge>;
  if (status === "no_go") return <Badge className="bg-red-500/15 text-red-400 border-red-500/30">NO-GO</Badge>;
  return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">PENDENTE</Badge>;
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
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Janela de validacao: {r.validation_window}</span>
          <span>Decisao em: {r.decision_date}</span>
          <span>Avaliado: {formatDateTime(r.as_of)}</span>
        </div>
        {r.config_atual && (
          <div className="mt-4 rounded-md border border-border/60 bg-muted/20 p-3 text-sm">
            <span className="font-medium">Config atual (desde {r.config_atual.desde}): </span>
            {r.config_atual.nota}
            {r.config_atual.monthly_pct_estimate != null && (
              <span> · ritmo estimado {r.config_atual.monthly_pct_estimate > 0 ? "+" : ""}{r.config_atual.monthly_pct_estimate}%/mes</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {(r.components ?? []).map((c) => (
          <article key={c.id} className="surface flex flex-col gap-2 rounded-lg p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {statusBadge(c.status)}
              <span className="font-medium">{c.label}</span>
            </div>
            <p className="text-sm text-muted-foreground md:max-w-[60%] md:text-right">{c.reason}</p>
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

function OperationsTab({ bundle }: { bundle: PanelBundle }) {
  const closed = bundle.hlClosed;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricTile label="Operacoes" value={formatNumber(closed?.count)} icon={Table2} />
        <MetricTile label="Vencedoras" value={formatNumber(closed?.wins)} icon={CheckCircle2} />
        <MetricTile label="Net PnL" value={formatCurrency(closed?.net_pnl_usd)} icon={Activity} />
      </div>
      <TradesTable rows={closed?.trades ?? []} />
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

function LabTab({ lab }: { lab?: LabLateral | null }) {
  const byAgent = Object.entries(lab?.by_agent ?? {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricTile label="Closed" value={formatNumber(lab?.closed)} icon={Table2} />
        <MetricTile label="Open" value={formatNumber(lab?.open)} icon={Activity} />
        <MetricTile label="Wins" value={formatNumber(lab?.wins)} icon={CheckCircle2} />
        <MetricTile label="Win rate" value={formatPct(lab?.win_rate_pct)} icon={BarChart3} />
        <MetricTile label="Net PnL" value={formatCurrency(lab?.net_pnl_usd)} icon={LineChart} />
      </div>

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
            Agentes trader, HyperLiquid, DeFi, risco, laboratorio e operacoes fechadas.
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
        <TabsContent value="ops">
          <OperationsTab bundle={bundle} />
        </TabsContent>
        <TabsContent value="lab">
          <LabTab lab={bundle.lab} />
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
