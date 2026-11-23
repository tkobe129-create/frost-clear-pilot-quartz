import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATION_NAME = /^[0-9]{8,}_[a-z0-9_]+\.sql$/;

export function pendingMigrations(files, applied) {
  const done = applied instanceof Set ? applied : new Set(applied);
  return files.filter((name) => MIGRATION_NAME.test(name) && !done.has(name)).sort();
}

export function assertMigrationUrl(url) {
  if (!url || !url.startsWith("postgres")) {
    throw new Error("SUPABASE_DB_URL must be a postgres connection string");
  }
  if (url.includes(":6543")) {
    throw new Error("Use the session pooler on port 5432. Port 6543 cannot apply migrations.");
  }
  return url.includes("sslmode=") ? url : `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
}

function quoteLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function defaultRun(url, args) {
  const result = spawnSync("psql", [url, "-v", "ON_ERROR_STOP=1", ...args], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = `${result.stderr || ""}${result.stdout || ""}`.replaceAll(url, "[redacted]").trim();
    throw new Error(detail || "psql failed");
  }
  return (result.stdout || "").trim();
}

export function applyMigrations({ url, dir, files, run = defaultRun }) {
  const safeUrl = assertMigrationUrl(url);
  run(safeUrl, [
    "-c",
    `create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )`,
  ]);
  const appliedRaw = run(safeUrl, ["-tA", "-c", "select version from public.schema_migrations"]);
  const applied = new Set(
    appliedRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );
  const pending = pendingMigrations(files, applied);
  for (const name of pending) {
    run(safeUrl, ["-1", "-f", join(dir, name)]);
    run(safeUrl, ["-c", `insert into public.schema_migrations(version) values (${quoteLiteral(name)})`]);
  }
  return pending;
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error("SUPABASE_DB_URL is required");
    process.exit(1);
  }
  const dir = join(dirname(fileURLToPath(import.meta.url)), "../supabase/migrations");
  const applied = applyMigrations({ url, dir, files: readdirSync(dir) });
  console.log(applied.length === 0 ? "database already current" : `applied ${applied.join(", ")}`);
}
