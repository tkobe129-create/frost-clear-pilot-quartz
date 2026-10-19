import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatWhen } from "@/lib/alerts";
import type { StockRecord, StockType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecordsView({
  records,
  onExport,
}: {
  records: StockRecord[];
  onExport: (filter: "all" | StockType) => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | StockType>("all");
  const [exporting, setExporting] = useState(false);
  const list = useMemo(
    () => (filter === "all" ? records : records.filter((r) => r.type === filter)),
    [filter, records],
  );

  async function exportRecords() {
    if (exporting) return;
    setExporting(true);
    try {
      await onExport(filter);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="grid min-w-0 flex-1 grid-cols-3 rounded-lg bg-bg-elevated p-1">
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
        <Button
          variant="outline"
          className="h-11 shrink-0 sm:h-10"
          disabled={exporting}
          onClick={() => void exportRecords()}
        >
          <Download className="size-4" />
          {exporting ? "导出中…" : "导出 Excel"}
        </Button>
      </div>
      <p className="text-xs leading-5 text-muted">
        {records.length >= 200 ? "列表只显示最近 200 条。" : "列表为最近记录。"}
        导出为 Excel 表格（.xlsx）。请重新下载后再打开，不要打开以前那个显示代码的文件。
      </p>
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
