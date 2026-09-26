import { createClient } from "@supabase/supabase-js";
import { DEMO_ORDERS, DEMO_RECORDS, DEMO_REAGENTS } from "@/lib/demo-data";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Reagent,
  StockRecord,
  StockType,
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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const LOCAL_KEY = "quandun-github-pages-data-v1";

type ReagentRow = Record<string, unknown>;
type StockRow = Record<string, unknown>;
type OrderRow = Record<string, unknown>;
type OrderItemRow = Record<string, unknown>;

type LocalState = {
  reagents: Reagent[];
  records: StockRecord[];
  orders: PurchaseOrder[];
};

function text(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function number(value: unknown): number {
  return Number(value) || 0;
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultLocalState(): LocalState {
  return {
    reagents: clone(DEMO_REAGENTS),
    records: clone(DEMO_RECORDS),
    orders: clone(DEMO_ORDERS),
  };
}

function readLocalState(): LocalState {
  if (typeof window === "undefined") return defaultLocalState();
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaultLocalState();
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    return {
      reagents: Array.isArray(parsed.reagents) ? parsed.reagents : defaultLocalState().reagents,
      records: Array.isArray(parsed.records) ? parsed.records : defaultLocalState().records,
      orders: Array.isArray(parsed.orders) ? parsed.orders : defaultLocalState().orders,
    };
  } catch {
    return defaultLocalState();
  }
}

function writeLocalState(state: LocalState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a disabled storage API should not break the page.
  }
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

export async function listGitHubReagents(): Promise<Reagent[]> {
  try {
    const { data, error } = await supabase.from("reagents").select("*").order("id", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as ReagentRow[]).map(fromReagent);
  } catch {
    return readLocalState().reagents;
  }
}

export async function listGitHubRecords(): Promise<StockRecord[]> {
  try {
    const { data, error } = await supabase
      .from("stock_records")
      .select("*, reagents(name)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(200);
    if (error) throw error;
    return ((data ?? []) as StockRow[]).map(fromStock);
  } catch {
    return readLocalState().records;
  }
}

export async function listGitHubOrders(): Promise<PurchaseOrder[]> {
  try {
    const [{ data: orders, error: orderError }, { data: items, error: itemError }] = await Promise.all([
      supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }).order("id", { ascending: false }),
      supabase.from("purchase_order_items").select("*").order("id", { ascending: true }),
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
  } catch {
    return readLocalState().orders;
  }
}

export async function saveGitHubReagent(data: SavePayload): Promise<Reagent> {
  try {
    const fields = toReagentFields(data);
    const result = data.id
      ? await supabase.from("reagents").update(fields).eq("id", data.id).select("*").single()
      : await supabase.from("reagents").insert(fields).select("*").single();
    if (result.error) throw result.error;
    return fromReagent(result.data as ReagentRow);
  } catch {
    const state = readLocalState();
    const next = fromSavePayload(data);
    const index = state.reagents.findIndex((item) => item.id === next.id);
    if (index >= 0) state.reagents[index] = next;
    else state.reagents.push(next);
    writeLocalState(state);
    return next;
  }
}

export async function submitGitHubStockBatch(type: StockType, items: ReagentStockItem[]): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("submit_stock_batch", {
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
  } catch {
    const state = readLocalState();
    const nextId = state.records.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    items.forEach((item, index) => {
      const reagent = state.reagents.find((entry) => entry.id === item.reagentId);
      if (reagent) reagent.stockQuantity += type === "in" ? item.quantity : -item.quantity;
      state.records.unshift({
        id: nextId + index,
        reagentId: item.reagentId,
        reagentName: item.reagentName,
        type,
        quantity: item.quantity,
        lotNumber: item.lotNumber,
        expiryDate: item.expiryDate,
        productionDate: item.productionDate,
        note: item.note,
        operator: "检验员",
        department: "检验科",
        reason: "",
        createdAt: new Date().toISOString(),
      });
    });
    writeLocalState(state);
    return items.length;
  }
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

export async function createGitHubRestockOrder(): Promise<PurchaseOrder> {
  try {
    const { data, error } = await supabase.rpc("create_restock_order", { p_note: "一键补货" });
    if (error) throw error;
    const id = number((data as { id?: number } | null)?.id ?? data);
    if (!id) throw new Error("创建采购单失败");
    const orders = await listGitHubOrders();
    const found = orders.find((order) => order.id === id);
    if (found) return found;
    throw new Error("采购单读取失败");
  } catch {
    const state = readLocalState();
    const low = state.reagents.filter((item) => item.minStock > 0 && item.stockQuantity <= item.minStock);
    const orderId = state.orders.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const items = low.map((item, index) => ({
      id: index + 1,
      orderId,
      reagentId: item.id,
      quantity: Math.max(item.minStock * 2 - item.stockQuantity, 1),
      unit: item.unit,
      name: item.name,
      manufacturer: item.manufacturer,
      specification: item.specification,
      supplier: item.supplier,
    }));
    const order: PurchaseOrder = {
      id: orderId,
      status: "submitted",
      note: "一键补货",
      itemCount: items.length,
      createdAt: new Date().toISOString(),
      items,
    };
    state.orders.unshift(order);
    writeLocalState(state);
    return order;
  }
}

export async function receiveGitHubOrder(id: number): Promise<void> {
  try {
    const { error } = await supabase.rpc("receive_purchase_order", { p_id: id, p_operator: "检验员" });
    if (error) throw error;
    return;
  } catch {
    const state = readLocalState();
    const order = state.orders.find((item) => item.id === id);
    if (!order || order.status !== "submitted") return;
    order.status = "received";
    order.items.forEach((item) => {
      const reagent = state.reagents.find((entry) => entry.id === item.reagentId);
      if (reagent) reagent.stockQuantity += item.quantity;
    });
    writeLocalState(state);
  }
}

function fromSavePayload(data: SavePayload): Reagent {
  const state = readLocalState();
  const nextId = state.reagents.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  return {
    id: data.id ?? nextId,
    code: data.code,
    name: data.name,
    category: data.category,
    specification: data.specification,
    manufacturer: data.manufacturer,
    unit: data.unit,
    stockQuantity: data.stockQuantity,
    minStock: data.minStock,
    storageCondition: data.storageCondition,
    location: data.location,
    expiryDate: data.expiryDate,
    registrationNumber: data.registrationNumber,
    notes: data.notes,
    scanRule: data.scanRule,
    scanSegments: data.scanSegments,
    lotNumber: data.lotNumber,
    productionDate: data.productionDate,
    rawBarcode: data.rawBarcode,
    supplier: data.supplier,
    unitPrice: data.unitPrice,
    createdAt: new Date().toISOString(),
  };
}
