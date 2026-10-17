import type { PurchaseOrder } from "@/lib/types";

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

  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `权盾智检-采购单-${order.id}.xls`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
