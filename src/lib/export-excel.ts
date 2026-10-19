import type { PurchaseOrder, StockRecord, StockType } from "@/lib/types";

function escapeCell(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function orderStatus(status: PurchaseOrder["status"]): string {
  if (status === "received") return "已入库";
  if (status === "cancelled") return "已取消";
  return "待收货";
}

/**
 * Exports an Excel-compatible workbook without a heavy spreadsheet dependency.
 * Excel opens the HTML table format directly and preserves Chinese text,
 * columns, quantities and the order summary on mobile and desktop.
 */
export function exportPurchaseOrderExcel(order: PurchaseOrder): void {
  if (typeof document === "undefined") return;

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeCell(order.id)}</td>
          <td>${escapeCell(order.createdAt)}</td>
          <td>${escapeCell(orderStatus(order.status))}</td>
          <td>${escapeCell(item.name)}</td>
          <td>${escapeCell(item.specification)}</td>
          <td>${escapeCell(item.manufacturer)}</td>
          <td>${escapeCell(item.supplier)}</td>
          <td class="number">${escapeCell(item.quantity)}</td>
          <td>${escapeCell(item.unit)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <style>
    table { border-collapse: collapse; }
    th, td { border: 1px solid #b7b7b7; padding: 6px 10px; white-space: nowrap; }
    th { background: #0e5c56; color: #ffffff; font-weight: bold; }
    .number { mso-number-format: "0"; text-align: right; }
  </style>
</head>
<body>
  <h2>权盾智检采购单 #${escapeCell(order.id)}</h2>
  <p>下单时间：${escapeCell(order.createdAt)} | 状态：${escapeCell(orderStatus(order.status))}</p>
  <table>
    <thead><tr>
      <th>采购单号</th><th>下单时间</th><th>状态</th><th>试剂名称</th><th>规格</th>
      <th>厂家</th><th>供应商</th><th>数量</th><th>单位</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><th colspan="7">合计 ${order.itemCount} 项</th><th colspan="2"></th></tr></tfoot>
  </table>
</body>
</html>`;

  downloadExcel(`权盾智检-采购单-${order.id}.xls`, html);
}

function downloadExcel(filename: string, html: string) {
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatExportWhen(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fileStamp(): string {
  const date = new Date();
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function recordScope(filter: "all" | StockType): string {
  if (filter === "in") return "入库";
  if (filter === "out") return "出库";
  return "全部";
}

/**
 * Downloads the stock ledger as an Excel-compatible file.
 * Caller should pass the full filtered set, not only the 200 rows shown on screen.
 */
export function exportStockRecordsExcel(records: StockRecord[], filter: "all" | StockType = "all"): boolean {
  if (typeof document === "undefined" || records.length === 0) return false;

  const scope = recordScope(filter);
  const sorted = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  const inbound = sorted.filter((record) => record.type === "in").reduce((sum, record) => sum + record.quantity, 0);
  const outbound = sorted.filter((record) => record.type === "out").reduce((sum, record) => sum + record.quantity, 0);
  const rows = sorted
    .map(
      (record) => `
        <tr>
          <td>${escapeCell(formatExportWhen(record.createdAt))}</td>
          <td>${escapeCell(record.type === "in" ? "入库" : "出库")}</td>
          <td>${escapeCell(record.reagentName || "未知试剂")}</td>
          <td class="number">${escapeCell(record.type === "in" ? record.quantity : -record.quantity)}</td>
          <td>${escapeCell(record.lotNumber)}</td>
          <td>${escapeCell(record.expiryDate)}</td>
          <td>${escapeCell(record.productionDate)}</td>
          <td>${escapeCell(record.operator || "检验员")}</td>
          <td>${escapeCell(record.department || "检验科")}</td>
          <td>${escapeCell(record.note)}</td>
          <td>${escapeCell(record.reason)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <style>
    table { border-collapse: collapse; }
    th, td { border: 1px solid #b7b7b7; padding: 6px 10px; white-space: nowrap; }
    th { background: #0e5c56; color: #ffffff; font-weight: bold; }
    .number { mso-number-format: "0"; text-align: right; }
  </style>
</head>
<body>
  <h2>权盾智检出入库记录 · ${escapeCell(scope)}</h2>
  <p>导出时间：${escapeCell(formatExportWhen(new Date().toISOString()))} | ${sorted.length} 条 | 入库合计 ${inbound} | 出库合计 ${outbound} | 出库数量以负数表示</p>
  <table>
    <thead><tr>
      <th>时间</th><th>类型</th><th>试剂名称</th><th>数量</th><th>批号</th><th>有效期</th>
      <th>生产日期</th><th>操作人</th><th>科室</th><th>备注</th><th>原因</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  downloadExcel(`权盾智检-出入库记录-${scope}-${fileStamp()}.xls`, html);
  return true;
}
