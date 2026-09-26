import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { toast, Toaster } from "sonner";
import { HomeView } from "@/components/home-view";
import { RecordsView } from "@/components/records-view";
import { ReagentsView, type SavePayload } from "@/components/reagents-view";
import { ScanView } from "@/components/scan-view";
import { AppShell, type TabId } from "@/components/shell";
import { computeAlerts } from "@/lib/alerts";
import {
  createGitHubRestockOrder,
  listGitHubOrders,
  listGitHubRecords,
  listGitHubReagents,
  receiveGitHubOrder,
  saveGitHubReagent,
  submitGitHubStockBatch,
  type ReagentStockItem,
} from "@/lib/github-data";
import type { PendingItem, PurchaseOrder, Reagent, StockRecord, StockType } from "@/lib/types";
import "@/styles.css";

export function GitHubPagesApp() {
  const [tab, setTab] = useState<TabId>("home");
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [records, setRecords] = useState<StockRecord[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [receivingId, setReceivingId] = useState<number | null>(null);

  const refreshAll = useCallback(async () => {
    const [nextReagents, nextRecords, nextOrders] = await Promise.all([
      listGitHubReagents(),
      listGitHubRecords(),
      listGitHubOrders(),
    ]);
    setReagents(nextReagents);
    setRecords(nextRecords);
    setOrders(nextOrders);
  }, []);

  useEffect(() => {
    void refreshAll().finally(() => setLoading(false));
  }, [refreshAll]);

  async function handleSubmit(type: StockType, items: PendingItem[]) {
    setSubmitting(true);
    try {
      const input: ReagentStockItem[] = items.map((item) => ({
        reagentId: item.reagentId,
        reagentName: item.reagentName,
        quantity: item.quantity,
        lotNumber: item.lotNumber,
        expiryDate: item.expiryDate,
        productionDate: item.productionDate,
        note: item.note,
      }));
      const count = await submitGitHubStockBatch(type, input);
      await refreshAll();
      toast.success(`已提交 ${count} 条${type === "in" ? "入库" : "出库"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "提交失败");
      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave(data: SavePayload) {
    setSaving(true);
    try {
      await saveGitHubReagent(data);
      await refreshAll();
      toast.success("试剂已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleOrder() {
    setOrdering(true);
    try {
      await createGitHubRestockOrder();
      await refreshAll();
      toast.success("已生成补货单");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "下单失败");
    } finally {
      setOrdering(false);
    }
  }

  async function handleReceive(id: number) {
    setReceivingId(id);
    try {
      await receiveGitHubOrder(id);
      await refreshAll();
      toast.success("到货已入库");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "入库失败");
    } finally {
      setReceivingId(null);
    }
  }

  const alertCount = computeAlerts(reagents).length;

  return (
    <AppShell tab={tab} onTab={setTab} alertCount={alertCount}>
      {loading ? <p className="py-16 text-center text-sm text-muted">正在读取库存…</p> : null}

      {!loading && tab === "home" ? (
        <HomeView
          reagents={reagents}
          records={records}
          orders={orders}
          ordering={ordering}
          receivingId={receivingId}
          onOrder={() => void handleOrder()}
          onReceive={(id) => void handleReceive(id)}
          onGoScan={() => setTab("scan")}
          onGoReagents={() => setTab("reagents")}
        />
      ) : null}

      {!loading && tab === "scan" ? (
        <ScanView reagents={reagents} submitting={submitting} onSubmit={handleSubmit} />
      ) : null}

      {!loading && tab === "reagents" ? (
        <ReagentsView reagents={reagents} saving={saving} onSave={handleSave} />
      ) : null}

      {!loading && tab === "records" ? <RecordsView records={records} /> : null}

      <Toaster
        position="top-center"
        richColors={false}
        toastOptions={{
          className: "font-sans",
          style: { background: "#fffcf7", color: "#1c1d1a", border: "1px solid #d8d3c8" },
        }}
      />
    </AppShell>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("GitHub Pages root element not found");
createRoot(root).render(<GitHubPagesApp />);
