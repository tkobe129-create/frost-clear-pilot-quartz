import { useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatWhen } from "@/lib/alerts";
import { saveStockRecordsExcel } from "@/lib/export-excel";
import type { StockRecord, StockType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecordsView({
  records,
  onExport,
}: {
  records: StockRecord[];
  onExport: (filter: "all" | StockType) => Promise<StockRecord[]>;
}) {
  const [filter, setFilter] = useState<"all" | StockType>("all");
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<StockRecord[] | null>(null);
  const list = useMemo(
    () => (filter === "all" ? records : records.filter((r) => r.type === filter)),
    [filter, records],
  );

  async function exportRecords() {
    if (exporting) return;
    setExporting(true);
    try {
      const rows = await onExport(filter);
      if (rows.length === 0) {
        toast.error("当前筛选没有可导出的记录");
        return;
      }
      setPreview([...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导出失败，请稍后重试");
    } finally {
      setExporting(false);
    }
  }

  async function savePreview() {
    if (!preview || saving) return;
    setSaving(true);
    try {
      const result = await saveStockRecordsExcel(preview, filter);
      if (result === "cancelled") return;
      toast.success(result === "shared" ? "请在分享菜单中存储到文件" : `已导出 ${preview.length} 条记录`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败，请重试");
    } finally {
      setSaving(false);
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
        点导出先查看全部流水，再点「保存 Excel」。手机上会弹出系统分享，选存储到文件。
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
      {preview ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-bg">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="min-w-0">
              <p className="text-sm font-semibold">导出预览</p>
              <p className="text-xs text-muted">共 {preview.length} 条，可左右滑动查看</p>
            </div>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-md text-muted"
              aria-label="关闭预览"
              onClick={() => setPreview(null)}
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
            <table className="w-max min-w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-bg">
                <tr className="text-xs text-muted">
                  {["时间", "类型", "试剂", "数量", "批号", "有效期", "操作人", "备注", "原因"].map((label) => (
                    <th key={label} className="whitespace-nowrap border-b border-border px-2 py-2 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((record) => (
                  <tr key={record.id} className="border-b border-border/70">
                    <td className="whitespace-nowrap px-2 py-2 tabular">{formatWhen(record.createdAt)}</td>
                    <td className={cn("whitespace-nowrap px-2 py-2 font-medium", record.type === "in" ? "text-ok" : "text-out")}>
                      {record.type === "in" ? "入库" : "出库"}
                    </td>
                    <td className="max-w-40 truncate px-2 py-2">{record.reagentName}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular">{record.quantity}</td>
                    <td className="whitespace-nowrap px-2 py-2">{record.lotNumber || "—"}</td>
                    <td className="whitespace-nowrap px-2 py-2">{record.expiryDate || "—"}</td>
                    <td className="whitespace-nowrap px-2 py-2">{record.operator || "检验员"}</td>
                    <td className="max-w-48 truncate px-2 py-2">{record.note || "—"}</td>
                    <td className="max-w-48 truncate px-2 py-2">{record.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <Button className="h-12 w-full" disabled={saving} onClick={() => void savePreview()}>
              <Download className="size-4" />
              {saving ? "正在保存…" : "保存 Excel"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
