import { createClient } from "@supabase/supabase-js";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Reagent,
  StockBatch,
  StockRecord,
  StockType,
  Tenant,
  TenantMembership,
  TenantRole,
} from "@/lib/types";
import type { SavePayload } from "@/components/reagents-view";
import { missingDatabaseFunctionsFromOpenApi } from "@/lib/db-contract";
import { lockedRestockReagentIds, splitRestockCandidates, type RestockLedgerRow, type RestockOrderLine } from "@/lib/restock";
import { reconstructAvailableBatches } from "@/lib/stock-batches";

/**
 * GitHub Pages has no server runtime, so the static build talks to the same
 * Supabase project directly with its public anon key. The key is intentionally
 * safe to expose in a browser; access control belongs in Supabase RLS.
 */
const SUPABASE_URL = "https://eqgrtoeivuykemfferwb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ3J0b2VpdnV5a2VtZmZlcndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1Njc0OTQsImV4cCI6MjEwNTE0MzQ5NH0.Jttf6wm6RVj2knEagvw3Y-wFrKTl5I5RvF4pVUqHVRA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

function throwError(error: unknown): never {
  if (error instanceof Error) throw error;
  const message =
    error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "";
  throw new Error(message || "操作失败，请稍后再试");
}

export async function probeRequiredDatabaseFunctions(): Promise<string[]> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return [];
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Accept: "application/openapi+json",
      },
    });
    if (!response.ok) return [];
    return missingDatabaseFunctionsFromOpenApi(await response.text());
  } catch {
    return [];
  }
}

function isMissingRpc(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = String((error as { code: unknown }).code);
  return code === "PGRST202" || code === "42883";
}

type ReagentRow = Record<string, unknown>;
type StockRow = Record<string, unknown>;
type OrderRow = Record<string, unknown>;
type OrderItemRow = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function number(value: unknown): number {
  return Number(value) || 0;
}

function fromTenant(row: Record<string, unknown>): Tenant {
  return {
    id: text(row.id),
    name: text(row.name),
    code: text(row.code),
    status: text(row.status) === "disabled" ? "disabled" : "active",
    createdAt: text(row.created_at),
  };
}

export async function signInWithEmail(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (result.error) throwError(result.error);
  return result.data.session;
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const result = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: (name ?? "").trim() } },
  });
  if (result.error) throwError(result.error);
  return result.data.session;
}

export async function signOutGitHubUser() {
  const result = await supabase.auth.signOut();
  if (result.error) throwError(result.error);
}

export async function listMyTenantMemberships(): Promise<TenantMembership[]> {
  const { data, error } = await supabase
    .from("tenant_members")
    .select("role, tenants(id, name, code, status, created_at)");
  if (error) throwError(error);
  return ((data ?? []) as Array<{ role: string; tenants: Record<string, unknown> | Record<string, unknown>[] | null }>).flatMap((row) => {
    const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
    if (!tenant) return [];
    return [{ tenant: fromTenant(tenant), role: row.role === "admin" ? ("admin" as TenantRole) : ("employee" as TenantRole) }];
  });
}

export async function createTenant(name: string, code: string): Promise<Tenant> {
  const { data, error } = await supabase.rpc("create_tenant", { p_name: name, p_code: code });
  if (error) throwError(error);
  return fromTenant(data as Record<string, unknown>);
}

export async function createTenantInvite(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_tenant_invite", { p_tenant_id: tenantId });
  if (error) throwError(error);
  return text(data);
}

export async function checkPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) return false;
  return Boolean(data);
}

export async function createPlatformTenant(name: string, code: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_platform_tenant", { p_name: name, p_code: code });
  if (error) throwError(error);
  return text(data);
}

export async function listPlatformTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase.rpc("list_platform_tenants");
  if (error) throwError(error);
  return ((data ?? []) as Array<Record<string, unknown>>).map(fromTenant);
}

export async function setPlatformTenantStatus(tenantId: string, status: Tenant["status"]): Promise<void> {
  const { error } = await supabase.rpc("set_platform_tenant_status", {
    p_tenant_id: tenantId,
    p_status: status,
  });
  if (error) throwError(error);
}

export async function acceptTenantInvite(code: string): Promise<Tenant> {
  const { data, error } = await supabase.rpc("accept_tenant_invite", { p_code: code });
  if (error) throwError(error);
  return fromTenant(data as Record<string, unknown>);
}

function parseSegments(value: unknown): Reagent["scanSegments"] {
  if (Array.isArray(value)) return value as Reagent["scanSegments"];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function fromReagent(row: ReagentRow): Reagent {
  return {
    id: number(row.id),
    code: text(row.code),
    name: text(row.name),
    category: text(row.category),
    specification: text(row.specification),
    manufacturer: text(row.manufacturer),
    unit: text(row.unit) || "盒",
    stockQuantity: number(row.stock_quantity),
    minStock: number(row.min_stock),
    storageCondition: text(row.storage_condition),
    location: text(row.location),
    expiryDate: text(row.expiry_date),
    registrationNumber: text(row.registration_number),
    notes: text(row.notes),
    scanRule: text(row.scan_rule),
    scanSegments: parseSegments(row.scan_segments),
    lotNumber: text(row.lot_number),
    productionDate: text(row.production_date),
    rawBarcode: text(row.raw_barcode),
    supplier: text(row.supplier),
    unitPrice: number(row.unit_price),
    createdAt: text(row.created_at),
  };
}

function fromStock(row: StockRow): StockRecord {
  const related = Array.isArray(row.reagents) ? row.reagents[0] : row.reagents;
  const relatedName = related && typeof related === "object" ? text((related as ReagentRow).name) : "";
  return {
    id: number(row.id),
    reagentId: number(row.reagent_id),
    reagentName: relatedName || "未知试剂",
    type: row.type === "out" ? "out" : "in",
    quantity: number(row.quantity),
    lotNumber: text(row.lot_number),
    expiryDate: text(row.expiry_date),
    productionDate: text(row.production_date),
    note: text(row.note),
    operator: text(row.operator),
    department: text(row.department),
    reason: text(row.reason),
    createdAt: text(row.created_at),
  };
}

function fromOrderItem(row: OrderItemRow): PurchaseOrderItem {
  return {
    id: number(row.id),
    orderId: number(row.order_id),
    reagentId: number(row.reagent_id),
    quantity: number(row.quantity),
    unit: text(row.unit),
    name: text(row.name),
    manufacturer: text(row.manufacturer),
    specification: text(row.specification),
    supplier: text(row.supplier),
  };
}

function fromOrder(row: OrderRow, items: OrderItemRow[]): PurchaseOrder {
  const status = text(row.status);
  return {
    id: number(row.id),
    status: status === "received" || status === "cancelled" ? status : "submitted",
    note: text(row.note),
    itemCount: number(row.item_count) || items.length,
    createdAt: text(row.created_at),
    items: items.map(fromOrderItem),
  };
}

function toReagentFields(data: SavePayload) {
  return {
    code: data.code,
    name: data.name,
    category: data.category,
    specification: data.specification,
    manufacturer: data.manufacturer,
    unit: data.unit,
    min_stock: data.minStock,
    storage_condition: data.storageCondition,
    location: data.location,
    expiry_date: data.expiryDate,
    registration_number: data.registrationNumber,
    notes: data.notes,
    scan_rule: data.scanRule,
    scan_segments: data.scanSegments,
    lot_number: data.lotNumber,
    production_date: data.productionDate,
    raw_barcode: data.rawBarcode,
    supplier: data.supplier,
    unit_price: data.unitPrice,
  };
}

export async function listGitHubReagents(tenantId: string): Promise<Reagent[]> {
  const { data, error } = await supabase.from("reagents").select("*").eq("tenant_id", tenantId).order("id", { ascending: true });
  if (error) throwError(error);
  return ((data ?? []) as ReagentRow[]).map(fromReagent);
}

export async function listGitHubRecords(tenantId: string): Promise<StockRecord[]> {
  const { data, error } = await supabase
    .from("stock_records")
    .select("*, reagents(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);
  if (error) throwError(error);
  return ((data ?? []) as StockRow[]).map(fromStock);
}

export async function listAllGitHubStockRecords(tenantId: string): Promise<StockRecord[]> {
  const pageSize = 500;
  const records: StockRecord[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("stock_records")
      .select("*, reagents(name)")
      .eq("tenant_id", tenantId)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throwError(error);
    const page = ((data ?? []) as StockRow[]).map(fromStock);
    records.push(...page);
    if (page.length < pageSize) break;
  }
  return records;
}

export async function listGitHubStockBatches(tenantId: string, reagents: Reagent[]): Promise<StockBatch[]> {
  const { data, error } = await supabase.rpc("list_available_stock_batches", { p_tenant_id: tenantId });
  if (!error) {
    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      reagentId: number(row.reagent_id),
      lotNumber: text(row.lot_number),
      expiryDate: text(row.expiry_date),
      productionDate: text(row.production_date),
      quantity: number(row.quantity),
    }));
  }

  // Compatibility during deployment: until the SQL patch is installed, read
  // the complete paginated ledger instead of using the recent 200-row window.
  if (error.code !== "PGRST202" && error.code !== "42883") throwError(error);
  const records = await listAllGitHubStockRecords(tenantId);
  return reagents.flatMap((reagent) => reconstructAvailableBatches(reagent, records));
}

export async function listGitHubOrdersPage(
  tenantId: string,
  offset = 0,
  pageSize = 10,
): Promise<{ orders: PurchaseOrder[]; hasMore: boolean }> {
  const { data: orders, error: orderError } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    // Read one extra header to determine whether another page exists.
    .range(offset, offset + pageSize);
  if (orderError) throwError(orderError);

  const fetchedRows = (orders ?? []) as OrderRow[];
  const hasMore = fetchedRows.length > pageSize;
  const orderRows = fetchedRows.slice(0, pageSize);
  if (orderRows.length === 0) return { orders: [], hasMore: false };

  // Fetch details only for this page's orders. Page through line items as well,
  // so a large order cannot be silently truncated by PostgREST's row cap.
  const orderIds = orderRows.map((row) => number(row.id));
  const itemPageSize = 500;
  const items: OrderItemRow[] = [];
  for (let itemOffset = 0; ; itemOffset += itemPageSize) {
    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("order_id", orderIds)
      .order("id", { ascending: true })
      .range(itemOffset, itemOffset + itemPageSize - 1);
    if (error) throwError(error);
    const page = (data ?? []) as OrderItemRow[];
    items.push(...page);
    if (page.length < itemPageSize) break;
  }

  const byOrder = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const list = byOrder.get(number(item.order_id)) ?? [];
    list.push(item);
    byOrder.set(number(item.order_id), list);
  }
  return {
    orders: orderRows.map((row) => fromOrder(row, byOrder.get(number(row.id)) ?? [])),
    hasMore,
  };
}

export async function listGitHubOrders(tenantId: string): Promise<PurchaseOrder[]> {
  return (await listGitHubOrdersPage(tenantId, 0, 4)).orders;
}

export async function deleteGitHubReagent(tenantId: string, reagentId: number): Promise<void> {
  const { error } = await supabase.rpc("delete_reagent", {
    p_tenant_id: tenantId,
    p_id: reagentId,
  });
  if (error && isMissingRpc(error)) {
    throw new Error("删除试剂需要先在数据库执行补丁，否则库存流水删不掉");
  }
  if (error) throwError(error);
}

export async function saveGitHubReagent(tenantId: string, data: SavePayload, operator: string): Promise<Reagent> {
  const { data: result, error } = await supabase.rpc("save_reagent", {
    p_tenant_id: tenantId,
    p_id: data.id ?? null,
    p_reagent: toReagentFields(data),
    p_initial_stock: data.id ? 0 : data.stockQuantity,
    p_operator: operator || "管理员",
  });
  if (error) throwError(error);
  return fromReagent(result as ReagentRow);
}

export async function adjustGitHubReagentStock(
  tenantId: string,
  reagentId: number,
  actualStock: number,
  lotNumber: string,
  expiryDate: string,
  reason: string,
  operator: string,
): Promise<Reagent> {
  const { data, error } = await supabase.rpc("adjust_reagent_stock", {
    p_tenant_id: tenantId,
    p_reagent_id: reagentId,
    p_actual_stock: actualStock,
    p_lot_number: lotNumber,
    p_expiry_date: expiryDate,
    p_reason: reason,
    p_operator: operator || "管理员",
  });
  if (error) throwError(error);
  return fromReagent(data as ReagentRow);
}

export async function submitGitHubStockBatch(
  tenantId: string,
  type: StockType,
  items: ReagentStockItem[],
  operator: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("submit_stock_batch", {
    p_tenant_id: tenantId,
    p_type: type,
    p_operator: operator || "检验员",
    p_department: "检验科",
    p_reason: "",
    p_items: items.map((item) => ({
      reagent_id: item.reagentId,
      quantity: item.quantity,
      lot_number: item.lotNumber,
      expiry_date: item.expiryDate,
      production_date: item.productionDate,
      note: item.note,
    })),
  });
  if (error) throwError(error);
  return number(data) || items.length;
}

export type ReagentStockItem = {
  reagentId: number;
  reagentName: string;
  quantity: number;
  lotNumber: string;
  expiryDate: string;
  productionDate: string;
  note: string;
};

async function listSubmittedRestockLines(tenantId: string): Promise<RestockOrderLine[]> {
  const lines: RestockOrderLine[] = [];
  const headerPageSize = 200;
  for (let offset = 0; ; offset += headerPageSize) {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("id, created_at")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .order("id", { ascending: true })
      .range(offset, offset + headerPageSize - 1);
    if (error) throwError(error);
    const headers = (data ?? []) as Array<{ id: unknown; created_at: unknown }>;
    const createdAtByOrder = new Map(headers.map((row) => [number(row.id), text(row.created_at)]));
    const orderIds = [...createdAtByOrder.keys()].filter((id) => id > 0);
    if (orderIds.length > 0) {
      const itemPageSize = 500;
      for (let itemOffset = 0; ; itemOffset += itemPageSize) {
        const { data: items, error: itemError } = await supabase
          .from("purchase_order_items")
          .select("order_id, reagent_id")
          .eq("tenant_id", tenantId)
          .in("order_id", orderIds)
          .order("id", { ascending: true })
          .range(itemOffset, itemOffset + itemPageSize - 1);
        if (itemError) throwError(itemError);
        const page = (items ?? []) as Array<{ order_id: unknown; reagent_id: unknown }>;
        for (const item of page) {
          const orderId = number(item.order_id);
          lines.push({
            reagentId: number(item.reagent_id),
            orderedAt: createdAtByOrder.get(orderId) ?? "",
            orderId,
            status: "submitted",
          });
        }
        if (page.length < itemPageSize) break;
      }
    }
    if (headers.length < headerPageSize) break;
  }
  return lines;
}

async function listRestockLedger(tenantId: string, reagentIds: number[]): Promise<RestockLedgerRow[]> {
  const rows: RestockLedgerRow[] = [];
  const chunkSize = 80;
  for (let index = 0; index < reagentIds.length; index += chunkSize) {
    const chunk = reagentIds.slice(index, index + chunkSize);
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from("stock_records")
        .select("id, reagent_id, type, quantity, created_at")
        .eq("tenant_id", tenantId)
        .in("reagent_id", chunk)
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throwError(error);
      const page = (data ?? []) as Array<Record<string, unknown>>;
      for (const row of page) {
        rows.push({
          id: number(row.id),
          reagentId: number(row.reagent_id),
          type: row.type === "out" ? "out" : "in",
          quantity: number(row.quantity),
          createdAt: text(row.created_at),
        });
      }
      if (page.length < pageSize) break;
    }
  }
  return rows;
}

export async function listLockedRestockReagentIds(tenantId: string, reagents: Reagent[]): Promise<number[]> {
  const lines = await listSubmittedRestockLines(tenantId);
  if (lines.length === 0) return [];
  const reagentIds = [...new Set(lines.map((line) => line.reagentId).filter((id) => id > 0))];
  const ledger = await listRestockLedger(tenantId, reagentIds);
  return lockedRestockReagentIds(reagents, lines, ledger);
}

export async function listOpenOrderReagentIds(tenantId: string): Promise<number[]> {
  const lines = await listSubmittedRestockLines(tenantId);
  return [...new Set(lines.map((line) => line.reagentId).filter((id) => id > 0))];
}

async function loadCreatedOrder(tenantId: string, data: unknown): Promise<PurchaseOrder> {
  const id = number((data as { id?: number } | null)?.id ?? data);
  if (!id) throw new Error("创建采购单失败");
  const orders = await listGitHubOrders(tenantId);
  const found = orders.find((order) => order.id === id);
  if (!found) throw new Error("采购单读取失败");
  return found;
}

export async function createGitHubRestockOrder(tenantId: string): Promise<PurchaseOrder> {
  const auto = await supabase.rpc("create_restock_order_auto", {
    p_tenant_id: tenantId,
    p_note: "一键补货",
  });
  if (!auto.error) return loadCreatedOrder(tenantId, auto.data);
  if (!isMissingRpc(auto.error)) throwError(auto.error);

  // Older database rules either repeat every low-stock reagent, or keep blocking
  // a reagent forever after it appears on a purchase order. Only call them when
  // this order cannot hit either mistake.
  const reagents = await listGitHubReagents(tenantId);
  const [lockedIds, openIds] = await Promise.all([
    listLockedRestockReagentIds(tenantId, reagents),
    listOpenOrderReagentIds(tenantId),
  ]);
  const open = new Set(openIds);
  const { orderable, alreadyOrdered } = splitRestockCandidates(reagents, lockedIds);
  if (orderable.length === 0) {
    throw new Error("缺货试剂都已在采购单中，且入库后库存还没高于安全库存，不会重复下单");
  }
  if (orderable.some((reagent) => open.has(reagent.id))) {
    throw new Error("这些试剂入库后库存曾经高于安全库存，可以再次下单。请先在数据库执行最新补丁");
  }
  if (alreadyOrdered.length > 0) {
    const once = await supabase.rpc("create_restock_order_once", {
      p_tenant_id: tenantId,
      p_note: "一键补货",
    });
    if (!once.error) return loadCreatedOrder(tenantId, once.data);
    if (!isMissingRpc(once.error)) throwError(once.error);
    throw new Error("已下单且库存还没高于安全库存的试剂不会重复下单。请先在数据库执行最新补丁");
  }

  const { data, error } = await supabase.rpc("create_restock_order", {
    p_tenant_id: tenantId,
    p_note: "一键补货",
  });
  if (error) throwError(error);
  return loadCreatedOrder(tenantId, data);
}

export async function receiveGitHubOrder(tenantId: string, id: number, operator: string): Promise<void> {
  const { error } = await supabase.rpc("receive_purchase_order", {
    p_tenant_id: tenantId,
    p_id: id,
    p_operator: operator || "检验员",
  });
  if (error) throwError(error);
}
