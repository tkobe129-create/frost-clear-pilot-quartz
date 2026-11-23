import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { computeAlerts } from "./alerts.ts";
import { missingDatabaseFunctionsFromOpenApi, REQUIRED_DATABASE_FUNCTIONS } from "./db-contract.ts";
import { inboundRaisedStockAboveSafety, isBelowSafetyStock, lockedRestockReagentIds, splitRestockCandidates } from "./restock.ts";
import { fieldsFromSegments, parseBarcode } from "./scanner.ts";
import { chooseFefoBatch } from "./stock-batches.ts";
import type { Reagent, StockBatch } from "./types.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));

function reagent(partial: Partial<Reagent> & Pick<Reagent, "id" | "name">): Reagent {
  return {
    code: "",
    category: "其他",
    specification: "",
    manufacturer: "",
    unit: "瓶",
    stockQuantity: 0,
    minStock: 0,
    storageCondition: "",
    location: "",
    expiryDate: "",
    registrationNumber: "",
    notes: "",
    scanRule: "",
    scanSegments: [],
    lotNumber: "",
    productionDate: "",
    rawBarcode: "",
    supplier: "",
    unitPrice: 0,
    createdAt: "",
    ...partial,
  };
}

function localDate(daysFromToday: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

test("safety stock alerts at equality, and ignores reagents with no safety stock", () => {
  const equal = reagent({ id: 1, name: "洗手液", stockQuantity: 2, minStock: 2 });
  const above = reagent({ id: 2, name: "充足", stockQuantity: 3, minStock: 2 });
  const unset = reagent({ id: 3, name: "未设", stockQuantity: 0, minStock: 0 });
  assert.equal(isBelowSafetyStock(equal), true);
  assert.equal(isBelowSafetyStock(above), false);
  assert.equal(isBelowSafetyStock(unset), false);

  const alerts = computeAlerts([equal, above, unset]);
  assert.deepEqual(
    alerts.map((alert) => [alert.reagent.name, alert.kind]),
    [
      ["未设", "stockout"],
      ["洗手液", "low"],
    ],
  );
});

test("expiry and low stock stay separate alerts", () => {
  const item = reagent({
    id: 1,
    name: "近效期低库存",
    stockQuantity: 1,
    minStock: 2,
    expiryDate: localDate(10),
  });
  const kinds = computeAlerts([item]).map((alert) => alert.kind);
  assert.deepEqual(kinds, ["expiring", "low"]);
});

test("an unfinished order blocks until an inbound makes replayed stock strictly greater than safety stock", () => {
  const item = reagent({ id: 7, name: "试剂", minStock: 5, stockQuantity: 1 });
  const order = { reagentId: 7, orderedAt: "2026-01-15T00:00:00Z", orderId: 3, status: "submitted" as const };
  const before = [{ id: 1, reagentId: 7, type: "in" as const, quantity: 2, createdAt: "2026-01-01T00:00:00Z" }];
  assert.equal(inboundRaisedStockAboveSafety(5, order.orderedAt, before), false);
  assert.deepEqual(lockedRestockReagentIds([item], [order], before), [7]);

  const equal = [
    ...before,
    { id: 2, reagentId: 7, type: "in" as const, quantity: 3, createdAt: "2026-02-01T00:00:00Z" },
  ];
  assert.equal(inboundRaisedStockAboveSafety(5, order.orderedAt, equal), false);

  const above = [
    ...before,
    { id: 2, reagentId: 7, type: "in" as const, quantity: 4, createdAt: "2026-02-01T00:00:00Z" },
  ];
  assert.equal(inboundRaisedStockAboveSafety(5, order.orderedAt, above), true);
  assert.deepEqual(lockedRestockReagentIds([item], [order], above), []);

  const droppedAgain = [
    ...above,
    { id: 3, reagentId: 7, type: "out" as const, quantity: 5, createdAt: "2026-03-01T00:00:00Z" },
  ];
  assert.equal(inboundRaisedStockAboveSafety(5, order.orderedAt, droppedAgain), true);
  assert.deepEqual(lockedRestockReagentIds([item], [order], droppedAgain), []);
});

test("only the latest submitted order can block a later restock", () => {
  const item = reagent({ id: 7, name: "试剂", minStock: 5, stockQuantity: 1 });
  const ledger = [
    { id: 1, reagentId: 7, type: "in" as const, quantity: 2, createdAt: "2026-01-01T00:00:00Z" },
    { id: 2, reagentId: 7, type: "in" as const, quantity: 6, createdAt: "2026-02-01T00:00:00Z" },
  ];
  const released = { reagentId: 7, orderedAt: "2026-01-15T00:00:00Z", orderId: 1, status: "submitted" as const };
  const later = { reagentId: 7, orderedAt: "2026-04-01T00:00:00Z", orderId: 2, status: "submitted" as const };
  assert.deepEqual(lockedRestockReagentIds([item], [released, later], ledger), [7]);
  assert.deepEqual(
    lockedRestockReagentIds([item], [{ ...later, status: "cancelled" }], ledger),
    [],
  );
});

test("restock candidates exclude reagents already locked and reagents without a safety stock", () => {
  const low = reagent({ id: 1, name: "低", stockQuantity: 1, minStock: 2 });
  const locked = reagent({ id: 2, name: "已下单", stockQuantity: 1, minStock: 2 });
  const unset = reagent({ id: 3, name: "未设", stockQuantity: 0, minStock: 0 });
  const split = splitRestockCandidates([low, locked, unset], [2]);
  assert.deepEqual(split.orderable.map((item) => item.id), [1]);
  assert.deepEqual(split.alreadyOrdered.map((item) => item.id), [2]);
});

test("a GS1 barcode keeps lot and expiry apart from a plain product code", () => {
  const fields = fieldsFromSegments(parseBarcode("(01)06901234567890(17)261231(10)LOT1"));
  assert.equal(fields.gtin, "06901234567890");
  assert.equal(fields.lotNumber, "LOT1");
  assert.equal(fields.expiryDateFormatted, "2026-12-31");

  const plain = fieldsFromSegments(parseBarcode("6901234567890"));
  assert.equal(plain.gtin, "6901234567890");
  assert.equal(plain.lotNumber, undefined);
  assert.equal(plain.expiryDate, undefined);
});

test("outbound FEFO chooses the earliest remaining batch and skips a reserved one", () => {
  const item = reagent({ id: 4, name: "批次试剂" });
  const batches: StockBatch[] = [
    { reagentId: 4, lotNumber: "L2", expiryDate: "2027-02-01", productionDate: "", quantity: 1 },
    { reagentId: 4, lotNumber: "L1", expiryDate: "2026-12-01", productionDate: "", quantity: 1 },
  ];
  assert.equal(chooseFefoBatch(item, batches, [])?.lotNumber, "L1");
  const reserved = chooseFefoBatch(item, batches, [
    {
      key: "1",
      reagentId: 4,
      reagentName: item.name,
      unit: "瓶",
      quantity: 1,
      lotNumber: "L1",
      expiryDate: "2026-12-01",
      productionDate: "",
      note: "",
      stockQuantity: 2,
    },
  ]);
  assert.equal(reserved?.lotNumber, "L2");
});

test("a database document is missing a patch only when an older function is visible and the new one is not", () => {
  assert.deepEqual(missingDatabaseFunctionsFromOpenApi(""), []);
  assert.deepEqual(missingDatabaseFunctionsFromOpenApi('{"paths":{"/rpc/save_reagent":{}}}'), [
    "删除试剂及库存",
    "补货自动解锁",
  ]);
  assert.deepEqual(
    missingDatabaseFunctionsFromOpenApi('{"paths":{"/rpc/save_reagent":{},"/rpc/delete_reagent":{},"/rpc/create_restock_order_auto":{}}}'),
    [],
  );
});

test("the copied SQL patches install the functions and quantity rule the page depends on", () => {
  const init = readFileSync(`${root}supabase/init.sql`, "utf8");
  const auto = readFileSync(`${root}supabase/patch-auto-release-restock.sql`, "utf8");
  const deletion = readFileSync(`${root}supabase/patch-delete-reagent.sql`, "utf8");
  const formula = "greatest(reagent_row.min_stock * 2 - reagent_row.stock_quantity, 1)";
  assert.match(init, new RegExp(formula.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(auto, new RegExp(formula.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const item of REQUIRED_DATABASE_FUNCTIONS) {
    const source = item.name === "delete_reagent" ? deletion : auto;
    assert.match(source, new RegExp(`function public\\.${item.name}\\(`));
    assert.match(init, new RegExp(`function public\\.${item.name}\\(`));
  }
});
