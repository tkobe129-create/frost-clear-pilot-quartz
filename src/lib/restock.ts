import type { Reagent } from "@/lib/types";

export function isBelowSafetyStock(reagent: Reagent): boolean {
  return reagent.minStock > 0 && reagent.stockQuantity <= reagent.minStock;
}

/** Reagents already on an unclosed purchase order must not be ordered again. */
export function splitRestockCandidates(reagents: Reagent[], openReagentIds: Iterable<number>) {
  const open = new Set(openReagentIds);
  const low = reagents.filter(isBelowSafetyStock);
  const alreadyOrdered = low.filter((reagent) => open.has(reagent.id));
  const orderable = low.filter((reagent) => !open.has(reagent.id));
  return { low, alreadyOrdered, orderable };
}

export type RestockLedgerRow = {
  reagentId: number;
  type: "in" | "out";
  quantity: number;
  createdAt: string;
  id: number;
};

export type RestockOrderLine = {
  reagentId: number;
  orderedAt: string;
  orderId: number;
  status: "submitted" | "received" | "cancelled";
};

/**
 * True when an inbound after the order pushed stock strictly above safety stock.
 * A later drop below safety stock does not turn this back to false.
 */
export function inboundRaisedStockAboveSafety(
  minStock: number,
  orderedAt: string,
  ledger: RestockLedgerRow[],
): boolean {
  const orderTime = Date.parse(orderedAt);
  if (!Number.isFinite(orderTime) || minStock <= 0) return false;
  const ordered = [...ledger].sort((a, b) => {
    const time = Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (time !== 0 && Number.isFinite(time)) return time;
    return a.id - b.id;
  });
  let quantity = 0;
  let seenInbound = false;
  for (const row of ordered) {
    const at = Date.parse(row.createdAt);
    if (!Number.isFinite(at)) continue;
    const delta = row.type === "in" ? row.quantity : -row.quantity;
    if (at <= orderTime) {
      quantity += delta;
      continue;
    }
    if (row.type === "in") seenInbound = true;
    quantity += delta;
    if (seenInbound && quantity > minStock) return true;
  }
  return false;
}

/** Latest unclosed order still blocks until an inbound has lifted stock above safety. */
export function lockedRestockReagentIds(
  reagents: Reagent[],
  orders: RestockOrderLine[],
  ledger: RestockLedgerRow[],
): number[] {
  const minById = new Map(reagents.map((reagent) => [reagent.id, reagent.minStock]));
  const latest = new Map<number, RestockOrderLine>();
  for (const line of orders) {
    if (line.status !== "submitted") continue;
    const prev = latest.get(line.reagentId);
    if (!prev) {
      latest.set(line.reagentId, line);
      continue;
    }
    const prevTime = Date.parse(prev.orderedAt);
    const nextTime = Date.parse(line.orderedAt);
    if (nextTime > prevTime || (nextTime === prevTime && line.orderId > prev.orderId)) {
      latest.set(line.reagentId, line);
    }
  }
  const byReagent = new Map<number, RestockLedgerRow[]>();
  for (const row of ledger) {
    const list = byReagent.get(row.reagentId) ?? [];
    list.push(row);
    byReagent.set(row.reagentId, list);
  }
  const locked: number[] = [];
  for (const [reagentId, line] of latest) {
    const minStock = minById.get(reagentId) ?? 0;
    if (minStock <= 0) continue;
    if (!inboundRaisedStockAboveSafety(minStock, line.orderedAt, byReagent.get(reagentId) ?? [])) {
      locked.push(reagentId);
    }
  }
  return locked;
}
