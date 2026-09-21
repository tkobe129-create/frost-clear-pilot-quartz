import type { ExtractedFields, Reagent, ScanSegmentRule } from "./types";

export const GS1_AI_MAP: Record<string, { desc: string; len: number }> = {
  "00": { desc: "SSCC", len: 18 },
  "01": { desc: "GTIN", len: 14 },
  "02": { desc: "含内商品 GTIN", len: 14 },
  "10": { desc: "批号", len: 0 },
  "11": { desc: "生产日期", len: 6 },
  "12": { desc: "有效期", len: 6 },
  "13": { desc: "包装日期", len: 6 },
  "15": { desc: "保质期", len: 6 },
  "16": { desc: "销售截止日期", len: 6 },
  "17": { desc: "有效期至", len: 6 },
  "20": { desc: "产品变体", len: 2 },
  "21": { desc: "序列号", len: 0 },
  "22": { desc: "HIBCC", len: 0 },
  "30": { desc: "可变数量", len: 0 },
  "37": { desc: "数量", len: 0 },
  "240": { desc: "附加产品标识", len: 0 },
  "241": { desc: "客户部件号", len: 0 },
  "250": { desc: "二级序列号", len: 0 },
  "251": { desc: "引用源实体", len: 0 },
  "310": { desc: "净重(kg)", len: 6 },
  "311": { desc: "净长(m)", len: 6 },
  "312": { desc: "净宽(m)", len: 6 },
  "313": { desc: "净高(m)", len: 6 },
  "314": { desc: "净面积(m2)", len: 6 },
  "315": { desc: "净体积(L)", len: 6 },
  "316": { desc: "净体积(m3)", len: 6 },
  "320": { desc: "净重(lb)", len: 6 },
  "410": { desc: "发货方", len: 13 },
  "411": { desc: "收货方", len: 13 },
  "414": { desc: "标识码", len: 13 },
  "417": { desc: "供货方", len: 13 },
  "420": { desc: "收货方邮编", len: 0 },
};

export type ParsedSegment = {
  ai: string;
  desc: string;
  start: number;
  end: number;
  value: string;
  fullMatch: string;
};

export function cleanFNC1(code: string): string {
  return code.replace(/\u00e8/g, "\u001d").replace(/\u00ea/g, "\u001d").trim();
}

export function stripSymbologyId(code: string): string {
  let cleaned = cleanFNC1(code);
  cleaned = cleaned.replace(/^\][A-Za-z][0-9]/, "");
  if (cleaned.charCodeAt(0) === 29) cleaned = cleaned.slice(1);
  return cleaned.trim();
}

export function formatGs1Date(value: string): string {
  if (!value || value.length !== 6 || !/^\d{6}$/.test(value)) return value;
  const yy = Number(value.slice(0, 2));
  const mm = value.slice(2, 4);
  const dd = value.slice(4, 6);
  const year = yy >= 80 ? 1900 + yy : 2000 + yy;
  return `${year}-${mm}-${dd}`;
}

function pushUnknown(raw: string, start: number, end: number, segs: ParsedSegment[]) {
  segs.push({
    ai: "",
    desc: "完整条码",
    start,
    end,
    value: raw.slice(start, end),
    fullMatch: raw.slice(start, end),
  });
}

function parseParenthesized(raw: string): ParsedSegment[] {
  const parsed: ParsedSegment[] = [];
  const regex = /\((\d{2,4})\)([^\()]*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    const ai = match[1] ?? "";
    const data = match[2] ?? "";
    const info = GS1_AI_MAP[ai] ?? { desc: `未知(${ai})`, len: 0 };
    parsed.push({
      ai,
      desc: info.desc,
      start: match.index,
      end: match.index + match[0].length,
      value: data,
      fullMatch: match[0],
    });
  }
  return parsed;
}

function parseUnbracketed(raw: string): ParsedSegment[] {
  const parsed: ParsedSegment[] = [];
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === "\u001d") {
      i += 1;
      continue;
    }
    let ai: string | null = null;
    for (const n of [4, 3, 2]) {
      const cand = raw.slice(i, i + n);
      if (GS1_AI_MAP[cand]) {
        ai = cand;
        break;
      }
    }
    if (!ai) {
      if (parsed.length === 0) {
        pushUnknown(raw, 0, raw.length, parsed);
        return parsed;
      }
      const last = parsed[parsed.length - 1];
      if (last && last.ai && GS1_AI_MAP[last.ai]?.len === 0) {
        last.value += raw.slice(i);
        last.end = raw.length;
        last.fullMatch = raw.slice(last.start, raw.length);
      } else {
        pushUnknown(raw, i, raw.length, parsed);
      }
      break;
    }
    const info = GS1_AI_MAP[ai];
    const aiStart = i;
    i += ai.length;
    let value: string;
    if (info.len > 0) {
      value = raw.slice(i, i + info.len);
      i += info.len;
    } else {
      const gs = raw.indexOf("\u001d", i);
      if (gs >= 0) {
        value = raw.slice(i, gs);
        i = gs + 1;
      } else {
        value = raw.slice(i);
        i = raw.length;
      }
    }
    parsed.push({
      ai,
      desc: info.desc,
      start: aiStart,
      end: i,
      value,
      fullMatch: raw.slice(aiStart, i),
    });
  }
  return parsed;
}

function parseDigitalLink(raw: string): ParsedSegment[] | null {
  try {
    if (!/^https?:\/\//i.test(raw) && !raw.includes("/01/")) return null;
    const url = new URL(raw.startsWith("http") ? raw : `https://id.gs1.org${raw.startsWith("/") ? "" : "/"}${raw}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const segs: ParsedSegment[] = [];
    for (let i = 0; i < parts.length - 1; i += 1) {
      const ai = parts[i] ?? "";
      const value = decodeURIComponent(parts[i + 1] ?? "");
      if (GS1_AI_MAP[ai]) {
        const info = GS1_AI_MAP[ai];
        segs.push({
          ai,
          desc: info.desc,
          start: 0,
          end: value.length,
          value,
          fullMatch: `${ai}/${value}`,
        });
        i += 1;
      }
    }
    url.searchParams.forEach((value, ai) => {
      const info = GS1_AI_MAP[ai];
      if (info) {
        segs.push({
          ai,
          desc: info.desc,
          start: 0,
          end: value.length,
          value,
          fullMatch: `${ai}=${value}`,
        });
      }
    });
    return segs.length ? segs : null;
  } catch {
    return null;
  }
}

export function parseBarcode(rawInput: string): ParsedSegment[] {
  if (!rawInput || !rawInput.trim()) return [];
  const raw = stripSymbologyId(rawInput);

  const digital = parseDigitalLink(raw);
  if (digital && digital.length) return digital;

  if (raw.includes("(") && raw.includes(")")) {
    const paren = parseParenthesized(raw);
    if (paren.length) return paren;
  }

  if (/^\d{8,14}$/.test(raw)) {
    return [
      {
        ai: "01",
        desc: "GTIN / 商品码",
        start: 0,
        end: raw.length,
        value: raw,
        fullMatch: raw,
      },
    ];
  }

  const unb = parseUnbracketed(raw.replace(/\s+/g, ""));
  if (unb.length) return unb;

  return [
    {
      ai: "",
      desc: "完整条码",
      start: 0,
      end: raw.length,
      value: raw,
      fullMatch: raw,
    },
  ];
}

export function fieldsFromSegments(segments: ParsedSegment[]): ExtractedFields {
  const fields: ExtractedFields = {};
  for (const s of segments) {
    const value = s.value;
    switch (s.ai) {
      case "01":
      case "02":
        fields.gtin = value;
        break;
      case "10":
        fields.lotNumber = value;
        break;
      case "11":
      case "13":
        fields.productionDate = value;
        fields.productionDateFormatted = formatGs1Date(value);
        break;
      case "12":
      case "15":
      case "16":
      case "17":
        fields.expiryDate = value;
        fields.expiryDateFormatted = formatGs1Date(value);
        break;
      case "21":
        fields.serialNumber = value;
        break;
      case "30":
      case "37":
        fields.quantity = value;
        break;
      default:
        break;
    }
  }
  return fields;
}

export function extractFieldsByRules(
  scanResult: string,
  scanSegments: ScanSegmentRule[] | string | undefined,
): ExtractedFields {
  const parsed = parseBarcode(scanResult);
  const fromParse = fieldsFromSegments(parsed);
  if (!scanSegments) return fromParse;

  let rules: ScanSegmentRule[] = [];
  try {
    rules = typeof scanSegments === "string" ? (JSON.parse(scanSegments) as ScanSegmentRule[]) : scanSegments;
  } catch {
    return fromParse;
  }

  if (!Array.isArray(rules) || rules.length === 0) return fromParse;

  const byAi = new Map(parsed.filter((s) => s.ai).map((s) => [s.ai, s]));
  const fields: ExtractedFields = { ...fromParse };

  for (const rule of rules) {
    let value = "";
    const hit = rule.ai ? byAi.get(rule.ai) : undefined;
    if (hit) {
      value = hit.value;
    } else if (typeof rule.start === "number" && typeof rule.len === "number" && rule.len > 0) {
      value = scanResult.substring(rule.start, rule.start + rule.len);
    }
    if (!value) continue;
    switch (rule.ai) {
      case "01":
        fields.gtin = value;
        break;
      case "10":
        fields.lotNumber = value;
        break;
      case "11":
        fields.productionDate = value;
        fields.productionDateFormatted = formatGs1Date(value);
        break;
      case "17":
        fields.expiryDate = value;
        fields.expiryDateFormatted = formatGs1Date(value);
        break;
      case "21":
        fields.serialNumber = value;
        break;
      default:
        break;
    }
  }
  return fields;
}

export function rulesFromSegments(segments: ParsedSegment[]): ScanSegmentRule[] {
  return segments
    .filter((s) => s.ai)
    .map((s) => ({
      ai: s.ai,
      desc: s.desc,
      start: s.start + (s.fullMatch.startsWith("(") ? s.ai.length + 2 : s.ai.length),
      len: s.value.length,
    }));
}

export function matchReagentByScan(
  scanResult: string,
  reagents: Reagent[],
): { reagent: Reagent; fields: ExtractedFields } | null {
  const cleaned = stripSymbologyId(scanResult);
  const parsed = parseBarcode(cleaned);
  const parsedFields = fieldsFromSegments(parsed);
  const gtin = parsedFields.gtin || "";

  const withRule = reagents.filter((r) => r.scanRule && r.scanRule.trim());
  for (const r of withRule) {
    const rule = r.scanRule.trim();
    if (cleaned.includes(rule) || (gtin && (gtin.includes(rule) || rule.includes(gtin)))) {
      const fields = extractFieldsByRules(cleaned, r.scanSegments);
      return { reagent: r, fields };
    }
  }

  const withCode = reagents.filter((r) => r.code && r.code.trim());
  for (const r of withCode) {
    const code = r.code.trim();
    if (cleaned.includes(code) || (gtin && (gtin.includes(code) || code.includes(gtin)))) {
      const fields = extractFieldsByRules(cleaned, r.scanSegments);
      return { reagent: r, fields };
    }
  }

  for (const r of withCode) {
    if (cleaned === r.code || cleaned === r.scanRule) {
      return { reagent: r, fields: parsedFields };
    }
  }

  return null;
}

export function buildDemoBarcode(reagent: Reagent): string {
  if (reagent.rawBarcode && reagent.rawBarcode.trim()) return reagent.rawBarcode.trim();
  const gtin = (reagent.code || "").replace(/\D/g, "").padStart(14, "0").slice(-14);
  const lot = reagent.lotNumber || "DEMOLOT";
  const prod = (reagent.productionDate || "").replace(/-/g, "").slice(2, 8);
  const exp = (reagent.expiryDate || "").replace(/-/g, "").slice(2, 8);
  let out = `(01)${gtin}`;
  if (prod.length === 6) out += `(11)${prod}`;
  if (exp.length === 6) out += `(17)${exp}`;
  out += `(10)${lot}`;
  return out;
}

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export const SUPPORTED_FORMATS = [
  "QR 码",
  "GS1-128 / EAN-128",
  "Code 128 / 39 / 93",
  "EAN-13 / EAN-8",
  "UPC-A / UPC-E",
  "Data Matrix",
  "PDF417",
  "Aztec",
  "ITF / Interleaved 2 of 5",
  "Codabar",
  "GS1 DataBar",
  "GS1 Digital Link",
] as const;
