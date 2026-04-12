import { createClient } from "@supabase/supabase-js";
import { getConfig } from "./config.js";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (client) return client;

  const config = getConfig();
  client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  return client;
}
