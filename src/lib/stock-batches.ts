import type { PendingItem, Reagent, StockBatch, StockRecord } from "@/lib/types";

export type AvailableBatch = Omit<StockBatch, "reagentId">;

function batchKey(lotNumber: string, expiryDate: string, productionDate: string): string {
  return `${lotNumber}\u001f${expiryDate}\u001f${productionDate}`;
}

/** Compatibility fallback for an existing project before the batch-summary SQL patch is applied. */
export function reconstructAvailableBatches(reagent: Reagent, records: StockRecord[]): StockBatch[] {
  const balances = new Map<string, AvailableBatch>();
  let knownNet = 0;

  for (const record of records) {
    if (record.reagentId !== reagent.id || (!record.lotNumber && !record.expiryDate)) continue;
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
    .map((batch) => ({ ...batch, reagentId: reagent.id }));
}

export function getAvailableBatches(reagent: Reagent, stockBatches: StockBatch[]): AvailableBatch[] {
  return stockBatches
    .filter((batch) => batch.reagentId === reagent.id && batch.quantity > 0)
    .map(({ lotNumber, expiryDate, productionDate, quantity }) => ({ lotNumber, expiryDate, productionDate, quantity }))
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });
}

export function chooseFefoBatch(
  reagent: Reagent,
  stockBatches: StockBatch[],
  pending: PendingItem[],
): AvailableBatch | null {
  const batches = getAvailableBatches(reagent, stockBatches);
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
