import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScannerOverlay } from "@/components/scanner-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDemoBarcode, matchReagentByScan, parseBarcode, stripSymbologyId, SUPPORTED_FORMATS } from "@/lib/scanner";
import type { ExtractedFields, PendingItem, Reagent, StockType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  reagents: Reagent[];
  submitting: boolean;
  onSubmit: (type: StockType, items: PendingItem[]) => Promise<void>;
};

export function ScanView({ reagents, submitting, onSubmit }: Props) {
  const [tab, setTab] = useState<StockType>("in");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [matched, setMatched] = useState<Reagent | null>(null);
  const [fields, setFields] = useState<ExtractedFields>({});
  const [quantity, setQuantity] = useState("1");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep latest pending & tab for continuous auto-add without stale closure
  const pendingRef = useRef(pending);
  const tabRef = useRef(tab);
  pendingRef.current = pending;
  tabRef.current = tab;

  const demos = useMemo(() => reagents.slice(0, 6), [reagents]);

  function applyMatch(code: string, options?: { continuous?: boolean }) {
    const cleaned = stripSymbologyId(code);
    if (!cleaned) return;
    setRaw(cleaned);
    const result = matchReagentByScan(cleaned, reagents);
    if (result) {
      const lot = result.fields.lotNumber || result.reagent.lotNumber || "";
      const exp = result.fields.expiryDateFormatted || result.reagent.expiryDate || "";
      const prod = result.fields.productionDateFormatted || result.reagent.productionDate || "";

      setMatched(result.reagent);
      setFields(result.fields);
      setLotNumber(lot);
      setExpiryDate(exp);
      setProductionDate(prod);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 420);

      // Continuous camera mode: auto-add qty=1 and clear form so next scan is ready
      if (options?.continuous) {
        const qty = 1;
        if (tabRef.current === "out") {
          const already = pendingRef.current
            .filter((p) => p.reagentId === result.reagent.id)
            .reduce((s, p) => s + p.quantity, 0);
          if (qty > result.reagent.stockQuantity - already) {
            toast.error(`出库数量超过可用库存 · ${result.reagent.name}`);
            return;
          }
        }
        setPending((list) => [
          ...list,
          {
            key: `${result.reagent.id}-${Date.now()}`,
            reagentId: result.reagent.id,
            reagentName: result.reagent.name,
            unit: result.reagent.unit,
            quantity: qty,
            lotNumber: lot,
            expiryDate: exp,
            productionDate: prod,
            note: "",
            stockQuantity: result.reagent.stockQuantity,
          },
        ]);
        toast.success(`已加入 ${result.reagent.name} ×1，可继续扫码`);
        // Clear form so UI is ready for next scan (camera stays open)
        setMatched(null);
        setFields({});
        setRaw("");
        setQuantity("1");
        setLotNumber("");
        setExpiryDate("");
        setProductionDate("");
        setNote("");
        return;
      }

      toast.success(`已匹配 ${result.reagent.name}`);
    } else {
      setMatched(null);
      setFields({});
      toast.error("未找到匹配试剂，请先在试剂页预录");
    }
  }

  function clearMatch() {
    setMatched(null);
    setFields({});
    setRaw("");
    setQuantity("1");
    setLotNumber("");
    setExpiryDate("");
    setProductionDate("");
    setNote("");
  }

  function addToPending() {
    if (!matched) {
      toast.error("请先扫码或选择试剂");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("请输入有效数量");
      return;
    }
    if (tab === "out") {
      const already = pending.filter((p) => p.reagentId === matched.id).reduce((s, p) => s + p.quantity, 0);
      if (qty > matched.stockQuantity - already) {
        toast.error("出库数量超过可用库存");
        return;
      }
    }
    setPending((list) => [
      ...list,
      {
        key: `${matched.id}-${Date.now()}`,
        reagentId: matched.id,
        reagentName: matched.name,
        unit: matched.unit,
        quantity: qty,
        lotNumber,
        expiryDate,
        productionDate,
        note,
        stockQuantity: matched.stockQuantity,
      },
    ]);
    toast.success("已加入待提交");
    clearMatch();
    inputRef.current?.focus();
  }

  async function submit() {
    if (pending.length === 0) {
      toast.error("没有待提交的记录");
      return;
    }
    await onSubmit(tab, pending);
    setPending([]);
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (!text) return;
      const t = text.trim();
      if (t.length < 6) return;
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement).tagName)) {
        return;
      }
      e.preventDefault();
      applyMatch(t);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reagents]);

  const segments = raw ? parseBarcode(raw) : [];

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-2 rounded-lg bg-bg-elevated p-1">
          {(["in", "out"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-11 rounded-md text-sm font-medium transition-colors",
                tab === id ? (id === "in" ? "bg-primary text-primary-fg" : "bg-out text-primary-fg") : "text-muted",
              )}
            >
              {id === "in" ? "入库" : "出库"}
            </button>
          ))}
        </div>

        <section className={cn("rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4", flash && "scan-flash")}>
          <Button className="h-12 w-full" onClick={() => setCameraOpen(true)}>
            <Camera className="size-4" />
            打开摄像头连续扫码
          </Button>
          <p className="mt-3 text-xs text-subtle">
            支持连续扫码：识别成功后自动加入待提交（数量 1），摄像头保持开启可继续扫描。也支持扫码枪和粘贴。
          </p>
          <p className="mt-1 break-words text-xs leading-5 text-subtle">{SUPPORTED_FORMATS.join(" · ")}</p>
          <Label className="mt-3 block">扫码结果 / 粘贴条码</Label>
          <Input
            ref={inputRef}
            value={raw}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="对准扫码枪，或粘贴条码后回车"
            className="mt-1 font-mono"
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyMatch(raw);
              }
            }}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {demos.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => applyMatch(buildDemoBarcode(r))}
                className="rounded-full border border-border bg-bg-elevated px-2.5 py-1 text-xs text-muted"
              >
                示例 · {r.name.replace(/测定试剂盒|测定试剂|试剂盒/g, "")}
              </button>
            ))}
          </div>
        </section>

        {segments.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {segments.map((s, i) => (
              <span
                key={`${s.ai}-${i}`}
                className="max-w-full break-all rounded-md bg-primary-soft px-2 py-1 font-mono text-xs text-primary"
              >
                {s.ai ? `(${s.ai}) ` : ""}
                {s.desc} {s.value}
              </span>
            ))}
          </div>
        ) : null}

        {matched ? (
          <section className="rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{matched.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {matched.manufacturer} · {matched.specification}
                </p>
              </div>
              <Badge variant={matched.stockQuantity <= matched.minStock ? "warn" : "ok"}>
                库存 {matched.stockQuantity} {matched.unit}
              </Badge>
            </div>
            {fields.gtin ? <p className="mt-2 break-all font-mono text-xs text-subtle">GTIN {fields.gtin}</p> : null}

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>数量</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0"
                    onClick={() => setQuantity(String(Math.max(1, Number(quantity || 1) - 1)))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="text-center text-base tabular"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0"
                    onClick={() => setQuantity(String(Number(quantity || 0) + 1))}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              <Field label="批号" value={lotNumber} onChange={setLotNumber} />
              <Field label="有效期" value={expiryDate} onChange={setExpiryDate} placeholder="YYYY-MM-DD" />
              <Field label="生产日期" value={productionDate} onChange={setProductionDate} placeholder="YYYY-MM-DD" />
              <Field label="备注" value={note} onChange={setNote} />
            </div>

            <div className="mt-3 flex gap-2">
              <Button className="h-11 flex-1" onClick={addToPending}>
                加入待提交
              </Button>
              <Button variant="ghost" className="h-11" onClick={clearMatch}>
                清除
              </Button>
            </div>
          </section>
        ) : null}
      </div>

      <section className="rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4 lg:sticky lg:top-0">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">待提交 · {tab === "in" ? "入库" : "出库"}</h2>
          <span className="text-xs text-subtle">{pending.length} 条</span>
        </div>
        {pending.length === 0 ? (
          <p className="py-5 text-center text-sm text-muted">连续扫码会自动加入，也可手动确认后一次提交</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-2 rounded-lg bg-bg-elevated px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">{p.reagentName}</p>
                  <p className="text-xs text-subtle">
                    {p.lotNumber || "无批号"} · {p.expiryDate || "无效期"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular">
                    {p.quantity} {p.unit}
                  </span>
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center text-subtle"
                    onClick={() => setPending((list) => list.filter((x) => x.key !== p.key))}
                    aria-label="移除"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button
          className="mt-3 h-12 w-full"
          variant={tab === "out" ? "warn" : "default"}
          disabled={submitting || pending.length === 0}
          onClick={() => void submit()}
        >
          {submitting ? "提交中…" : `提交 ${pending.length} 条${tab === "in" ? "入库" : "出库"}`}
        </Button>
      </section>

      <ScannerOverlay
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDetect={(code) => {
          // Continuous mode: keep camera open, auto-add on match
          applyMatch(code, { continuous: true });
        }}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <Input className="mt-1" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
