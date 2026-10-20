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
