import type { PendingItem, Reagent, StockRecord } from "@/lib/types";

export type AvailableBatch = {
  lotNumber: string;
  expiryDate: string;
  productionDate: string;
  quantity: number;
};

function batchKey(lotNumber: string, expiryDate: string, productionDate: string): string {
  return `${lotNumber}\u001f${expiryDate}\u001f${productionDate}`;
}

/**
 * Reconstructs the currently available quantity for each batch from the stock
 * ledger. The reagent row remains the source of truth for the aggregate stock;
 * the residual is assigned to its current/default batch so opening balances are
 * not lost when older ledger rows are unavailable.
 */
export function getAvailableBatches(reagent: Reagent, records: StockRecord[]): AvailableBatch[] {
  const balances = new Map<string, AvailableBatch>();
  let knownNet = 0;

  for (const record of records) {
    if (record.reagentId !== reagent.id || !record.lotNumber && !record.expiryDate) continue;
    const key = batchKey(record.lotNumber, record.expiryDate, record.productionDate);
    const batch = balances.get(key) ?? {
      lotNumber: record.lotNumber,
      expiryDate: record.expiryDate,
      productionDate: record.productionDate,
      quantity: 0,
    };
    batch.quantity += record.type === "in" ? record.quantity : -record.quantity;
    knownNet += record.type === "in" ? record.quantity : -record.quantity;
    balances.set(key, batch);
  }

  const defaultKey = batchKey(reagent.lotNumber, reagent.expiryDate, reagent.productionDate);
  const residual = reagent.stockQuantity - knownNet;
  const defaultBatch = balances.get(defaultKey) ?? {
    lotNumber: reagent.lotNumber,
    expiryDate: reagent.expiryDate,
    productionDate: reagent.productionDate,
    quantity: 0,
  };
  defaultBatch.quantity += residual;
  balances.set(defaultKey, defaultBatch);

  return [...balances.values()]
    .filter((batch) => batch.quantity > 0)
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });
}

export function chooseFefoBatch(
  reagent: Reagent,
  records: StockRecord[],
  pending: PendingItem[],
): AvailableBatch | null {
  const batches = getAvailableBatches(reagent, records);
  const reserved = new Map<string, number>();
  for (const item of pending) {
    if (item.reagentId !== reagent.id) continue;
    const key = batchKey(item.lotNumber, item.expiryDate, item.productionDate);
    reserved.set(key, (reserved.get(key) ?? 0) + item.quantity);
  }

  return (
    batches.find((batch) => {
      const key = batchKey(batch.lotNumber, batch.expiryDate, batch.productionDate);
      return batch.quantity - (reserved.get(key) ?? 0) > 0;
    }) ?? null
  );
}
