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

function downloadExcel(filename: string, body: string, mime = "application/vnd.ms-excel;charset=utf-8") {
  const blob = new Blob(["\ufeff", body], { type: mime });
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

function xmlText(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sheetCell(style: string, type: "String" | "Number", value: string | number): string {
  return `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${xmlText(value)}</Data></Cell>`;
}

function sheetRow(cells: string, height?: number): string {
  const heightAttr = height ? ` ss:Height="${height}"` : ` ss:AutoFitHeight="1"`;
  return `<Row${heightAttr}>${cells}</Row>`;
}

/**
 * Downloads the stock ledger as a real Excel worksheet.
 * SpreadsheetML keeps column widths, colors and wrapped notes, which the old
 * HTML-table .xls file collapsed into one unreadable block.
 */
export function exportStockRecordsExcel(records: StockRecord[], filter: "all" | StockType = "all"): boolean {
  if (typeof document === "undefined" || records.length === 0) return false;

  const scope = recordScope(filter);
  const sorted = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  const inboundRows = sorted.filter((record) => record.type === "in");
  const outboundRows = sorted.filter((record) => record.type === "out");
  const inboundQty = inboundRows.reduce((sum, record) => sum + record.quantity, 0);
  const outboundQty = outboundRows.reduce((sum, record) => sum + record.quantity, 0);
  const headers = ["时间", "类型", "试剂名称", "数量", "批号", "有效期", "生产日期", "操作人", "科室", "备注", "原因"];
  const headerRow = sheetRow(headers.map((label) => sheetCell("header", "String", label)).join(""), 24);
  const dataRows = sorted
    .map((record, index) => {
      const band = index % 2 === 1;
      const inbound = record.type === "in";
      const text = band ? "textBand" : "text";
      const wrap = band ? "wrapBand" : "wrap";
      const qty = band ? "qtyBand" : "qty";
      const longest = Math.max(
        record.reagentName.length,
        record.lotNumber.length,
        record.note.length,
        record.reason.length,
      );
      const lines = Math.min(4, Math.max(1, Math.ceil(longest / 14)));
      return sheetRow(
        [
          sheetCell(text, "String", formatExportWhen(record.createdAt)),
          sheetCell(inbound ? "inType" : "outType", "String", inbound ? "入库" : "出库"),
          sheetCell(wrap, "String", record.reagentName || "未知试剂"),
          sheetCell(qty, "Number", record.quantity),
          sheetCell(wrap, "String", record.lotNumber),
          sheetCell(text, "String", record.expiryDate),
          sheetCell(text, "String", record.productionDate),
          sheetCell(text, "String", record.operator || "检验员"),
          sheetCell(text, "String", record.department || "检验科"),
          sheetCell(wrap, "String", record.note),
          sheetCell(wrap, "String", record.reason),
        ].join(""),
        16 + lines * 16,
      );
    })
    .join("");

  const rowCount = 4 + sorted.length;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="title">
    <Alignment ss:Vertical="Center"/>
    <Font ss:FontName="微软雅黑" ss:Size="16" ss:Bold="1" ss:Color="#0E5C56"/>
  </Style>
  <Style ss:ID="meta">
    <Alignment ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="微软雅黑" ss:Size="10" ss:Color="#5E645C"/>
  </Style>
  <Style ss:ID="header">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0E5C56"/>
      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0E5C56"/>
      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0E5C56"/>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0E5C56"/>
    </Borders>
    <Font ss:FontName="微软雅黑" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#0E5C56" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="text"><Alignment ss:Vertical="Center"/><Font ss:FontName="微软雅黑" ss:Size="11" ss:Color="#1C1D1A"/>${sheetBorder("#E4E2DC")}</Style>
  <Style ss:ID="textBand"><Alignment ss:Vertical="Center"/><Font ss:FontName="微软雅黑" ss:Size="11" ss:Color="#1C1D1A"/><Interior ss:Color="#F7F6F2" ss:Pattern="Solid"/>${sheetBorder("#E4E2DC")}</Style>
  <Style ss:ID="wrap"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="微软雅黑" ss:Size="11" ss:Color="#1C1D1A"/>${sheetBorder("#E4E2DC")}</Style>
  <Style ss:ID="wrapBand"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="微软雅黑" ss:Size="11" ss:Color="#1C1D1A"/><Interior ss:Color="#F7F6F2" ss:Pattern="Solid"/>${sheetBorder("#E4E2DC")}</Style>
  <Style ss:ID="qty"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:FontName="微软雅黑" ss:Size="11" ss:Color="#1C1D1A"/><NumberFormat ss:Format="0"/>${sheetBorder("#E4E2DC")}</Style>
  <Style ss:ID="qtyBand"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:FontName="微软雅黑" ss:Size="11" ss:Color="#1C1D1A"/><Interior ss:Color="#F7F6F2" ss:Pattern="Solid"/><NumberFormat ss:Format="0"/>${sheetBorder("#E4E2DC")}</Style>
  <Style ss:ID="inType"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="微软雅黑" ss:Size="11" ss:Bold="1" ss:Color="#0B7A45"/><Interior ss:Color="#E7F6EE" ss:Pattern="Solid"/>${sheetBorder("#E4E2DC")}</Style>
  <Style ss:ID="outType"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="微软雅黑" ss:Size="11" ss:Bold="1" ss:Color="#C2412D"/><Interior ss:Color="#FDECEC" ss:Pattern="Solid"/>${sheetBorder("#E4E2DC")}</Style>
 </Styles>
 <Worksheet ss:Name="出入库记录">
  <Table ss:ExpandedColumnCount="11" ss:ExpandedRowCount="${rowCount}" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="118"/>
   <Column ss:AutoFitWidth="0" ss:Width="52"/>
   <Column ss:AutoFitWidth="0" ss:Width="168"/>
   <Column ss:AutoFitWidth="0" ss:Width="52"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="88"/>
   <Column ss:AutoFitWidth="0" ss:Width="88"/>
   <Column ss:AutoFitWidth="0" ss:Width="72"/>
   <Column ss:AutoFitWidth="0" ss:Width="72"/>
   <Column ss:AutoFitWidth="0" ss:Width="180"/>
   <Column ss:AutoFitWidth="0" ss:Width="150"/>
   ${sheetRow(`<Cell ss:MergeAcross="10" ss:StyleID="title"><Data ss:Type="String">${xmlText(`权盾智检 · 出入库记录（${scope}）`)}</Data></Cell>`, 30)}
   ${sheetRow(`<Cell ss:MergeAcross="10" ss:StyleID="meta"><Data ss:Type="String">${xmlText(`导出时间 ${formatExportWhen(new Date().toISOString())}    共 ${sorted.length} 条    入库 ${inboundRows.length} 笔 / ${inboundQty}    出库 ${outboundRows.length} 笔 / ${outboundQty}    数量均为正数`)}</Data></Cell>`, 22)}
   <Row ss:Height="10"/>
   ${headerRow}
   ${dataRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>4</SplitHorizontal>
   <TopRowBottomPane>5</TopRowBottomPane>
   <ActivePane>2</ActivePane>
   <Panes><Pane><Number>2</Number><ActiveRow>4</ActiveRow></Pane></Panes>
  </WorksheetOptions>
  <AutoFilter x:Range="R4C1:R${rowCount}C11" xmlns="urn:schemas-microsoft-com:office:excel"/>
 </Worksheet>
</Workbook>`;

  downloadExcel(`权盾智检-出入库记录-${scope}-${fileStamp()}.xls`, xml);
  return true;
}

function sheetBorder(color: string): string {
  return `<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${color}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${color}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${color}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${color}"/></Borders>`;
}
