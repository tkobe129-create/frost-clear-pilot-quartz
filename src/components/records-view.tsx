import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatWhen } from "@/lib/alerts";
import type { StockRecord, StockType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecordsView({ records }: { records: StockRecord[] }) {
  const [filter, setFilter] = useState<"all" | StockType>("all");
  const list = useMemo(
    () => (filter === "all" ? records : records.filter((r) => r.type === filter)),
    [filter, records],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 rounded-lg bg-bg-elevated p-1">
        {(
          [
            ["all", "全部"],
            ["in", "入库"],
            ["out", "出库"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "h-11 rounded-md text-sm font-medium sm:h-10",
              filter === id ? "bg-surface text-fg shadow-card" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">暂无出入库记录</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {list.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-surface px-3 py-3 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.reagentName}</p>
                  <p className="mt-0.5 text-xs text-subtle">
                    {formatWhen(r.createdAt)} · {r.operator || "检验员"} · {r.department || "检验科"}
                  </p>
                </div>
                <Badge variant={r.type === "in" ? "ok" : "out"}>
                  {r.type === "in" ? "入库" : "出库"} {r.type === "in" ? "+" : "−"}
                  {r.quantity}
                </Badge>
              </div>
              <p className="mt-2 break-words text-xs text-muted">
                批号 {r.lotNumber || "—"} · 效期 {r.expiryDate || "—"}
                {r.note ? ` · ${r.note}` : ""}
                {r.reason ? ` · ${r.reason}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
