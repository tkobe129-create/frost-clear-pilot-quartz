import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eqgrtoeivuykemfferwb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ3J0b2VpdnV5a2VtZmZlcndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1Njc0OTQsImV4cCI6MjEwNTE0MzQ5NH0.Jttf6wm6RVj2knEagvw3Y-wFrKTl5I5RvF4pVUqHVRA";

let client: SupabaseClient | null = null;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, signal: AbortSignal.timeout(8000) });
}

export function getSupabase(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("Supabase client is server-only");
  }
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout },
  });
  return client;
}

export function throwIfError(error: { message: string } | null, fallback = "数据库操作失败") {
  if (!error) return;
  const message = error.message.replace(/^[A-Z0-9]+:\s*/, "").trim();
  throw new Error(message || fallback);
}
