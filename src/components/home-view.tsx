import { Check, ClipboardCopy, PackagePlus, Truck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeAlerts, formatWhen, orderText } from "@/lib/alerts";
import type { PurchaseOrder, Reagent, ReagentAlert, StockRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  reagents: Reagent[];
  records: StockRecord[];
  orders: PurchaseOrder[];
  ordering: boolean;
  receivingId: number | null;
  onOrder: () => void;
  onReceive: (id: number) => void;
  onGoScan: () => void;
  onGoReagents: () => void;
};

const KIND_BADGE: Record<ReagentAlert["kind"], { label: string; variant: "danger" | "warn" | "out" | "default" }> = {
  expired: { label: "已过期", variant: "danger" },
  stockout: { label: "缺货", variant: "out" },
  expiring: { label: "近效期", variant: "warn" },
  low: { label: "低库存", variant: "warn" },
};

export function HomeView({
  reagents,
  records,
  orders,
  ordering,
  receivingId,
  onOrder,
  onReceive,
  onGoScan,
  onGoReagents,
}: Props) {
  const alerts = computeAlerts(reagents);
  const lowCount = reagents.filter((r) => r.minStock > 0 && r.stockQuantity <= r.minStock).length;
  const totalStock = reagents.reduce((s, r) => s + r.stockQuantity, 0);
  const latestOrder = orders[0];

  async function copyOrder(order: PurchaseOrder) {
    try {
      await navigator.clipboard.writeText(orderText(order));
      toast.success("补货单已复制，可发给供应商");
    } catch {
      toast.error("复制失败，请手动摘录清单");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-primary px-4 py-4 text-primary-fg shadow-card sm:px-5">
        <p className="text-xs text-primary-fg/70">今日库存态势</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-3xl font-semibold tabular tracking-tight">{alerts.length}</p>
            <p className="mt-1 text-sm text-primary-fg/75">条预警待处理</p>
          </div>
          <Button
            onClick={onOrder}
            disabled={ordering || lowCount === 0}
            className="h-11 w-full bg-surface text-primary hover:bg-bg-elevated disabled:bg-surface/50 sm:w-auto"
          >
            <PackagePlus className="size-4" />
            {ordering ? "生成中…" : "一键下单"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-primary-fg/65">
          {lowCount > 0 ? `将按安全库存为 ${lowCount} 项缺货试剂生成采购单` : "暂无低于安全库存的试剂"}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <Stat label="试剂种类" value={reagents.length} onClick={onGoReagents} />
        <Stat label="在库数量" value={totalStock} />
        <Stat label="本月单据" value={records.length} />
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">预警</h2>
            <span className="text-xs text-subtle">{alerts.length} 项</span>
          </div>
          {alerts.length === 0 ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted">
              <Check className="size-4 text-ok" />
              库存与效期均正常
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alerts.map((a) => {
                const meta = KIND_BADGE[a.kind];
                return (
                  <li
                    key={`${a.kind}-${a.reagent.id}`}
                    className="flex items-start justify-between gap-3 rounded-lg bg-bg-elevated px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.reagent.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{a.detail}</p>
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-4">
          {latestOrder ? (
            <section className="rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">最近采购单</h2>
                <span className="text-xs text-subtle">#{latestOrder.id}</span>
              </div>
              <OrderCard
                order={latestOrder}
                busy={receivingId === latestOrder.id}
                onCopy={() => copyOrder(latestOrder)}
                onReceive={() => onReceive(latestOrder.id)}
              />
              {orders.length > 1 ? (
                <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                  {orders.slice(1, 4).map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate text-muted">
                        #{o.id} · {o.itemCount} 项 · {formatWhen(o.createdAt)}
                      </span>
                      <StatusPill status={o.status} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">最近出入库</h2>
              <button type="button" onClick={onGoScan} className="h-11 px-2 text-xs font-medium text-primary">
                去扫码
              </button>
            </div>
            {records.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">暂无记录，扫码即可入库或出库</p>
            ) : (
              <ul className="flex flex-col">
                {records.slice(0, 6).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 border-b border-border/70 py-2.5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{r.reagentName}</p>
                      <p className="text-xs text-subtle">
                        {formatWhen(r.createdAt)} · {r.lotNumber || "无批号"}
                      </p>
                    </div>
                    <span className={cn("shrink-0 text-sm font-medium tabular", r.type === "in" ? "text-ok" : "text-out")}>
                      {r.type === "in" ? "+" : "−"}
                      {r.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="min-w-0 rounded-lg border border-border bg-surface px-2 py-3 text-left shadow-card sm:px-3"
    >
      <p className="truncate text-xs text-subtle">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular tracking-tight">{value}</p>
    </Comp>
  );
}

function StatusPill({ status }: { status: PurchaseOrder["status"] }) {
  if (status === "received") return <Badge variant="ok">已入库</Badge>;
  if (status === "cancelled") return <Badge variant="muted">已取消</Badge>;
  return <Badge>待收货</Badge>;
}

function OrderCard({
  order,
  busy,
  onCopy,
  onReceive,
}: {
  order: PurchaseOrder;
  busy: boolean;
  onCopy: () => void;
  onReceive: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Truck className="size-3.5" />
        {formatWhen(order.createdAt)} · {order.itemCount} 项
        <StatusPill status={order.status} />
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{i.name}</span>
            <span className="shrink-0 tabular text-muted">
              ×{i.quantity} {i.unit}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" size="sm" className="h-11 flex-1 sm:h-9" onClick={onCopy}>
          <ClipboardCopy className="size-3.5" />
          复制清单
        </Button>
        {order.status === "submitted" ? (
          <Button size="sm" className="h-11 flex-1 sm:h-9" disabled={busy} onClick={onReceive}>
            {busy ? "入库中…" : "确认到货入库"}
          </Button>
        ) : (
          <span className="flex h-11 flex-1 items-center justify-center gap-1 text-xs text-ok sm:h-9">
            <Check className="size-3.5" />
            已计入库存
          </span>
        )}
      </div>
    </div>
  );
}
