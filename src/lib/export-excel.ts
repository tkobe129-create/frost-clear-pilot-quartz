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
  if (status === "cancelled") return "已关闭";
  return "已下单";
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
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Uncompressed OOXML zip. iPhone Safari rejects the compressed download path. */
function zipXlsx(files: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array(30 + name.length + file.data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, time, true);
    view.setUint16(12, date, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, file.data.length, true);
    view.setUint32(22, file.data.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(file.data, 30 + name.length);
    locals.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, file.data.length, true);
    centralView.setUint32(24, file.data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralBytes = concatBytes(centrals);
  const eocd = new Uint8Array(22);
  const end = new DataView(eocd.buffer);
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralBytes.length, true);
  end.setUint32(16, offset, true);
  return concatBytes([...locals, centralBytes, eocd]);
}

function columnName(index: number): string {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function stylesXml(): string {
  const solid = (color: string) =>
    `<fill><patternFill patternType="solid"><fgColor rgb="${color}"/><bgColor rgb="${color}"/></patternFill></fill>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="7">
    <font><sz val="11"/><name val="微软雅黑"/></font>
    <font><b/><sz val="16"/><color rgb="FF0E5C56"/><name val="微软雅黑"/></font>
    <font><sz val="10"/><color rgb="FF5E645C"/><name val="微软雅黑"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="微软雅黑"/></font>
    <font><sz val="11"/><color rgb="FF1C1D1A"/><name val="微软雅黑"/></font>
    <font><b/><sz val="11"/><color rgb="FF0B7A45"/><name val="微软雅黑"/></font>
    <font><b/><sz val="11"/><color rgb="FFC2412D"/><name val="微软雅黑"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    ${solid("FF0E5C56")}
    ${solid("FFF7F6F2")}
    ${solid("FFE7F6EE")}
    ${solid("FFFDECEC")}
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE4E2DC"/></left>
      <right style="thin"><color rgb="FFE4E2DC"/></right>
      <top style="thin"><color rgb="FFE4E2DC"/></top>
      <bottom style="thin"><color rgb="FFE4E2DC"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="1" fontId="4" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="1" fontId="4" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

function buildLedgerSheet(records: StockRecord[], filter: "all" | StockType): { sheet: string; strings: string } {
  const scope = recordScope(filter);
  const sorted = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  const inbound = sorted.filter((record) => record.type === "in");
  const outbound = sorted.filter((record) => record.type === "out");
  const inboundQty = inbound.reduce((sum, record) => sum + record.quantity, 0);
  const outboundQty = outbound.reduce((sum, record) => sum + record.quantity, 0);
  const strings: string[] = [];
  const textId = (value: string) => {
    const id = strings.length;
    strings.push(value);
    return id;
  };
  const textCell = (ref: string, style: number, value: string) =>
    `<c r="${ref}" t="s" s="${style}"><v>${textId(value)}</v></c>`;
  const numberCell = (ref: string, style: number, value: number) =>
    `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  const headers = ["时间", "类型", "试剂名称", "数量", "批号", "有效期", "生产日期", "操作人", "科室", "备注", "原因"];
  const lastRow = 4 + sorted.length;
  const headerCells = headers.map((label, index) => textCell(`${columnName(index)}4`, 3, label)).join("");
  const dataRows = sorted
    .map((record, index) => {
      const row = index + 5;
      const band = index % 2 === 1;
      const inboundRow = record.type === "in";
      const text = band ? 5 : 4;
      const wrap = band ? 7 : 6;
      const qty = band ? 9 : 8;
      const longest = Math.max(record.reagentName.length, record.lotNumber.length, record.note.length, record.reason.length);
      const height = 16 + Math.min(4, Math.max(1, Math.ceil(longest / 14))) * 16;
      const cells = [
        textCell(`A${row}`, text, formatExportWhen(record.createdAt)),
        textCell(`B${row}`, inboundRow ? 10 : 11, inboundRow ? "入库" : "出库"),
        textCell(`C${row}`, wrap, record.reagentName || "未知试剂"),
        numberCell(`D${row}`, qty, record.quantity),
        textCell(`E${row}`, wrap, record.lotNumber),
        textCell(`F${row}`, text, record.expiryDate),
        textCell(`G${row}`, text, record.productionDate),
        textCell(`H${row}`, text, record.operator || "检验员"),
        textCell(`I${row}`, text, record.department || "检验科"),
        textCell(`J${row}`, wrap, record.note),
        textCell(`K${row}`, wrap, record.reason),
      ].join("");
      return `<row r="${row}" ht="${height}" customHeight="1">${cells}</row>`;
    })
    .join("");
  const title = `权盾智检 · 出入库记录（${scope}）`;
  const summary = `导出时间 ${formatExportWhen(new Date().toISOString())}    共 ${sorted.length} 条    入库 ${inbound.length} 笔 / ${inboundQty}    出库 ${outbound.length} 笔 / ${outboundQty}`;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:K${lastRow}"/>
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols>
    <col min="1" max="1" width="20" customWidth="1"/>
    <col min="2" max="2" width="10" customWidth="1"/>
    <col min="3" max="3" width="24" customWidth="1"/>
    <col min="4" max="4" width="10" customWidth="1"/>
    <col min="5" max="5" width="18" customWidth="1"/>
    <col min="6" max="6" width="14" customWidth="1"/>
    <col min="7" max="7" width="14" customWidth="1"/>
    <col min="8" max="8" width="12" customWidth="1"/>
    <col min="9" max="9" width="12" customWidth="1"/>
    <col min="10" max="10" width="28" customWidth="1"/>
    <col min="11" max="11" width="24" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1" ht="28" customHeight="1">${textCell("A1", 1, title)}</row>
    <row r="2" ht="22" customHeight="1">${textCell("A2", 2, summary)}</row>
    <row r="3" ht="8" customHeight="1"/>
    <row r="4" ht="22" customHeight="1">${headerCells}</row>
    ${dataRows}
  </sheetData>
  <autoFilter ref="A4:K${lastRow}"/>
  <mergeCells count="2">
    <mergeCell ref="A1:K1"/>
    <mergeCell ref="A2:K2"/>
  </mergeCells>
</worksheet>`;
  const sst = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
  ${strings.map((value) => `<si><t xml:space="preserve">${xmlText(value)}</t></si>`).join("")}
</sst>`;
  return { sheet, strings: sst };
}

export function buildStockRecordsXlsx(records: StockRecord[], filter: "all" | StockType = "all"): Uint8Array {
  const { sheet, strings } = buildLedgerSheet(records, filter);
  const encode = (xml: string) => new TextEncoder().encode(xml);
  return zipXlsx([
    {
      name: "[Content_Types].xml",
      data: encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`),
    },
    {
      name: "_rels/.rels",
      data: encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    },
    {
      name: "xl/workbook.xml",
      data: encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="出入库记录" sheetId="1" r:id="rId1"/></sheets>
</workbook>`),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`),
    },
    { name: "xl/styles.xml", data: encode(stylesXml()) },
    { name: "xl/sharedStrings.xml", data: encode(strings) },
    { name: "xl/worksheets/sheet1.xml", data: encode(sheet) },
  ]);
}

function fileBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export type ExportSaveResult = "shared" | "downloaded" | "cancelled";

/**
 * Saves a real .xlsx file. On iPhone this must run inside the tap handler:
 * Safari blocks a download that starts after an earlier network request.
 */
export function saveStockRecordsExcel(records: StockRecord[], filter: "all" | StockType = "all"): Promise<ExportSaveResult> {
  if (typeof document === "undefined" || records.length === 0) return Promise.resolve("cancelled");
  const bytes = buildStockRecordsXlsx(records, filter);
  const filename = `权盾智检-出入库记录-${recordScope(filter)}-${fileStamp()}.xlsx`;
  const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const file = new File([fileBuffer(bytes)], filename, { type: mime });
  const canShare = typeof navigator.share === "function" && navigator.canShare?.({ files: [file] });
  if (canShare) {
    return navigator
      .share({ files: [file], title: filename })
      .then(() => "shared" as const)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
        downloadFile(file);
        return "downloaded";
      });
  }
  downloadFile(file);
  return Promise.resolve("downloaded");
}
