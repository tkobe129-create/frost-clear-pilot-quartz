import { createClient } from "@supabase/supabase-js";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Reagent,
  StockRecord,
  StockType,
  Tenant,
  TenantMembership,
  TenantRole,
} from "@/lib/types";
import type { SavePayload } from "@/components/reagents-view";

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
  if (result.error) throw result.error;
  return result.data.session;
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await supabase.auth.signUp({ email: email.trim(), password });
  if (result.error) throw result.error;
  return result.data.session;
}

export async function signOutGitHubUser() {
  const result = await supabase.auth.signOut();
  if (result.error) throw result.error;
}

export async function listMyTenantMemberships(): Promise<TenantMembership[]> {
  const { data, error } = await supabase
    .from("tenant_members")
    .select("role, tenants(id, name, code, status, created_at)");
  if (error) throw error;
  return ((data ?? []) as Array<{ role: string; tenants: Record<string, unknown> | Record<string, unknown>[] | null }>).flatMap((row) => {
    const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
    if (!tenant) return [];
    return [{ tenant: fromTenant(tenant), role: row.role === "admin" ? ("admin" as TenantRole) : ("employee" as TenantRole) }];
  });
}

export async function claimDefaultTenant(): Promise<Tenant> {
  const { data, error } = await supabase.rpc("claim_default_tenant");
  if (error) throw error;
  return fromTenant(data as Record<string, unknown>);
}

export async function createTenant(name: string, code: string): Promise<Tenant> {
  const { data, error } = await supabase.rpc("create_tenant", { p_name: name, p_code: code });
  if (error) throw error;
  return fromTenant(data as Record<string, unknown>);
}

export async function createTenantInvite(tenantId: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_tenant_invite", { p_tenant_id: tenantId });
  if (error) throw error;
  return text(data);
}

export async function acceptTenantInvite(code: string): Promise<Tenant> {
  const { data, error } = await supabase.rpc("accept_tenant_invite", { p_code: code });
  if (error) throw error;
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
    stock_quantity: data.stockQuantity,
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
  if (error) throw error;
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
  if (error) throw error;
  return ((data ?? []) as StockRow[]).map(fromStock);
}

export async function listGitHubOrders(tenantId: string): Promise<PurchaseOrder[]> {
  const [{ data: orders, error: orderError }, { data: items, error: itemError }] = await Promise.all([
    supabase.from("purchase_orders").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).order("id", { ascending: false }),
    supabase.from("purchase_order_items").select("*").eq("tenant_id", tenantId).order("id", { ascending: true }),
  ]);
  if (orderError) throw orderError;
  if (itemError) throw itemError;
  const byOrder = new Map<number, OrderItemRow[]>();
  for (const item of (items ?? []) as OrderItemRow[]) {
    const list = byOrder.get(number(item.order_id)) ?? [];
    list.push(item);
    byOrder.set(number(item.order_id), list);
  }
  return ((orders ?? []) as OrderRow[]).map((row) => fromOrder(row, byOrder.get(number(row.id)) ?? []));
}

export async function saveGitHubReagent(tenantId: string, data: SavePayload): Promise<Reagent> {
  const fields = { ...toReagentFields(data), tenant_id: tenantId };
  const result = data.id
    ? await supabase.from("reagents").update(fields).eq("id", data.id).eq("tenant_id", tenantId).select("*").single()
    : await supabase.from("reagents").insert(fields).select("*").single();
  if (result.error) throw result.error;
  return fromReagent(result.data as ReagentRow);
}

export async function submitGitHubStockBatch(tenantId: string, type: StockType, items: ReagentStockItem[]): Promise<number> {
  const { data, error } = await supabase.rpc("submit_stock_batch", {
    p_tenant_id: tenantId,
    p_type: type,
    p_operator: "检验员",
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
  if (error) throw error;
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

export async function createGitHubRestockOrder(tenantId: string): Promise<PurchaseOrder> {
  const { data, error } = await supabase.rpc("create_restock_order", {
    p_tenant_id: tenantId,
    p_note: "一键补货",
  });
  if (error) throw error;
  const id = number((data as { id?: number } | null)?.id ?? data);
  if (!id) throw new Error("创建采购单失败");
  const orders = await listGitHubOrders(tenantId);
  const found = orders.find((order) => order.id === id);
  if (!found) throw new Error("采购单读取失败");
  return found;
}

export async function receiveGitHubOrder(tenantId: string, id: number): Promise<void> {
  const { error } = await supabase.rpc("receive_purchase_order", {
    p_tenant_id: tenantId,
    p_id: id,
    p_operator: "检验员",
  });
  if (error) throw error;
}
