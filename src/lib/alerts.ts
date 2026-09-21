import { daysUntil } from "@/lib/scanner";
import type { Reagent, ReagentAlert } from "@/lib/types";

const KIND_ORDER: Record<ReagentAlert["kind"], number> = {
  expired: 0,
  stockout: 1,
  expiring: 2,
  low: 3,
};

export function computeAlerts(reagents: Reagent[]): ReagentAlert[] {
  const out: ReagentAlert[] = [];
  for (const r of reagents) {
    const days = daysUntil(r.expiryDate);
    if (days !== null && days < 0) {
      out.push({ reagent: r, kind: "expired", detail: `已过期 ${Math.abs(days)} 天` });
    } else if (days !== null && days <= 30) {
      out.push({ reagent: r, kind: "expiring", detail: `${days} 天后到期` });
    }
    if (r.stockQuantity <= 0) {
      out.push({ reagent: r, kind: "stockout", detail: "库存为 0" });
    } else if (r.minStock > 0 && r.stockQuantity <= r.minStock) {
      out.push({ reagent: r, kind: "low", detail: `库存 ${r.stockQuantity} / 安全 ${r.minStock}` });
    }
  }
  return out.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.reagent.name.localeCompare(b.reagent.name, "zh"));
}

export function formatWhen(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function orderText(order: {
  id: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; unit: string; manufacturer: string; specification: string; supplier: string }>;
}): string {
  const date = formatWhen(order.createdAt);
  const lines = [
    `权盾智检 补货单 #${order.id}`,
    `时间 ${date}`,
    "--------------------------------",
    ...order.items.map(
      (i) =>
        `${i.name}  ×${i.quantity} ${i.unit}` +
        (i.specification ? `  ${i.specification}` : "") +
        (i.manufacturer ? `  ${i.manufacturer}` : "") +
        (i.supplier ? `  [${i.supplier}]` : ""),
    ),
    "--------------------------------",
    `共 ${order.items.length} 项，请按此清单采购。`,
  ];
  return lines.join("\n");
}
