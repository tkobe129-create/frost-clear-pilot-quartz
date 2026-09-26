import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScannerOverlay } from "@/components/scanner-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { matchReagentByScan, parseBarcode, stripSymbologyId } from "@/lib/scanner";
import { announceScanSuccess, unlockScanAudio } from "@/lib/scan-feedback";
import { chooseFefoBatch } from "@/lib/stock-batches";
import type { ExtractedFields, PendingItem, Reagent, StockRecord, StockType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  reagents: Reagent[];
  records: StockRecord[];
  submitting: boolean;
  onSubmit: (type: StockType, items: PendingItem[]) => Promise<void>;
};

export function ScanView({ reagents, records, submitting, onSubmit }: Props) {
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
  // Scans can arrive before React paints the previous result. Keep refs as the
  // synchronous source of truth so rapid scanner-gun events never overwrite a
  // previous item or read an old stock direction.
  const pendingRef = useRef<PendingItem[]>([]);
  const tabRef = useRef<StockType>(tab);
  pendingRef.current = pending;
  tabRef.current = tab;

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

  function addContinuousItem(
    reagent: Reagent,
    details: { lotNumber: string; expiryDate: string; productionDate: string; fefo?: boolean },
  ) {
    const list = pendingRef.current;
    const sameItem = list.find(
      (item) =>
        item.reagentId === reagent.id &&
        item.lotNumber === details.lotNumber &&
        item.expiryDate === details.expiryDate &&
        item.productionDate === details.productionDate,
    );
    const already = list.filter((item) => item.reagentId === reagent.id).reduce((sum, item) => sum + item.quantity, 0);

    if (tabRef.current === "out" && already + 1 > reagent.stockQuantity) {
      toast.error(`出库数量超过可用库存 · ${reagent.name}`);
      return false;
    }

    const accumulatedQuantity = sameItem ? sameItem.quantity + 1 : 1;
    const next = sameItem
      ? list.map((item) =>
          item.key === sameItem.key ? { ...item, quantity: accumulatedQuantity } : item,
        )
      : [
          ...list,
          {
            key: `${reagent.id}-${Date.now()}-${list.length}`,
            reagentId: reagent.id,
            reagentName: reagent.name,
            unit: reagent.unit,
            quantity: accumulatedQuantity,
            lotNumber: details.lotNumber,
            expiryDate: details.expiryDate,
            productionDate: details.productionDate,
            note: "",
            stockQuantity: reagent.stockQuantity,
          },
        ];

    // Update both stores immediately. React may batch several scan events into
    // one render, but the next event still sees every item scanned so far.
    pendingRef.current = next;
    setPending(next);
    announceScanSuccess(accumulatedQuantity, reagent.unit);
    // Reuse one toast so rapid continuous scans show the accumulated quantity
    // instead of stacking several misleading "×1" messages.
    toast.success(
      `${details.fefo ? "按最早效期批次 · " : ""}已加入 ${reagent.name} ×${accumulatedQuantity}，可继续扫码`,
      {
        id: "continuous-scan-feedback",
        duration: 1400,
      },
    );
    return true;
  }

  function changeTab(next: StockType) {
    tabRef.current = next;
    setTab(next);
    unlockScanAudio();
    setCameraOpen(true);
  }

  function applyMatch(code: string, options?: { continuous?: boolean }) {
    const cleaned = stripSymbologyId(code);
    if (!cleaned) return;
    setRaw(cleaned);
    const result = matchReagentByScan(cleaned, reagents);
    if (result) {
      let lot = result.fields.lotNumber || result.reagent.lotNumber || "";
      let exp = result.fields.expiryDateFormatted || result.reagent.expiryDate || "";
      let prod = result.fields.productionDateFormatted || result.reagent.productionDate || "";
      let fefoApplied = false;

      // A GTIN-only scan does not identify a batch. For outbound stock, fill
      // the missing batch from the earliest available expiry (FEFO) instead of
      // silently using an arbitrary/default lot.
      if (
        tabRef.current === "out" &&
        !result.fields.lotNumber &&
        !result.fields.expiryDate &&
        !result.fields.expiryDateFormatted
      ) {
        const batch = chooseFefoBatch(result.reagent, records, pendingRef.current);
        if (batch) {
          lot = batch.lotNumber;
          exp = batch.expiryDate;
          prod = batch.productionDate;
          fefoApplied = true;
        }
      }

      setMatched(result.reagent);
      setFields(result.fields);
      setLotNumber(lot);
      setExpiryDate(exp);
      setProductionDate(prod);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 420);

      // Camera and scanner-gun continuous mode: add immediately, merge repeated
      // scans of the same reagent/lot, and leave the input ready for the next scan.
      if (options?.continuous) {
        if (addContinuousItem(result.reagent, { lotNumber: lot, expiryDate: exp, productionDate: prod, fefo: fefoApplied })) {
          clearMatch();
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }

      toast.success(`已匹配 ${result.reagent.name}`);
    } else {
      setMatched(null);
      setFields({});
      toast.error("未找到匹配试剂，请先在试剂页预录");
    }
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
    const list = pendingRef.current;
    if (tabRef.current === "out") {
      const already = list.filter((p) => p.reagentId === matched.id).reduce((s, p) => s + p.quantity, 0);
      if (qty > matched.stockQuantity - already) {
        toast.error("出库数量超过可用库存");
        return;
      }
    }
    const next = [
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
    ];
    pendingRef.current = next;
    setPending(next);
    announceScanSuccess(qty, matched.unit);
    toast.success("已加入待提交");
    clearMatch();
    inputRef.current?.focus();
  }

  async function submit() {
    const items = pendingRef.current;
    if (items.length === 0) {
      toast.error("没有待提交的记录");
      return;
    }
    const submittedType = tabRef.current;
    const submittedQuantities = new Map(items.map((item) => [item.key, item.quantity]));
    await onSubmit(submittedType, items);

    // Keep scans that arrived while the batch was being submitted. This is
    // important when the camera stays open for a truly continuous workflow.
    const remaining = pendingRef.current.flatMap((item) => {
      const submittedQuantity = submittedQuantities.get(item.key) ?? 0;
      const quantity = item.quantity - submittedQuantity;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    });
    pendingRef.current = remaining;
    setPending(remaining);
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
      applyMatch(t, { continuous: true });
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reagents, records]);

  const segments = raw ? parseBarcode(raw) : [];

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-2 rounded-lg bg-bg-elevated p-1">
          {(["in", "out"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => changeTab(id)}
              className={cn(
                "h-16 rounded-md text-lg font-semibold transition-colors sm:h-14",
                tab === id ? (id === "in" ? "bg-primary text-primary-fg" : "bg-out text-primary-fg") : "text-muted",
              )}
            >
              {id === "in" ? "入库" : "出库"}
            </button>
          ))}
        </div>
        {tab === "out" ? (
          <p className="rounded-lg bg-out-soft px-3 py-2 text-xs leading-5 text-out">
            出库规则：优先选择最早有效期批次（FEFO）；条码包含批号时按条码批次执行。
          </p>
        ) : null}

        <section className={cn("rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4", flash && "scan-flash")}>
          <Label className="mt-3 block">扫码结果 / 扫码枪输入</Label>
          <Input
            ref={inputRef}
            value={raw}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="扫码枪扫入后自动加入，或粘贴条码后回车"
            className="mt-1 font-mono"
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                unlockScanAudio();
                applyMatch(raw, { continuous: true });
              }
            }}
          />
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
                    onClick={() => {
                      const next = pendingRef.current.filter((x) => x.key !== p.key);
                      pendingRef.current = next;
                      setPending(next);
                    }}
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
          // Mobile browsers may suspend Web Audio again while the camera stream
          // is active, so resume it on every camera detection as well as when
          // the overlay is opened.
          unlockScanAudio();
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
