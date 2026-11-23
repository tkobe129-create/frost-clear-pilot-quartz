import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { applyMigrations, assertMigrationUrl, pendingMigrations } from "./apply-db-migrations.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("pending migrations run in order and ignore files that are not migrations", () => {
  const pending = pendingMigrations(
    ["20261023120100_delete_reagent.sql", "notes.txt", "20261023120000_auto_release_restock.sql"],
    new Set(),
  );
  assert.deepEqual(pending, [
    "20261023120000_auto_release_restock.sql",
    "20261023120100_delete_reagent.sql",
  ]);
});

test("an already recorded migration is not applied again", () => {
  const calls = [];
  const applied = applyMigrations({
    url: "postgresql://example.supabase.co:5432/postgres",
    dir: "/migrations",
    files: ["20261023120000_auto_release_restock.sql", "20261023120100_delete_reagent.sql"],
    run(_url, args) {
      calls.push(args);
      if (args[0] === "-tA") return "20261023120000_auto_release_restock.sql\n";
      return "";
    },
  });
  assert.deepEqual(applied, ["20261023120100_delete_reagent.sql"]);
  assert.equal(calls.filter((args) => args[0] === "-1").length, 1);
  assert.match(calls.at(-1)[1], /20261023120100_delete_reagent\.sql/);
});

test("the transaction pooler is refused because it cannot apply migrations", () => {
  assert.throws(() => assertMigrationUrl("postgresql://example.supabase.co:6543/postgres"), /5432/);
});

test("checked-in migrations install delete and auto-release without dropping data", () => {
  const dir = join(root, "supabase/migrations");
  const files = readdirSync(dir).filter((name) => name.endsWith(".sql"));
  const sql = files.map((name) => readFileSync(join(dir, name), "utf8")).join("\n");
  assert.match(sql, /function public\.delete_reagent\(/);
  assert.match(sql, /function public\.create_restock_order_auto\(/);
  assert.match(sql, /greatest\(reagent_row\.min_stock \* 2 - reagent_row\.stock_quantity, 1\)/);
  assert.doesNotMatch(sql, /drop table/i);
  assert.doesNotMatch(sql, /drop schema/i);
});
