export type StockType = "in" | "out";

export type ScanSegmentRule = {
  ai: string;
  desc: string;
  start?: number;
  len?: number;
};

export type Reagent = {
  id: number;
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
  scanSegments: ScanSegmentRule[];
  lotNumber: string;
  productionDate: string;
  rawBarcode: string;
  supplier: string;
  unitPrice: number;
  createdAt: string;
};

export type ExtractedFields = {
  gtin?: string;
  lotNumber?: string;
  productionDate?: string;
  productionDateFormatted?: string;
  expiryDate?: string;
  expiryDateFormatted?: string;
  serialNumber?: string;
  quantity?: string;
};

export type StockRecord = {
  id: number;
  reagentId: number;
  reagentName: string;
  type: StockType;
  quantity: number;
  lotNumber: string;
  expiryDate: string;
  productionDate: string;
  note: string;
  operator: string;
  department: string;
  reason: string;
  createdAt: string;
};

export type PendingItem = {
  key: string;
  reagentId: number;
  reagentName: string;
  unit: string;
  quantity: number;
  lotNumber: string;
  expiryDate: string;
  productionDate: string;
  note: string;
  stockQuantity: number;
};

export type PurchaseOrder = {
  id: number;
  status: "submitted" | "received" | "cancelled";
  note: string;
  itemCount: number;
  createdAt: string;
  items: PurchaseOrderItem[];
};

export type PurchaseOrderItem = {
  id: number;
  orderId: number;
  reagentId: number;
  quantity: number;
  unit: string;
  name: string;
  manufacturer: string;
  specification: string;
  supplier: string;
};

export type AlertKind = "expired" | "expiring" | "stockout" | "low";

export type ReagentAlert = {
  reagent: Reagent;
  kind: AlertKind;
  detail: string;
};

export const CATEGORIES = ["免疫", "生化", "凝血", "血球", "分子", "质控", "校准", "其他"] as const;

export const STORAGE_OPTIONS = ["2–8℃", "常温", "-20℃", "-80℃", "避光干燥"] as const;

export const UNITS = ["盒", "瓶", "支", "人份", "套", "桶", "袋", "测试"] as const;
