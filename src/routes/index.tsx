import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HomeView } from "@/components/home-view";
import { RecordsView } from "@/components/records-view";
import { ReagentsView, type SavePayload } from "@/components/reagents-view";
import { ScanView } from "@/components/scan-view";
import { AppShell, type TabId } from "@/components/shell";
import { computeAlerts } from "@/lib/alerts";
import {
  createRestockOrder,
  listOrders,
  listReagents,
  listStockRecords,
  receiveOrder,
  saveReagent,
  submitStockBatch,
} from "@/lib/reagents";
import type { PendingItem, StockType } from "@/lib/types";

export const Route = createFileRoute("/")({
  component: Home,
  errorComponent: PreviewError,
});

function PreviewError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="min-h-dvh bg-bg p-6 text-fg">
      <h1 className="text-lg font-semibold">权盾智检</h1>
      <p className="mt-2 text-sm text-muted">页面加载遇到问题，请刷新预览。</p>
      <p className="mt-3 break-all text-xs text-subtle">{message}</p>
    </div>
  );
}

function Home() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("home");

  const reagentsQuery = useQuery({
    queryKey: ["reagents"],
    queryFn: () => listReagents(),
    retry: 1,
  });
  const recordsQuery = useQuery({
    queryKey: ["records"],
    queryFn: () => listStockRecords(),
    retry: 1,
  });
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
    retry: 1,
  });

  const reagents = reagentsQuery.data ?? [];
  const records = recordsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const alertCount = useMemo(() => computeAlerts(reagents).length, [reagents]);
  const loading = reagentsQuery.isPending || recordsQuery.isPending || ordersQuery.isPending;
  const loadError = reagentsQuery.error || recordsQuery.error || ordersQuery.error;

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reagents"] }),
      queryClient.invalidateQueries({ queryKey: ["records"] }),
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
    ]);
  }

  const stockMutation = useMutation({
    mutationFn: (input: { type: StockType; items: PendingItem[] }) =>
      submitStockBatch({
        data: {
          type: input.type,
          operator: "检验员",
          department: "检验科",
          items: input.items.map((i) => ({
            reagentId: i.reagentId,
            quantity: i.quantity,
            lotNumber: i.lotNumber,
            expiryDate: i.expiryDate,
            productionDate: i.productionDate,
            note: i.note,
          })),
        },
      }),
    onSuccess: async (res, vars) => {
      toast.success(`已提交 ${res.count} 条${vars.type === "in" ? "入库" : "出库"}`);
      await refreshAll();
    },
    onError: (err: Error) => toast.error(err.message || "提交失败"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: SavePayload) => saveReagent({ data }),
    onSuccess: async () => {
      toast.success("试剂已保存");
      await refreshAll();
    },
    onError: (err: Error) => toast.error(err.message || "保存失败"),
  });

  const orderMutation = useMutation({
    mutationFn: () => createRestockOrder({ data: { note: "一键补货" } }),
    onSuccess: async (order) => {
      toast.success(`已生成采购单 #${order.id}，共 ${order.itemCount} 项`);
      await refreshAll();
    },
    onError: (err: Error) => toast.error(err.message || "下单失败"),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: number) => receiveOrder({ data: { id, operator: "检验员" } }),
    onSuccess: async () => {
      toast.success("到货已入库");
      await refreshAll();
    },
    onError: (err: Error) => toast.error(err.message || "入库失败"),
  });

  return (
    <AppShell tab={tab} onTab={setTab} alertCount={alertCount}>
      {loading ? (
        <p className="py-16 text-center text-sm text-muted">正在读取云端库存…</p>
      ) : null}

      {loadError && !loading ? (
        <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          云端读取失败：{loadError instanceof Error ? loadError.message : "请刷新重试"}
        </div>
      ) : null}

      {!loading && tab === "home" ? (
        <HomeView
          reagents={reagents}
          records={records}
          orders={orders}
          ordering={orderMutation.isPending}
          receivingId={receiveMutation.isPending ? (receiveMutation.variables ?? null) : null}
          onOrder={() => orderMutation.mutate()}
          onReceive={(id) => receiveMutation.mutate(id)}
          onGoScan={() => setTab("scan")}
          onGoReagents={() => setTab("reagents")}
        />
      ) : null}

      {tab === "scan" ? (
        <ScanView
          reagents={reagents}
          records={records}
          submitting={stockMutation.isPending}
          onSubmit={async (type, items) => {
            await stockMutation.mutateAsync({ type, items });
          }}
        />
      ) : null}

      {tab === "reagents" ? (
        <ReagentsView
          reagents={reagents}
          saving={saveMutation.isPending}
          onSave={async (data) => {
            await saveMutation.mutateAsync(data);
          }}
        />
      ) : null}

      {tab === "records" ? <RecordsView records={records} /> : null}
    </AppShell>
  );
}
