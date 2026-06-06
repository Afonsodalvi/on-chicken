# Panel API — referência completa + roteiro de front-end

API **read-only** para alimentar qualquer painel/front. Gateada por **API key**,
com toggle **testnet/produção**. Serve só dados (HyperLiquid + DeFi + lab + risco);
**nunca** expõe o orquestrador, execução ou segredos.

- **Base local:** `http://127.0.0.1:8765` (porta `PANEL_API_PORT`, default 8765)
- **Versão:** `/api/v1`
- **Servir:** `agents-platform panel-api-serve --host 127.0.0.1 --port 8765` (sobe junto no `start-all` se `PANEL_API_KEY` existir).
- **Stack:** Python stdlib (sem framework), CORS liberado (`*`), thread-safe.

## Autenticação
Toda rota (exceto `/health` e `/api/v1`) exige a key:
- Header: `X-API-Key: <SUA_KEY>` **(recomendado)**, ou
- Query: `?api_key=<SUA_KEY>`

A key foi gerada e está em **`~/openclaw/.env.secrets`** na var `PANEL_API_KEY`
(prefixo `opk_`). Recupere com:
```bash
grep '^PANEL_API_KEY=' ~/openclaw/.env.secrets | cut -d= -f2
```
Falhas: sem key configurada no servidor → **503**; key ausente/errada → **401**.

> ⚠️ Trate a key como segredo. Em produção, sirva atrás de um túnel (Cloudflare
> Tunnel/Tailscale) — ver `ACESSO-REMOTO-NFT-GATED.md`. Nunca commite a key.

## Ambiente (testnet / produção)
Toda rota de dados aceita `?env=testnet` (default) ou `?env=prod`. Enquanto a
mainnet não está no ar, `env=prod` responde `{"empty": true, "reason": "aguardando go-live mainnet"}`.
Quando migrarmos, basta apontar `MASTER_OBSERVER_DB_PATH_PROD` / `DEFI_DB_PATH_PROD`
no `.env` — mesma API, mesmas rotas.

## Códigos de status
`200` ok · `401` key inválida · `404` rota/recurso inexistente · `405` método ≠ GET · `500` erro interno (sem stack) · `503` key não configurada no servidor.

---

# Rotas

### Públicas (sem key)

#### `GET /health`
```json
{ "ok": true, "service": "openclaw-panel-api", "version": "v1", "envs": ["testnet","prod"] }
```

#### `GET /api/v1`  — catálogo de rotas (útil pro front se autodescobrir)
```json
{ "service":"openclaw-panel-api","version":"v1",
  "auth":"X-API-Key header or ?api_key=","env_param":"?env=testnet|prod (default testnet)",
  "routes":[ "/api/v1/overview", "/api/v1/hl/summary", ... ],
  "public_routes":["/health","/api/v1"] }
```

---

### Visão geral

#### `GET /api/v1/overview?env=testnet`
Resumo de tudo numa chamada (ideal pro topo do painel).
```json
{
  "env": "testnet",
  "hl_kpis": {"equity_usd":1595.42,"realized_pnl_usd":12.28,"win_rate_pct":49.7,"open_positions":0,"liquidations":0},
  "defi_kpis": {"value_usd":4182.78,"rewards_usd":20.66,"positions":13,"in_range_pct":38.5},
  "circuit_breaker": {"available":true,"date":"2026-05-31","peak_usd":1596.15,"threshold_pct":12.0,"halt_mode":"entry-only (nunca fecha posição)"},
  "regime": {"macro_regime":"risk_on","ts":"...","note":"per-asset regime é calculado ao vivo (não persistido)"},
  "hl_empty": false, "defi_empty": false
}
```

---

### HyperLiquid

#### `GET /api/v1/hl/summary?env=testnet` — pacote HL completo
`{ env, kpis{}, wallets[], agents[], pnl_by_symbol_side[] }` (união das rotas abaixo).

#### `GET /api/v1/hl/kpis`
```json
{ "env":"testnet","empty":false,
  "kpis":{"equity_usd":1595.42,"realized_pnl_usd":12.28,"win_rate_pct":49.7,"open_positions":0,"liquidations":0} }
```

#### `GET /api/v1/hl/wallets`  —  carteiras A/B/C com PnL realizado
```json
{ "env":"testnet","wallets":[
  {"id":"directional","label":"A — Direcional","leverage":5,"role":"directional","trades":148,"realized_pnl_usd":11.52}, ... ] }
```

#### `GET /api/v1/hl/wallets/{wallet_id}`  —  uma carteira (`directional|contrarian|dca_btc`)
`{ "wallet": {…} }` ou `404 {"error":"not_found","wallet":"<id>"}`.

#### `GET /api/v1/hl/agents`  —  desempenho por agente (com status)
```json
{ "env":"testnet","agents":[
  {"agent_id":"swing_rider","trades":20,"wins":20,"realized_pnl_usd":18.46,"status":"live"},
  {"agent_id":"momentum_hunter","trades":51,"wins":24,"realized_pnl_usd":-7.77,"status":"quarentena"}, ... ] }
```
`status` ∈ `live | shadow | quarentena | neutro`.

#### `GET /api/v1/hl/agents/{agent_id}` — um agente. `{ "agent": {…} }` ou 404.

#### `GET /api/v1/hl/pnl-by-symbol`  —  PnL por ativo+lado (pro gráfico de barras)
```json
{ "env":"testnet","pnl_by_symbol_side":[
  {"symbol":"BTC","side":"SELL","pnl_usd":7.27,"trades":43}, ... ] }
```

#### `GET /api/v1/hl/positions`  —  posições ABERTAS agora
```json
{ "env":"testnet","positions":[
  {"symbol":"SOL","side":"BUY","wallet_id":"contrarian","agent_id":"scalper","open_ts":"...","leverage":8.0}, ... ] }
```

#### `GET /api/v1/hl/closed`  —  ÚLTIMAS OPERAÇÕES FECHADAS (trade log)
Data/hora, lucro realizado, ROE, duração e motivo — mais recentes primeiro.
Params: `limit` (default 50, máx 500), `since_hours`, `agent`, `symbol`.
```json
{
  "env": "testnet", "count": 5, "wins": 5, "net_pnl_usd": 2.24,
  "trades": [
    {
      "symbol": "SUI", "side": "SELL", "agent_id": "swing_rider", "wallet_id": "directional",
      "size": 177.3, "entry_px": 0.93, "exit_px": 0.9002,
      "realized_pnl_usd": 0.95, "max_roe_pct": 3.1, "min_roe_pct": -0.4,
      "duration_min": 184.0, "close_reason": "exit_filled",
      "opened_at": "2026-05-30T01:18:00+00:00", "closed_at": "2026-05-30T04:21:57+00:00"
    }
  ]
}
```
> Linhas antigas do brain podem ter `entry_px`/`duration_min`/`*_roe` em `null`
> (a base só guardava o fechamento); operações novas preenchem tudo. `realized_pnl_usd`,
> `close_reason`, `opened_at`, `closed_at`, `agent_id` e `symbol` sempre vêm.
> Exemplos de uso: `?limit=20` · `?since_hours=24` · `?agent=swing_rider` · `?symbol=AVAX`.

#### `GET /api/v1/hl/regime`  —  regime macro (BTC) persistido
```json
{ "env":"testnet","macro_regime":"risk_on","ts":"...","note":"per-asset regime é calculado ao vivo (não persistido)" }
```

#### `GET /api/v1/hl/circuit-breaker`  —  estado do disjuntor de drawdown
```json
{ "env":"testnet","circuit_breaker":{"available":true,"date":"2026-05-31","peak_usd":1596.15,"threshold_pct":12.0,"halt_mode":"entry-only (nunca fecha posição)"} }
```

---

### DeFi

#### `GET /api/v1/defi/summary?env=testnet` — pacote DeFi completo
`{ env, kpis{}, wallets[], positions[], diversification{}, suggestions[], last_run }`.

#### `GET /api/v1/defi/kpis`
```json
{ "env":"testnet","empty":false,"kpis":{"value_usd":4182.78,"rewards_usd":20.66,"positions":13,"in_range_pct":38.5} }
```

#### `GET /api/v1/defi/wallets` — por rede
```json
{ "env":"testnet","wallets":[{"network":"ethereum","positions":8,"value_usd":3180.0}, ... ] }
```

#### `GET /api/v1/defi/positions` — top posições
```json
{ "env":"testnet","positions":[{"pair":"WETH/USDT","network":"ethereum","value_usd":933.0,"apr_pct":2.85}, ... ] }
```

#### `GET /api/v1/defi/suggestions` — sugestões da última run
```json
{ "env":"testnet","last_run":"...","suggestions":[
  {"action":"reposition","from_pair":"USDC/cbBTC","to_pair":"WETH/USDC","network":"base","apr_gain_pct":8.1,"est_monthly_usd":4.18,"notional_usd":617.71,"payback_days":0.0}, ... ] }
```

#### `GET /api/v1/defi/diversification`
```json
{ "env":"testnet","diversification":{"WETH":55.5,"cbBTC":14.8,"USDC":14.0, ...} }
```

---

### Lab & Meta

#### `GET /api/v1/lab/lateral` — resumo do laboratório lateral (shadow, isolado)
```json
{ "lab":"lateral_shadow","closed":27,"open":6,"wins":19,"win_rate_pct":70.4,"net_pnl_usd":3.68,
  "by_agent":{"scalper":{"closed":26,"wins":18,"net_pnl_usd":2.96},"mean_reverter":{"closed":1,"wins":1,"net_pnl_usd":0.72}} }
```

#### `GET /api/v1/meta/agents` — descrição didática de cada agente (tooltips)
`{ "agents": { "swing_rider": {"family":"swing","desc":"..."}, ... } }`

#### `GET /api/v1/meta/wallets` — topologia das carteiras (A/B/C + leverage + agentes)
`{ "wallets": [ {"id":"directional","label":"A — Direcional","leverage":5,"agents":[...],"desc":"..."}, ... ] }`

---

# Exemplos curl
```bash
KEY=$(grep '^PANEL_API_KEY=' ~/openclaw/.env.secrets | cut -d= -f2)
B=http://127.0.0.1:8765

curl -s $B/health | jq
curl -s -H "X-API-Key: $KEY" "$B/api/v1/overview?env=testnet" | jq
curl -s -H "X-API-Key: $KEY" "$B/api/v1/hl/agents" | jq
curl -s -H "X-API-Key: $KEY" "$B/api/v1/defi/suggestions" | jq
curl -s -H "X-API-Key: $KEY" "$B/api/v1/hl/summary?env=prod" | jq   # -> empty até mainnet
```

---

# Roteiro de implementação no front-end

**1. Config** — guarde base URL, key e env num único lugar:
```js
const API = { base: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8765",
              key:  import.meta.env.VITE_API_KEY, env: "testnet" };
```
> Nunca hardcode a key no bundle público. Em produção, o front fala com um
> backend-proxy (ou o túnel) que injeta a key; ou usa um login que devolve a key.

**2. Wrapper de fetch** (key + env + erros num lugar só):
```js
async function api(path, params = {}) {
  const url = new URL(`${API.base}/api/v1${path}`);
  url.searchParams.set("env", API.env);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url, { headers: { "X-API-Key": API.key } });
  if (r.status === 401) throw new Error("API key inválida");
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}
```

**3. Toggle de ambiente** — um switch que muda `API.env` entre `testnet`/`prod` e
re-busca. Trate `{ empty: true }` mostrando "Produção aguardando go-live".

**4. Telas (sugestão de chamadas):**
- *Home:* `api("/overview")` → KPIs HL+DeFi + breaker + regime numa request.
- *Aba HyperLiquid:* `api("/hl/kpis")`, `api("/hl/wallets")`, `api("/hl/agents")`, `api("/hl/pnl-by-symbol")`, `api("/hl/positions")`. Tooltips via `api("/meta/agents")` (cacheável).
- *Aba DeFi:* `api("/defi/kpis")`, `api("/defi/positions")`, `api("/defi/diversification")` (donut), `api("/defi/suggestions")`.
- *Aba Lab:* `api("/lab/lateral")`.

**5. Polling** — `setInterval(refresh, 30000)`; pare quando a aba estiver oculta
(`document.hidden`). Sem websocket (read-only).

**6. Cache leve** — `/meta/*` muda raramente (cache em memória/localStorage).
KPIs/posições: sempre fresco.

**7. Estados** — sempre tratar loading / vazio (`empty`) / erro (401/500). Nunca
tela branca. Os contratos acima são estáveis (versão `v1`); mudanças quebráveis
virão como `v2`.

**8. Segurança do deploy** — localhost hoje. Pro front remoto: túnel + key (e,
opcional, o NFT-gate de `ACESSO-REMOTO-NFT-GATED.md`). A API é read-only, então o
pior caso de vazamento da key é leitura de métricas — ainda assim, rotacione a
key (`PANEL_API_KEY` no `.env.secrets`) se exposta.

---

## Resumo de arquivos
- `agents-platform/src/agents_platform/api/__init__.py` — router puro (`dispatch`) + auth + rotas.
- `agents-platform/src/agents_platform/api/server.py` — HTTP server (stdlib) + CORS.
- `agents-platform/src/agents_platform/panel/__init__.py` — agregações (HL/DeFi/posições/regime/breaker).
- CLI: `panel-api-serve` · `painel-hl` · `painel-defi` (estes 2 também servem o painel embutido).
- Testes: `tests/unit/api/test_panel_api.py` (16) — roteamento + auth + env.
