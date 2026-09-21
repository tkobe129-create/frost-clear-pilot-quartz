import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabase, throwIfError } from "@/lib/supabase";
import type { PurchaseOrder, PurchaseOrderItem, Reagent, StockRecord, StockType } from "@/lib/types";

type ReagentRow = {
  id: number;
  code: string;
  name: string;
  category: string;
  specification: string;
  manufacturer: string;
  unit: string;
  stock_quantity: number;
  min_stock: number;
  storage_condition: string;
  location: string;
  expiry_date: string;
  registration_number: string;
  notes: string;
  scan_rule: string;
  scan_segments: unknown;
  lot_number: string;
  production_date: string;
  raw_barcode: string;
  supplier: string;
  unit_price: number;
  created_at: string;
};

type StockRow = {
  id: number;
  reagent_id: number;
  type: string;
  quantity: number;
  lot_number: string;
  expiry_date: string;
  production_date: string;
  note: string;
  operator: string;
  department: string;
  reason: string;
  created_at: string;
  reagents?: { name: string } | { name: string }[] | null;
};

type OrderRow = {
  id: number;
  status: string;
  note: string;
  item_count: number;
  created_at: string;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  reagent_id: number;
  quantity: number;
  unit: string;
  name: string;
  manufacturer: string;
  specification: string;
  supplier: string;
};

function parseSegments(raw: unknown): Reagent["scanSegments"] {
  if (Array.isArray(raw)) return raw as Reagent["scanSegments"];
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw || "[]") as Reagent["scanSegments"];
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

function fromReagent(r: ReagentRow): Reagent {
  return {
    id: r.id,
    code: r.code || "",
    name: r.name || "",
    category: r.category || "",
    specification: r.specification || "",
    manufacturer: r.manufacturer || "",
    unit: r.unit || "",
    stockQuantity: Number(r.stock_quantity) || 0,
    minStock: Number(r.min_stock) || 0,
    storageCondition: r.storage_condition || "",
    location: r.location || "",
    expiryDate: r.expiry_date || "",
    registrationNumber: r.registration_number || "",
    notes: r.notes || "",
    scanRule: r.scan_rule || "",
    scanSegments: parseSegments(r.scan_segments),
    lotNumber: r.lot_number || "",
    productionDate: r.production_date || "",
    rawBarcode: r.raw_barcode || "",
    supplier: r.supplier || "",
    unitPrice: Number(r.unit_price) || 0,
    createdAt: r.created_at,
  };
}

function fromOrderItem(item: OrderItemRow): PurchaseOrderItem {
  return {
    id: item.id,
    orderId: item.order_id,
    reagentId: item.reagent_id,
    quantity: Number(item.quantity) || 0,
    unit: item.unit || "",
    name: item.name || "",
    manufacturer: item.manufacturer || "",
    specification: item.specification || "",
    supplier: item.supplier || "",
  };
}

function fromOrder(order: OrderRow, items: OrderItemRow[]): PurchaseOrder {
  return {
    id: order.id,
    status: order.status === "received" || order.status === "cancelled" ? order.status : "submitted",
    note: order.note || "",
    itemCount: Number(order.item_count) || items.length,
    createdAt: order.created_at,
    items: items.map(fromOrderItem),
  };
}

async function loadOrder(id: number): Promise<PurchaseOrder> {
  const sb = getSupabase();
  const { data: order, error } = await sb.from("purchase_orders").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "读取采购单失败");
  if (!order) throw new Error("采购单不存在");
  const { data: items, error: itemError } = await sb
    .from("purchase_order_items")
    .select("*")
    .eq("order_id", id)
    .order("id", { ascending: true });
  throwIfError(itemError, "读取采购明细失败");
  return fromOrder(order as OrderRow, (items ?? []) as OrderItemRow[]);
}

const reagentInput = z.object({
  id: z.number().optional(),
  code: z.string(),
  name: z.string(),
  category: z.string().optional().default(""),
  specification: z.string().optional().default(""),
  manufacturer: z.string().optional().default(""),
  unit: z.string().optional().default("盒"),
  stockQuantity: z.number().optional().default(0),
  minStock: z.number().optional().default(0),
  storageCondition: z.string().optional().default(""),
  location: z.string().optional().default(""),
  expiryDate: z.string().optional().default(""),
  registrationNumber: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  scanRule: z.string().optional().default(""),
  scanSegments: z
    .array(
      z.object({
        ai: z.string(),
        desc: z.string(),
        start: z.number().optional(),
        len: z.number().optional(),
      }),
    )
    .optional()
    .default([]),
  lotNumber: z.string().optional().default(""),
  productionDate: z.string().optional().default(""),
  rawBarcode: z.string().optional().default(""),
  supplier: z.string().optional().default(""),
  unitPrice: z.number().optional().default(0),
});

function toReagentFields(data: z.infer<typeof reagentInput>) {
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
    scan_segments: data.scanSegments ?? [],
    lot_number: data.lotNumber,
    production_date: data.productionDate,
    raw_barcode: data.rawBarcode,
    supplier: data.supplier,
    unit_price: data.unitPrice,
  };
}

export const listReagents = createServerFn({ method: "GET" }).handler(async (): Promise<Reagent[]> => {
  const { data, error } = await getSupabase().from("reagents").select("*").order("id", { ascending: true });
  throwIfError(error, "读取试剂失败");
  return ((data ?? []) as ReagentRow[]).map(fromReagent);
});

export const saveReagent = createServerFn({ method: "POST" })
  .validator(reagentInput)
  .handler(async ({ data }): Promise<Reagent> => {
    const sb = getSupabase();
    const fields = toReagentFields(data);
    if (data.id) {
      const { data: row, error } = await sb.from("reagents").update(fields).eq("id", data.id).select("*").maybeSingle();
      throwIfError(error, "保存失败");
      if (!row) throw new Error("试剂不存在");
      return fromReagent(row as ReagentRow);
    }
    const { data: row, error } = await sb.from("reagents").insert(fields).select("*").single();
    throwIfError(error, "保存失败");
    return fromReagent(row as ReagentRow);
  });

export const deleteReagent = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sb = getSupabase();
    const { count: stockCount, error: stockError } = await sb
      .from("stock_records")
      .select("id", { count: "exact", head: true })
      .eq("reagent_id", data.id);
    throwIfError(stockError);
    if ((stockCount ?? 0) > 0) throw new Error("该试剂已有出入库记录，无法删除");
    const { count: orderCount, error: orderError } = await sb
      .from("purchase_order_items")
      .select("id", { count: "exact", head: true })
      .eq("reagent_id", data.id);
    throwIfError(orderError);
    if ((orderCount ?? 0) > 0) throw new Error("该试剂已有采购单，无法删除");
    const { error } = await sb.from("reagents").delete().eq("id", data.id);
    throwIfError(error, "删除失败");
    return { ok: true };
  });

const stockItem = z.object({
  reagentId: z.number(),
  quantity: z.number().int().positive(),
  lotNumber: z.string().optional().default(""),
  expiryDate: z.string().optional().default(""),
  productionDate: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

export const submitStockBatch = createServerFn({ method: "POST" })
  .validator(
    z.object({
      type: z.enum(["in", "out"]),
      operator: z.string().optional().default("检验员"),
      department: z.string().optional().default("检验科"),
      reason: z.string().optional().default(""),
      items: z.array(stockItem).min(1),
    }),
  )
  .handler(async ({ data }): Promise<{ count: number }> => {
    const { data: count, error } = await getSupabase().rpc("submit_stock_batch", {
      p_type: data.type,
      p_operator: data.operator || "检验员",
      p_department: data.department || "检验科",
      p_reason: data.reason || "",
      p_items: data.items.map((item) => ({
        reagent_id: item.reagentId,
        quantity: item.quantity,
        lot_number: item.lotNumber,
        expiry_date: item.expiryDate,
        production_date: item.productionDate,
        note: item.note,
      })),
    });
    throwIfError(error, "提交失败");
    return { count: Number(count) || data.items.length };
  });

export const listStockRecords = createServerFn({ method: "GET" }).handler(async (): Promise<StockRecord[]> => {
  const { data, error } = await getSupabase()
    .from("stock_records")
    .select("*, reagents(name)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);
  throwIfError(error, "读取记录失败");
  return ((data ?? []) as StockRow[]).map((r) => {
    const related = Array.isArray(r.reagents) ? r.reagents[0] : r.reagents;
    return {
      id: r.id,
      reagentId: r.reagent_id,
      reagentName: related?.name || "未知试剂",
      type: (r.type === "out" ? "out" : "in") as StockType,
      quantity: Number(r.quantity) || 0,
      lotNumber: r.lot_number || "",
      expiryDate: r.expiry_date || "",
      productionDate: r.production_date || "",
      note: r.note || "",
      operator: r.operator || "",
      department: r.department || "",
      reason: r.reason || "",
      createdAt: r.created_at,
    };
  });
});

export const createRestockOrder = createServerFn({ method: "POST" })
  .validator(z.object({ note: z.string().optional().default("") }).optional())
  .handler(async ({ data }): Promise<PurchaseOrder> => {
    const { data: created, error } = await getSupabase().rpc("create_restock_order", {
      p_note: data?.note || "一键补货",
    });
    throwIfError(error, "下单失败");
    const id = Number((created as { id?: number } | null)?.id);
    if (!id) throw new Error("创建采购单失败");
    return loadOrder(id);
  });

export const listOrders = createServerFn({ method: "GET" }).handler(async (): Promise<PurchaseOrder[]> => {
  const sb = getSupabase();
  const { data: orders, error } = await sb
    .from("purchase_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  throwIfError(error, "读取采购单失败");
  const { data: items, error: itemError } = await sb.from("purchase_order_items").select("*").order("id", { ascending: true });
  throwIfError(itemError, "读取采购明细失败");
  const byOrder = new Map<number, OrderItemRow[]>();
  for (const item of (items ?? []) as OrderItemRow[]) {
    const list = byOrder.get(item.order_id) ?? [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }
  return ((orders ?? []) as OrderRow[]).map((order) => fromOrder(order, byOrder.get(order.id) ?? []));
});

export const receiveOrder = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number(), operator: z.string().optional().default("检验员") }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { error } = await getSupabase().rpc("receive_purchase_order", {
      p_id: data.id,
      p_operator: data.operator || "检验员",
    });
    throwIfError(error, "入库失败");
    return { ok: true };
  });
