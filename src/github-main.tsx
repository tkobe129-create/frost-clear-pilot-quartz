import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { User } from "@supabase/supabase-js";
import { toast, Toaster } from "sonner";
import { TenantAuthScreen, TenantOnboardingScreen } from "@/components/tenant-access";
import { HomeView } from "@/components/home-view";
import { RecordsView } from "@/components/records-view";
import { ReagentsView, type SavePayload } from "@/components/reagents-view";
import { ScanView } from "@/components/scan-view";
import { AppShell, type TabId } from "@/components/shell";
import { computeAlerts } from "@/lib/alerts";
import {
  createGitHubRestockOrder,
  createTenantInvite,
  listGitHubOrders,
  listGitHubRecords,
  listGitHubReagents,
  listMyTenantMemberships,
  receiveGitHubOrder,
  signOutGitHubUser,
  saveGitHubReagent,
  submitGitHubStockBatch,
  supabase,
  type ReagentStockItem,
} from "@/lib/github-data";
import type { PendingItem, PurchaseOrder, Reagent, StockRecord, StockType, TenantMembership } from "@/lib/types";
import "@/styles.css";

export function GitHubPagesApp() {
  const [tab, setTab] = useState<TabId>("home");
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [records, setRecords] = useState<StockRecord[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<TenantMembership | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [receivingId, setReceivingId] = useState<number | null>(null);

  const loadMemberships = useCallback(async () => {
    setAccessLoading(true);
    try {
      const next = await listMyTenantMemberships();
      setMembership(next[0] ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "读取检验科信息失败");
      setMembership(null);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data.session));
      setUser(data.session?.user ?? null);
      if (data.session) await loadMemberships();
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      setUser(session?.user ?? null);
      if (session) void loadMemberships();
      else {
        setMembership(null);
      }
      setAuthReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [loadMemberships]);

  const tenantId = membership?.tenant.id ?? null;
  const isAdmin = membership?.role === "admin";
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName = typeof metadata.display_name === "string" && metadata.display_name.trim() ? metadata.display_name.trim() : "";
  const operatorName = displayName || user?.email || "";

  const refreshAll = useCallback(async () => {
    if (!tenantId) return;
    const [nextReagents, nextRecords, nextOrders] = await Promise.all([
      listGitHubReagents(tenantId),
      listGitHubRecords(tenantId),
      listGitHubOrders(tenantId),
    ]);
    setReagents(nextReagents);
    setRecords(nextRecords);
    setOrders(nextOrders);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void refreshAll().finally(() => setLoading(false));
  }, [refreshAll, tenantId]);

  async function handleSubmit(type: StockType, items: PendingItem[]) {
    if (!tenantId) return;
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
      const count = await submitGitHubStockBatch(tenantId, type, input, operatorName);
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
    if (!tenantId) return;
    setSaving(true);
    try {
      await saveGitHubReagent(tenantId, data);
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
    if (!tenantId || !isAdmin) return;
    setOrdering(true);
    try {
      await createGitHubRestockOrder(tenantId);
      await refreshAll();
      toast.success("已生成补货单");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "下单失败");
    } finally {
      setOrdering(false);
    }
  }

  async function handleReceive(id: number) {
    if (!tenantId || !isAdmin) return;
    setReceivingId(id);
    try {
      await receiveGitHubOrder(tenantId, id, operatorName);
      await refreshAll();
      toast.success("到货已入库");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "入库失败");
    } finally {
      setReceivingId(null);
    }
  }

  async function handleInvite() {
    if (!tenantId || !isAdmin) return;
    try {
      const code = await createTenantInvite(tenantId);
      toast.success(`邀请码：${code}`, { duration: 12_000 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成邀请码失败");
    }
  }

  if (!authReady) return <p className="min-h-dvh bg-bg p-8 text-center text-sm text-muted">正在检查登录状态…</p>;
  if (!signedIn) return <TenantAuthScreen />;
  if (accessLoading) return <p className="min-h-dvh bg-bg p-8 text-center text-sm text-muted">正在读取检验科信息…</p>;
  if (!membership) return <TenantOnboardingScreen />;

  const alertCount = computeAlerts(reagents).length;

  return (
    <AppShell
      tab={tab}
      onTab={setTab}
      alertCount={alertCount}
      tenantName={membership.tenant.name}
      tenantRole={membership.role}
      userName={displayName}
      userEmail={user?.email ?? ""}
      canManageMembers={isAdmin}
      onInvite={() => void handleInvite()}
      onSignOut={() => void signOutGitHubUser()}
    >
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
          canManagePurchases={isAdmin}
          onGoScan={() => setTab("scan")}
          onGoReagents={() => setTab("reagents")}
        />
      ) : null}

      {!loading && tab === "scan" ? (
        <ScanView reagents={reagents} records={records} submitting={submitting} onSubmit={handleSubmit} />
      ) : null}

      {!loading && tab === "reagents" ? (
        <ReagentsView reagents={reagents} saving={saving} onSave={handleSave} canManage={isAdmin} />
      ) : null}

      {!loading && tab === "records" ? <RecordsView records={records} /> : null}
    </AppShell>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("GitHub Pages root element not found");
createRoot(root).render(
  <>
    <GitHubPagesApp />
    <Toaster
      position="top-center"
      richColors={false}
      toastOptions={{
        className: "font-sans",
        style: { background: "#fffcf7", color: "#1c1d1a", border: "1px solid #d8d3c8" },
      }}
    />
  </>,
);
