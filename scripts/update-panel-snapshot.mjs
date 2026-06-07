import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(__dirname);

const CLOSED_TRADES_LIMIT = Number(process.env.PANEL_CLOSED_LIMIT || "80");
const API_BASE = (process.env.PANEL_API_BASE || process.env.VITE_PANEL_API_BASE || "http://127.0.0.1:8765").replace(
  /\/+$/,
  ""
);
const ENVS = (process.env.PANEL_API_ENVS || "testnet,prod")
  .split(",")
  .map((env) => env.trim())
  .filter(Boolean);

function readKeyFromSecrets() {
  const path = join(homedir(), "openclaw", ".env.secrets");
  if (!existsSync(path)) return "";
  const content = readFileSync(path, "utf8");
  const line = content.split(/\r?\n/).find((entry) => entry.startsWith("PANEL_API_KEY="));
  return line?.split("=").slice(1).join("=").trim() ?? "";
}

const API_KEY = process.env.PANEL_API_KEY || process.env.VITE_PANEL_API_KEY || readKeyFromSecrets();

if (!API_KEY) {
  console.error("PANEL_API_KEY ausente. Defina PANEL_API_KEY ou mantenha ~/openclaw/.env.secrets atualizado.");
  process.exit(1);
}

async function api(path, env, params = {}) {
  const url = new URL(`${API_BASE}/api/v1${path}`);
  url.searchParams.set("env", env);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { "X-API-Key": API_KEY },
  });
  if (!response.ok) throw new Error(`Panel API ${response.status} em ${path}`);
  return response.json();
}

async function catalog() {
  const response = await fetch(`${API_BASE}/api/v1`);
  if (!response.ok) throw new Error(`Panel API catalog ${response.status}`);
  return response.json();
}

async function endpoint(key, request) {
  try {
    return [key, { data: await request }];
  } catch (error) {
    return [key, { error: error instanceof Error ? error.message : String(error) }];
  }
}

async function bundleForEnv(env) {
  const entries = await Promise.all([
    endpoint("catalog", catalog()),
    endpoint("overview", api("/overview", env)),
    endpoint("hl", api("/hl/summary", env)),
    endpoint("hlPositions", api("/hl/positions", env)),
    endpoint("hlClosed", api("/hl/closed", env, { limit: CLOSED_TRADES_LIMIT })),
    endpoint("defi", api("/defi/summary", env)),
    endpoint("lab", api("/lab/lateral", env)),
    endpoint("readiness", api("/readiness", env)),
    endpoint("metaAgents", api("/meta/agents", env)),
    endpoint("metaWallets", api("/meta/wallets", env)),
  ]);

  const bundle = {
    schemaVersion: 1,
    env,
    capturedAt: new Date().toISOString(),
  };
  const endpointErrors = {};

  for (const [key, result] of entries) {
    if ("data" in result) {
      bundle[key] = result.data;
    } else {
      endpointErrors[key] = result.error;
      bundle[key] = null;
    }
  }

  if (Object.keys(endpointErrors).length) bundle.endpointErrors = endpointErrors;
  if (!bundle.overview && !bundle.hl && !bundle.defi) {
    throw new Error(`Nenhum dado core retornado para env=${env}`);
  }
  return bundle;
}

const bundles = {};
for (const env of ENVS) {
  console.log(`Atualizando snapshot Panel API env=${env} em ${API_BASE}`);
  bundles[env] = await bundleForEnv(env);
}

const snapshot = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: API_BASE,
  bundles,
};

const outputPath = join(repoRoot, "public", "panel-snapshot.json");
mkdirSync(dirname(outputPath), { recursive: true });
const payload = `${JSON.stringify(snapshot, null, 2)}\n`;
writeFileSync(outputPath, payload, "utf8");
console.log(`Snapshot salvo em ${outputPath}`);

// Upload opcional para Supabase Storage (bucket "panel"): mantém o site
// publicado lendo dados novos sem rebuild. Requer VITE_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY no ambiente (.env) e o bucket criado.
function readEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envPath = join(repoRoot, ".env");
  if (!existsSync(envPath)) return "";
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`));
  return line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") ?? "";
}

const supabaseUrl = readEnvVar("VITE_SUPABASE_URL").replace(/\/+$/, "");
const serviceKey = readEnvVar("SUPABASE_SERVICE_ROLE_KEY");

if (supabaseUrl && serviceKey) {
  try {
    const uploadUrl = `${supabaseUrl}/storage/v1/object/panel/panel-snapshot.json`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
        "cache-control": "max-age=60",
      },
      body: payload,
    });
    if (response.ok) {
      console.log(`Snapshot publicado em ${supabaseUrl}/storage/v1/object/public/panel/panel-snapshot.json`);
    } else {
      console.warn(`Upload Supabase falhou (${response.status}): ${await response.text()}`);
    }
  } catch (error) {
    console.warn(`Upload Supabase indisponivel: ${error instanceof Error ? error.message : error}`);
  }
} else {
  console.log("Upload Supabase pulado (sem VITE_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).");
}
// Alternativa sem Supabase: o snapshot commitado no repo publico ja serve de
// remoto via raw.githubusercontent.com (CORS *), usado em VITE_PANEL_SNAPSHOT_URL.
