import { useMemo, useState } from "react";
import { Camera, ChevronRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { ScannerOverlay } from "@/components/scanner-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { daysUntil, parseBarcode, rulesFromSegments, stripSymbologyId } from "@/lib/scanner";
import { CATEGORIES, STORAGE_OPTIONS, UNITS, type Reagent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Draft = {
  id?: number;
  code: string;
  name: string;
  category: string;
  specification: string;
  manufacturer: string;
  unit: string;
  stockQuantity: string;
  minStock: string;
  storageCondition: string;
  location: string;
  expiryDate: string;
  registrationNumber: string;
  notes: string;
  scanRule: string;
  scanSegmentsText: string;
  lotNumber: string;
  productionDate: string;
  rawBarcode: string;
  supplier: string;
  unitPrice: string;
};

const emptyDraft = (): Draft => ({
  code: "",
  name: "",
  category: "免疫",
  specification: "",
  manufacturer: "",
  unit: "盒",
  stockQuantity: "0",
  minStock: "0",
  storageCondition: "2–8℃",
  location: "",
  expiryDate: "",
  registrationNumber: "",
  notes: "",
  scanRule: "",
  scanSegmentsText: "[]",
  lotNumber: "",
  productionDate: "",
  rawBarcode: "",
  supplier: "",
  unitPrice: "0",
});

function fromReagent(r: Reagent): Draft {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category || "其他",
    specification: r.specification,
    manufacturer: r.manufacturer,
    unit: r.unit || "盒",
    stockQuantity: String(r.stockQuantity),
    minStock: String(r.minStock),
    storageCondition: r.storageCondition,
    location: r.location,
    expiryDate: r.expiryDate,
    registrationNumber: r.registrationNumber,
    notes: r.notes,
    scanRule: r.scanRule,
    scanSegmentsText: JSON.stringify(r.scanSegments ?? [], null, 0),
    lotNumber: r.lotNumber,
    productionDate: r.productionDate,
    rawBarcode: r.rawBarcode,
    supplier: r.supplier,
    unitPrice: String(r.unitPrice || 0),
  };
}

export type SavePayload = {
  id?: number;
  code: string;
  name: string;
  category: string;
  specification: string;
  manufacturer: string;
  unit: string;
  stockQuantity: number;
  minStock: number;
  storageCondition: string;
  location: string;
  expiryDate: string;
  registrationNumber: string;
  notes: string;
  scanRule: string;
  scanSegments: Reagent["scanSegments"];
  lotNumber: string;
  productionDate: string;
  rawBarcode: string;
  supplier: string;
  unitPrice: number;
};

export function ReagentsView({
  reagents,
  saving,
  onSave,
}: {
  reagents: Reagent[];
  saving: boolean;
  onSave: (data: SavePayload) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return reagents;
    return reagents.filter((r) =>
      [r.name, r.code, r.manufacturer, r.category, r.location, r.lotNumber].join(" ").toLowerCase().includes(s),
    );
  }, [q, reagents]);

  function applyBarcode(code: string) {
    if (!draft) return;
    const cleaned = stripSymbologyId(code);
    const segs = parseBarcode(cleaned);
    const rules = rulesFromSegments(segs);
    const gtin = segs.find((s) => s.ai === "01")?.value || "";
    const lot = segs.find((s) => s.ai === "10")?.value || "";
    const prod = segs.find((s) => s.ai === "11")?.value || "";
    const exp = segs.find((s) => s.ai === "17")?.value || "";
    const fmt = (v: string) => (v.length === 6 ? `20${v.slice(0, 2)}-${v.slice(2, 4)}-${v.slice(4, 6)}` : v);
    setDraft({
      ...draft,
      rawBarcode: cleaned,
      scanRule: gtin || draft.scanRule || cleaned,
      code: draft.code || gtin || cleaned,
      lotNumber: lot || draft.lotNumber,
      productionDate: prod ? fmt(prod) : draft.productionDate,
      expiryDate: exp ? fmt(exp) : draft.expiryDate,
      scanSegmentsText: JSON.stringify(rules),
    });
    toast.success("已解析条码并生成切割规则");
  }

  async function save() {
    if (!draft) return;
    if (!draft.code.trim() || !draft.name.trim()) {
      toast.error("请填写 GTIN 和试剂名称");
      return;
    }
    let scanSegments: Reagent["scanSegments"] = [];
    try {
      scanSegments = JSON.parse(draft.scanSegmentsText || "[]") as Reagent["scanSegments"];
    } catch {
      toast.error("切割规则 JSON 格式错误");
      return;
    }
    await onSave({
      id: draft.id,
      code: draft.code.trim(),
      name: draft.name.trim(),
      category: draft.category,
      specification: draft.specification,
      manufacturer: draft.manufacturer,
      unit: draft.unit,
      stockQuantity: Number(draft.stockQuantity) || 0,
      minStock: Number(draft.minStock) || 0,
      storageCondition: draft.storageCondition,
      location: draft.location,
      expiryDate: draft.expiryDate,
      registrationNumber: draft.registrationNumber,
      notes: draft.notes,
      scanRule: draft.scanRule.trim() || draft.code.trim(),
      scanSegments,
      lotNumber: draft.lotNumber,
      productionDate: draft.productionDate,
      rawBarcode: draft.rawBarcode,
      supplier: draft.supplier,
      unitPrice: Number(draft.unitPrice) || 0,
    });
    setDraft(null);
  }

  if (draft) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{draft.id ? "编辑试剂" : "预录试剂"}</h2>
          <button type="button" className="h-11 px-2 text-sm text-muted" onClick={() => setDraft(null)}>
            返回
          </button>
        </div>
        <Button variant="secondary" onClick={() => setCameraOpen(true)}>
          <Camera className="size-4" />
          扫码自动解析 GS1
        </Button>
        <Field label="GTIN / 编码" value={draft.code} onChange={(v) => setDraft({ ...draft, code: v })} />
        <Field label="试剂名称" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SelectField
            label="类别"
            value={draft.category}
            options={CATEGORIES}
            onChange={(v) => setDraft({ ...draft, category: v })}
          />
          <SelectField
            label="单位"
            value={draft.unit}
            options={UNITS}
            onChange={(v) => setDraft({ ...draft, unit: v })}
          />
          <Field label="规格" value={draft.specification} onChange={(v) => setDraft({ ...draft, specification: v })} />
          <Field label="厂家" value={draft.manufacturer} onChange={(v) => setDraft({ ...draft, manufacturer: v })} />
          <Field
            label="当前库存"
            value={draft.stockQuantity}
            onChange={(v) => setDraft({ ...draft, stockQuantity: v })}
            inputMode="numeric"
          />
          <Field
            label="安全库存"
            value={draft.minStock}
            onChange={(v) => setDraft({ ...draft, minStock: v })}
            inputMode="numeric"
          />
          <SelectField
            label="储存条件"
            value={draft.storageCondition}
            options={STORAGE_OPTIONS}
            onChange={(v) => setDraft({ ...draft, storageCondition: v })}
          />
          <Field label="货位" value={draft.location} onChange={(v) => setDraft({ ...draft, location: v })} />
          <Field
            label="有效期"
            value={draft.expiryDate}
            onChange={(v) => setDraft({ ...draft, expiryDate: v })}
            placeholder="YYYY-MM-DD"
          />
          <Field
            label="生产日期"
            value={draft.productionDate}
            onChange={(v) => setDraft({ ...draft, productionDate: v })}
          />
          <Field label="批号" value={draft.lotNumber} onChange={(v) => setDraft({ ...draft, lotNumber: v })} />
          <Field
            label="参考单价"
            value={draft.unitPrice}
            onChange={(v) => setDraft({ ...draft, unitPrice: v })}
            inputMode="numeric"
          />
        </div>
        <Field label="供应商" value={draft.supplier} onChange={(v) => setDraft({ ...draft, supplier: v })} />
        <Field
          label="注册证号"
          value={draft.registrationNumber}
          onChange={(v) => setDraft({ ...draft, registrationNumber: v })}
        />
        <Field label="扫码匹配规则（GTIN）" value={draft.scanRule} onChange={(v) => setDraft({ ...draft, scanRule: v })} />
        <div>
          <Label>切割规则 JSON</Label>
          <Textarea
            className="mt-1 font-mono text-xs"
            rows={3}
            value={draft.scanSegmentsText}
            onChange={(e) => setDraft({ ...draft, scanSegmentsText: e.target.value })}
          />
        </div>
        <div>
          <Label>备注</Label>
          <Textarea className="mt-1" rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </div>
        <Button className="h-12" disabled={saving} onClick={() => void save()}>
          {saving ? "保存中…" : draft.id ? "更新试剂" : "保存预录"}
        </Button>
        <ScannerOverlay
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onDetect={(c) => {
            setCameraOpen(false);
            applyBarcode(c);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input className="pl-9" placeholder="搜索名称 / GTIN / 厂家" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button className="shrink-0" onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-4" />
          预录
        </Button>
      </div>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {filtered.map((r) => {
          const days = daysUntil(r.expiryDate);
          const low = r.minStock > 0 && r.stockQuantity <= r.minStock;
          const expired = days !== null && days < 0;
          const expiring = days !== null && days >= 0 && days <= 30;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setDraft(fromReagent(r))}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-left shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {r.manufacturer} · {r.specification || "无规格"} · {r.location || "无货位"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge variant="muted">{r.category || "未分类"}</Badge>
                    {expired ? <Badge variant="danger">已过期</Badge> : null}
                    {expiring && !expired ? <Badge variant="warn">近效期</Badge> : null}
                    {low ? <Badge variant="warn">低库存</Badge> : null}
                    {r.stockQuantity === 0 ? <Badge variant="out">缺货</Badge> : null}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("text-base font-semibold tabular", low || r.stockQuantity === 0 ? "text-warn" : "text-fg")}>
                    {r.stockQuantity}
                  </p>
                  <p className="text-xs text-subtle">{r.unit}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-subtle" />
              </button>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 ? <p className="py-10 text-center text-sm text-muted">没有匹配的试剂</p> : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text" | "decimal";
}) {
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <Input
        className="mt-1"
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <select
        className="mt-1 flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {value && !options.includes(value) ? <option value={value}>{value}</option> : null}
      </select>
    </div>
  );
}
