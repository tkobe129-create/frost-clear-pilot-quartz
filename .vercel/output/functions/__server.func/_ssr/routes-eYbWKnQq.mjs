import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { _ as ChevronRight, a as Search, b as CameraOff, c as Plus, d as LayoutDashboard, f as ImagePlus, g as ClipboardCopy, h as FlashlightOff, i as Trash2, l as PackagePlus, m as Flashlight, n as Truck, o as ScrollText, p as FlaskConical, s as ScanLine, t as X, u as Minus, v as Check, y as Camera } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as listReagents, c as saveReagent, i as listOrders, l as submitStockBatch, n as Route, o as listStockRecords, r as createRestockOrder, s as receiveOrder } from "./router-CelxkpCO.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-eYbWKnQq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-primary-soft text-primary",
		muted: "bg-bg-elevated text-muted border border-border",
		ok: "bg-ok-soft text-ok",
		warn: "bg-warn-soft text-warn",
		danger: "bg-danger-soft text-danger",
		out: "bg-out-soft text-out"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", {
	variants: {
		variant: {
			default: "bg-primary text-primary-fg hover:bg-primary-hover",
			secondary: "bg-primary-soft text-primary hover:bg-primary-soft/80",
			outline: "border border-border bg-surface text-fg hover:bg-bg-elevated",
			ghost: "text-fg hover:bg-bg-elevated",
			danger: "bg-danger text-primary-fg hover:bg-danger/90",
			warn: "bg-warn text-primary-fg hover:bg-warn/90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5 text-base",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var GS1_AI_MAP = {
	"00": {
		desc: "SSCC",
		len: 18
	},
	"01": {
		desc: "GTIN",
		len: 14
	},
	"02": {
		desc: "含内商品 GTIN",
		len: 14
	},
	"10": {
		desc: "批号",
		len: 0
	},
	"11": {
		desc: "生产日期",
		len: 6
	},
	"12": {
		desc: "有效期",
		len: 6
	},
	"13": {
		desc: "包装日期",
		len: 6
	},
	"15": {
		desc: "保质期",
		len: 6
	},
	"16": {
		desc: "销售截止日期",
		len: 6
	},
	"17": {
		desc: "有效期至",
		len: 6
	},
	"20": {
		desc: "产品变体",
		len: 2
	},
	"21": {
		desc: "序列号",
		len: 0
	},
	"22": {
		desc: "HIBCC",
		len: 0
	},
	"30": {
		desc: "可变数量",
		len: 0
	},
	"37": {
		desc: "数量",
		len: 0
	},
	"240": {
		desc: "附加产品标识",
		len: 0
	},
	"241": {
		desc: "客户部件号",
		len: 0
	},
	"250": {
		desc: "二级序列号",
		len: 0
	},
	"251": {
		desc: "引用源实体",
		len: 0
	},
	"310": {
		desc: "净重(kg)",
		len: 6
	},
	"311": {
		desc: "净长(m)",
		len: 6
	},
	"312": {
		desc: "净宽(m)",
		len: 6
	},
	"313": {
		desc: "净高(m)",
		len: 6
	},
	"314": {
		desc: "净面积(m2)",
		len: 6
	},
	"315": {
		desc: "净体积(L)",
		len: 6
	},
	"316": {
		desc: "净体积(m3)",
		len: 6
	},
	"320": {
		desc: "净重(lb)",
		len: 6
	},
	"410": {
		desc: "发货方",
		len: 13
	},
	"411": {
		desc: "收货方",
		len: 13
	},
	"414": {
		desc: "标识码",
		len: 13
	},
	"417": {
		desc: "供货方",
		len: 13
	},
	"420": {
		desc: "收货方邮编",
		len: 0
	}
};
function cleanFNC1(code) {
	return code.replace(/\u00e8/g, "").replace(/\u00ea/g, "").trim();
}
function stripSymbologyId(code) {
	let cleaned = cleanFNC1(code);
	cleaned = cleaned.replace(/^\][A-Za-z][0-9]/, "");
	if (cleaned.charCodeAt(0) === 29) cleaned = cleaned.slice(1);
	return cleaned.trim();
}
function formatGs1Date(value) {
	if (!value || value.length !== 6 || !/^\d{6}$/.test(value)) return value;
	const yy = Number(value.slice(0, 2));
	const mm = value.slice(2, 4);
	const dd = value.slice(4, 6);
	return `${yy >= 80 ? 1900 + yy : 2e3 + yy}-${mm}-${dd}`;
}
function pushUnknown(raw, start, end, segs) {
	segs.push({
		ai: "",
		desc: "完整条码",
		start,
		end,
		value: raw.slice(start, end),
		fullMatch: raw.slice(start, end)
	});
}
function parseParenthesized(raw) {
	const parsed = [];
	const regex = /\((\d{2,4})\)([^\()]*)/g;
	let match;
	while ((match = regex.exec(raw)) !== null) {
		const ai = match[1] ?? "";
		const data = match[2] ?? "";
		const info = GS1_AI_MAP[ai] ?? {
			desc: `未知(${ai})`,
			len: 0
		};
		parsed.push({
			ai,
			desc: info.desc,
			start: match.index,
			end: match.index + match[0].length,
			value: data,
			fullMatch: match[0]
		});
	}
	return parsed;
}
function parseUnbracketed(raw) {
	const parsed = [];
	let i = 0;
	while (i < raw.length) {
		if (raw[i] === "") {
			i += 1;
			continue;
		}
		let ai = null;
		for (const n of [
			4,
			3,
			2
		]) {
			const cand = raw.slice(i, i + n);
			if (GS1_AI_MAP[cand]) {
				ai = cand;
				break;
			}
		}
		if (!ai) {
			if (parsed.length === 0) {
				pushUnknown(raw, 0, raw.length, parsed);
				return parsed;
			}
			const last = parsed[parsed.length - 1];
			if (last && last.ai && GS1_AI_MAP[last.ai]?.len === 0) {
				last.value += raw.slice(i);
				last.end = raw.length;
				last.fullMatch = raw.slice(last.start, raw.length);
			} else pushUnknown(raw, i, raw.length, parsed);
			break;
		}
		const info = GS1_AI_MAP[ai];
		const aiStart = i;
		i += ai.length;
		let value;
		if (info.len > 0) {
			value = raw.slice(i, i + info.len);
			i += info.len;
		} else {
			const gs = raw.indexOf("", i);
			if (gs >= 0) {
				value = raw.slice(i, gs);
				i = gs + 1;
			} else {
				value = raw.slice(i);
				i = raw.length;
			}
		}
		parsed.push({
			ai,
			desc: info.desc,
			start: aiStart,
			end: i,
			value,
			fullMatch: raw.slice(aiStart, i)
		});
	}
	return parsed;
}
function parseDigitalLink(raw) {
	try {
		if (!/^https?:\/\//i.test(raw) && !raw.includes("/01/")) return null;
		const url = new URL(raw.startsWith("http") ? raw : `https://id.gs1.org${raw.startsWith("/") ? "" : "/"}${raw}`);
		const parts = url.pathname.split("/").filter(Boolean);
		const segs = [];
		for (let i = 0; i < parts.length - 1; i += 1) {
			const ai = parts[i] ?? "";
			const value = decodeURIComponent(parts[i + 1] ?? "");
			if (GS1_AI_MAP[ai]) {
				const info = GS1_AI_MAP[ai];
				segs.push({
					ai,
					desc: info.desc,
					start: 0,
					end: value.length,
					value,
					fullMatch: `${ai}/${value}`
				});
				i += 1;
			}
		}
		url.searchParams.forEach((value, ai) => {
			const info = GS1_AI_MAP[ai];
			if (info) segs.push({
				ai,
				desc: info.desc,
				start: 0,
				end: value.length,
				value,
				fullMatch: `${ai}=${value}`
			});
		});
		return segs.length ? segs : null;
	} catch {
		return null;
	}
}
function parseBarcode(rawInput) {
	if (!rawInput || !rawInput.trim()) return [];
	const raw = stripSymbologyId(rawInput);
	const digital = parseDigitalLink(raw);
	if (digital && digital.length) return digital;
	if (raw.includes("(") && raw.includes(")")) {
		const paren = parseParenthesized(raw);
		if (paren.length) return paren;
	}
	if (/^\d{8,14}$/.test(raw)) return [{
		ai: "01",
		desc: "GTIN / 商品码",
		start: 0,
		end: raw.length,
		value: raw,
		fullMatch: raw
	}];
	const unb = parseUnbracketed(raw.replace(/\s+/g, ""));
	if (unb.length) return unb;
	return [{
		ai: "",
		desc: "完整条码",
		start: 0,
		end: raw.length,
		value: raw,
		fullMatch: raw
	}];
}
function fieldsFromSegments(segments) {
	const fields = {};
	for (const s of segments) {
		const value = s.value;
		switch (s.ai) {
			case "01":
			case "02":
				fields.gtin = value;
				break;
			case "10":
				fields.lotNumber = value;
				break;
			case "11":
			case "13":
				fields.productionDate = value;
				fields.productionDateFormatted = formatGs1Date(value);
				break;
			case "12":
			case "15":
			case "16":
			case "17":
				fields.expiryDate = value;
				fields.expiryDateFormatted = formatGs1Date(value);
				break;
			case "21":
				fields.serialNumber = value;
				break;
			case "30":
			case "37": fields.quantity = value;
		}
	}
	return fields;
}
function extractFieldsByRules(scanResult, scanSegments) {
	const parsed = parseBarcode(scanResult);
	const fromParse = fieldsFromSegments(parsed);
	if (!scanSegments) return fromParse;
	let rules = [];
	try {
		rules = typeof scanSegments === "string" ? JSON.parse(scanSegments) : scanSegments;
	} catch {
		return fromParse;
	}
	if (!Array.isArray(rules) || rules.length === 0) return fromParse;
	const byAi = new Map(parsed.filter((s) => s.ai).map((s) => [s.ai, s]));
	const fields = { ...fromParse };
	for (const rule of rules) {
		let value = "";
		const hit = rule.ai ? byAi.get(rule.ai) : void 0;
		if (hit) value = hit.value;
		else if (typeof rule.start === "number" && typeof rule.len === "number" && rule.len > 0) value = scanResult.substring(rule.start, rule.start + rule.len);
		if (!value) continue;
		switch (rule.ai) {
			case "01":
				fields.gtin = value;
				break;
			case "10":
				fields.lotNumber = value;
				break;
			case "11":
				fields.productionDate = value;
				fields.productionDateFormatted = formatGs1Date(value);
				break;
			case "17":
				fields.expiryDate = value;
				fields.expiryDateFormatted = formatGs1Date(value);
				break;
			case "21": fields.serialNumber = value;
		}
	}
	return fields;
}
function rulesFromSegments(segments) {
	return segments.filter((s) => s.ai).map((s) => ({
		ai: s.ai,
		desc: s.desc,
		start: s.start + (s.fullMatch.startsWith("(") ? s.ai.length + 2 : s.ai.length),
		len: s.value.length
	}));
}
function matchReagentByScan(scanResult, reagents) {
	const cleaned = stripSymbologyId(scanResult);
	const parsedFields = fieldsFromSegments(parseBarcode(cleaned));
	const gtin = parsedFields.gtin || "";
	const withRule = reagents.filter((r) => r.scanRule && r.scanRule.trim());
	for (const r of withRule) {
		const rule = r.scanRule.trim();
		if (cleaned.includes(rule) || gtin && (gtin.includes(rule) || rule.includes(gtin))) return {
			reagent: r,
			fields: extractFieldsByRules(cleaned, r.scanSegments)
		};
	}
	const withCode = reagents.filter((r) => r.code && r.code.trim());
	for (const r of withCode) {
		const code = r.code.trim();
		if (cleaned.includes(code) || gtin && (gtin.includes(code) || code.includes(gtin))) return {
			reagent: r,
			fields: extractFieldsByRules(cleaned, r.scanSegments)
		};
	}
	for (const r of withCode) if (cleaned === r.code || cleaned === r.scanRule) return {
		reagent: r,
		fields: parsedFields
	};
	return null;
}
function buildDemoBarcode(reagent) {
	if (reagent.rawBarcode && reagent.rawBarcode.trim()) return reagent.rawBarcode.trim();
	const gtin = (reagent.code || "").replace(/\D/g, "").padStart(14, "0").slice(-14);
	const lot = reagent.lotNumber || "DEMOLOT";
	const prod = (reagent.productionDate || "").replace(/-/g, "").slice(2, 8);
	const exp = (reagent.expiryDate || "").replace(/-/g, "").slice(2, 8);
	let out = `(01)${gtin}`;
	if (prod.length === 6) out += `(11)${prod}`;
	if (exp.length === 6) out += `(17)${exp}`;
	out += `(10)${lot}`;
	return out;
}
function daysUntil(dateStr) {
	if (!dateStr) return null;
	const d = /* @__PURE__ */ new Date(`${dateStr}T00:00:00`);
	if (Number.isNaN(d.getTime())) return null;
	const today = /* @__PURE__ */ new Date();
	today.setHours(0, 0, 0, 0);
	return Math.round((d.getTime() - today.getTime()) / 864e5);
}
var SUPPORTED_FORMATS = [
	"QR 码",
	"GS1-128 / EAN-128",
	"Code 128 / 39 / 93",
	"EAN-13 / EAN-8",
	"UPC-A / UPC-E",
	"Data Matrix",
	"PDF417",
	"Aztec",
	"ITF / Interleaved 2 of 5",
	"Codabar",
	"GS1 DataBar",
	"GS1 Digital Link"
];
var KIND_ORDER = {
	expired: 0,
	stockout: 1,
	expiring: 2,
	low: 3
};
function computeAlerts(reagents) {
	const out = [];
	for (const r of reagents) {
		const days = daysUntil(r.expiryDate);
		if (days !== null && days < 0) out.push({
			reagent: r,
			kind: "expired",
			detail: `已过期 ${Math.abs(days)} 天`
		});
		else if (days !== null && days <= 30) out.push({
			reagent: r,
			kind: "expiring",
			detail: `${days} 天后到期`
		});
		if (r.stockQuantity <= 0) out.push({
			reagent: r,
			kind: "stockout",
			detail: "库存为 0"
		});
		else if (r.minStock > 0 && r.stockQuantity <= r.minStock) out.push({
			reagent: r,
			kind: "low",
			detail: `库存 ${r.stockQuantity} / 安全 ${r.minStock}`
		});
	}
	return out.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.reagent.name.localeCompare(b.reagent.name, "zh"));
}
function formatWhen(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function orderText(order) {
	const date = formatWhen(order.createdAt);
	return [
		`权盾智检 补货单 #${order.id}`,
		`时间 ${date}`,
		"--------------------------------",
		...order.items.map((i) => `${i.name}  ×${i.quantity} ${i.unit}` + (i.specification ? `  ${i.specification}` : "") + (i.manufacturer ? `  ${i.manufacturer}` : "") + (i.supplier ? `  [${i.supplier}]` : "")),
		"--------------------------------",
		`共 ${order.items.length} 项，请按此清单采购。`
	].join("\n");
}
var KIND_BADGE = {
	expired: {
		label: "已过期",
		variant: "danger"
	},
	stockout: {
		label: "缺货",
		variant: "out"
	},
	expiring: {
		label: "近效期",
		variant: "warn"
	},
	low: {
		label: "低库存",
		variant: "warn"
	}
};
function HomeView({ reagents, records, orders, ordering, receivingId, onOrder, onReceive, onGoScan, onGoReagents }) {
	const alerts = computeAlerts(reagents);
	const lowCount = reagents.filter((r) => r.minStock > 0 && r.stockQuantity <= r.minStock).length;
	const totalStock = reagents.reduce((s, r) => s + r.stockQuantity, 0);
	const latestOrder = orders[0];
	async function copyOrder(order) {
		try {
			await navigator.clipboard.writeText(orderText(order));
			toast.success("补货单已复制，可发给供应商");
		} catch {
			toast.error("复制失败，请手动摘录清单");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-primary px-4 py-4 text-primary-fg shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-primary-fg/70",
						children: "今日库存态势"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-3xl font-semibold tabular tracking-tight",
							children: alerts.length
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-primary-fg/75",
							children: "条预警待处理"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: onOrder,
							disabled: ordering || lowCount === 0,
							className: "h-11 bg-surface text-primary hover:bg-bg-elevated disabled:bg-surface/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackagePlus, { className: "size-4" }), ordering ? "生成中…" : "一键下单"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-primary-fg/65",
						children: lowCount > 0 ? `将按安全库存为 ${lowCount} 项缺货试剂生成采购单` : "暂无低于安全库存的试剂"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "试剂种类",
						value: reagents.length,
						onClick: onGoReagents
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "在库数量",
						value: totalStock
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "本月单据",
						value: records.length
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-surface p-3 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "预警"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-subtle",
						children: [alerts.length, " 项"]
					})]
				}), alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-2 py-6 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-ok" }), "库存与效期均正常"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-2",
					children: alerts.map((a) => {
						const meta = KIND_BADGE[a.kind];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start justify-between gap-3 rounded-lg bg-bg-elevated px-3 py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-medium",
									children: a.reagent.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-xs text-muted",
									children: a.detail
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: meta.variant,
								children: meta.label
							})]
						}, `${a.kind}-${a.reagent.id}`);
					})
				})]
			}),
			latestOrder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-surface p-3 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "最近采购单"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-subtle",
							children: ["#", latestOrder.id]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderCard, {
						order: latestOrder,
						busy: receivingId === latestOrder.id,
						onCopy: () => copyOrder(latestOrder),
						onReceive: () => onReceive(latestOrder.id)
					}),
					orders.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-col gap-2 border-t border-border pt-3",
						children: orders.slice(1, 4).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [
									"#",
									o.id,
									" · ",
									o.itemCount,
									" 项 · ",
									formatWhen(o.createdAt)
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: o.status })]
						}, o.id))
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-surface p-3 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "最近出入库"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onGoScan,
						className: "text-xs font-medium text-primary",
						children: "去扫码"
					})]
				}), records.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-6 text-center text-sm text-muted",
					children: "暂无记录，扫码即可入库或出库"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col",
					children: records.slice(0, 6).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 border-b border-border/70 py-2.5 last:border-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm",
								children: r.reagentName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-subtle",
								children: [
									formatWhen(r.createdAt),
									" · ",
									r.lotNumber || "无批号"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: cn("text-sm font-medium tabular", r.type === "in" ? "text-ok" : "text-out"),
							children: [r.type === "in" ? "+" : "−", r.quantity]
						})]
					}, r.id))
				})]
			})
		]
	});
}
function Stat({ label, value, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(onClick ? "button" : "div", {
		type: onClick ? "button" : void 0,
		onClick,
		className: "rounded-lg border border-border bg-surface px-3 py-3 text-left shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xl font-semibold tabular tracking-tight",
			children: value
		})]
	});
}
function StatusPill({ status }) {
	if (status === "received") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "ok",
		children: "已入库"
	});
	if (status === "cancelled") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "muted",
		children: "已取消"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "待收货" });
}
function OrderCard({ order, busy, onCopy, onReceive }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-xs text-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { className: "size-3.5" }),
				formatWhen(order.createdAt),
				" · ",
				order.itemCount,
				" 项",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: order.status })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 flex flex-col gap-1",
			children: order.items.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex justify-between text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate pr-3",
					children: i.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "shrink-0 tabular text-muted",
					children: [
						"×",
						i.quantity,
						" ",
						i.unit
					]
				})]
			}, i.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				className: "flex-1",
				onClick: onCopy,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCopy, { className: "size-3.5" }), "复制清单"]
			}), order.status === "submitted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				className: "flex-1",
				disabled: busy,
				onClick: onReceive,
				children: busy ? "入库中…" : "确认到货入库"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex flex-1 items-center justify-center gap-1 text-xs text-ok",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }), "已计入库存"]
			})]
		})
	] });
}
function RecordsView({ records }) {
	const [filter, setFilter] = (0, import_react.useState)("all");
	const list = (0, import_react.useMemo)(() => filter === "all" ? records : records.filter((r) => r.type === filter), [filter, records]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 rounded-lg bg-bg-elevated p-1",
			children: [
				["all", "全部"],
				["in", "入库"],
				["out", "出库"]
			].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setFilter(id),
				className: cn("h-10 rounded-md text-sm font-medium", filter === id ? "bg-surface text-fg shadow-card" : "text-muted"),
				children: label
			}, id))
		}), list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-12 text-center text-sm text-muted",
			children: "暂无出入库记录"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "flex flex-col gap-2",
			children: list.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-xl border border-border bg-surface px-3 py-3 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-medium",
							children: r.reagentName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 text-xs text-subtle",
							children: [
								formatWhen(r.createdAt),
								" · ",
								r.operator || "检验员",
								" · ",
								r.department || "检验科"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: r.type === "in" ? "ok" : "out",
						children: [
							r.type === "in" ? "入库" : "出库",
							" ",
							r.type === "in" ? "+" : "−",
							r.quantity
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-muted",
					children: [
						"批号 ",
						r.lotNumber || "—",
						" · 效期 ",
						r.expiryDate || "—",
						r.note ? ` · ${r.note}` : "",
						r.reason ? ` · ${r.reason}` : ""
					]
				})]
			}, r.id))
		})]
	});
}
function ScannerOverlay({ open, onClose, onDetect }) {
	const videoRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("正在打开摄像头…");
	const [torchOn, setTorchOn] = (0, import_react.useState)(false);
	const [torchAvailable, setTorchAvailable] = (0, import_react.useState)(false);
	const lastValue = (0, import_react.useRef)("");
	const onDetectRef = (0, import_react.useRef)(onDetect);
	const streamRef = (0, import_react.useRef)(null);
	onDetectRef.current = onDetect;
	(0, import_react.useEffect)(() => {
		if (!open) return;
		lastValue.current = "";
		setError("");
		setTorchOn(false);
		setTorchAvailable(false);
		setStatus("正在打开摄像头…");
		let stopped = false;
		let timer = null;
		let stream = null;
		const emit = (value) => {
			const v = value.trim();
			if (!v || v === lastValue.current) return;
			lastValue.current = v;
			try {
				navigator.vibrate?.(40);
			} catch {}
			onDetectRef.current(v);
		};
		(async () => {
			const video = videoRef.current;
			if (!video) return;
			try {
				const { createNativeDetector, createZxingReader, decodeCanvas, drawVideoFrame, openBackCamera, prepareVideo, waitForVideo } = await import("./barcode-reader-BfcqdoF5.mjs");
				const camStream = await openBackCamera();
				stream = camStream;
				if (stopped) {
					camStream.getTracks().forEach((t) => t.stop());
					return;
				}
				streamRef.current = camStream;
				prepareVideo(video, camStream);
				try {
					await video.play();
				} catch {}
				await waitForVideo(video);
				if (stopped) return;
				if ((camStream.getVideoTracks()[0]?.getCapabilities?.())?.torch) setTorchAvailable(true);
				setStatus("将条码对准取景框，保持稳定");
				const reader = createZxingReader();
				const detector = await createNativeDetector();
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				if (!ctx) throw new Error("无法创建画布");
				let frame = 0;
				let busy = false;
				const tick = async () => {
					if (stopped) return;
					if (!busy && video.readyState >= 2 && video.videoWidth > 0) {
						busy = true;
						try {
							const mode = frame % 2 === 0 ? "band" : "full";
							const invert = frame % 6 === 5;
							drawVideoFrame(video, canvas, ctx, mode, invert);
							const zxingText = decodeCanvas(reader, canvas);
							if (zxingText) {
								emit(zxingText);
								busy = false;
								return;
							}
							if (detector) try {
								const nativeText = (await detector.detect(canvas))[0]?.rawValue?.trim();
								if (nativeText) emit(nativeText);
							} catch {}
							frame += 1;
						} finally {
							busy = false;
						}
					}
					timer = window.setTimeout(() => void tick(), 70);
				};
				tick();
			} catch (err) {
				if (stopped) return;
				const message = err instanceof Error ? err.message : "无法打开摄像头";
				const denied = /permission|notallowed|denied/i.test(message);
				setError(denied ? "未获得相机权限，请改用相册或粘贴条码" : "无法识别画面，请改用相册拍照或粘贴条码");
				setStatus("");
			}
		})();
		return () => {
			stopped = true;
			if (timer) window.clearTimeout(timer);
			stream?.getTracks().forEach((t) => t.stop());
			streamRef.current?.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
			const video = videoRef.current;
			if (video) video.srcObject = null;
		};
	}, [open]);
	async function toggleTorch() {
		const track = streamRef.current?.getVideoTracks()[0];
		if (!track) return;
		const next = !torchOn;
		try {
			await track.applyConstraints({ advanced: [{ torch: next }] });
			setTorchOn(next);
		} catch {
			setTorchAvailable(false);
		}
	}
	async function onPickFile(file) {
		setError("");
		setStatus("正在识别照片…");
		try {
			const { createNativeDetector, createZxingReader, decodeCanvas } = await import("./barcode-reader-BfcqdoF5.mjs");
			const bmp = await createImageBitmap(file);
			const canvas = document.createElement("canvas");
			canvas.width = bmp.width;
			canvas.height = bmp.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("canvas");
			ctx.drawImage(bmp, 0, 0);
			bmp.close();
			const text = decodeCanvas(createZxingReader(), canvas);
			if (text) {
				onDetect(text);
				return;
			}
			const detector = await createNativeDetector();
			if (detector) {
				const codes = await detector.detect(canvas);
				if (codes[0]?.rawValue) {
					onDetect(codes[0].rawValue);
					return;
				}
			}
			const { Html5Qrcode } = await import("../_libs/html5-qrcode.mjs").then((n) => n.t);
			const fallback = new Html5Qrcode("qd-html5-file");
			const scanned = await fallback.scanFile(file, false);
			await fallback.clear();
			if (scanned) onDetect(scanned);
			else setError("未识别到条码，请换一张更清晰、条码更大的照片");
		} catch {
			setError("未识别到条码，请让条码充满画面后重拍，或改用粘贴");
			setStatus("");
		}
	}
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[80] flex flex-col bg-fg text-primary-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: "扫描条码"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center",
					children: [torchAvailable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void toggleTorch(),
						className: "flex size-11 items-center justify-center rounded-md text-primary-fg",
						"aria-label": torchOn ? "关闭手电筒" : "打开手电筒",
						children: torchOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flashlight, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlashlightOff, { className: "size-5" })
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "flex size-11 items-center justify-center rounded-md text-primary-fg",
						"aria-label": "关闭扫码",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-4 min-h-[52vh] flex-1 overflow-hidden rounded-lg bg-fg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: videoRef,
					className: "absolute inset-0 size-full object-cover",
					playsInline: true,
					muted: true,
					autoPlay: true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute inset-0 flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative h-28 w-[86%] overflow-hidden rounded-md border-2 border-primary-fg/90 shadow-[0_0_0_9999px_rgba(28,29,26,0.42)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "scan-line absolute inset-x-3 h-0.5 bg-primary-fg/90" })
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "min-h-5 text-center text-xs text-primary-fg/75",
						children: error || status
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-center text-[11px] text-primary-fg/50",
						children: "试剂盒多为 GS1 / Data Matrix / Code 128，请横放条码并靠近取景框"
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center justify-center gap-2 text-subtle",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraOff, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs",
							children: "可从相册识别，或返回后粘贴条码"
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							className: "h-12 flex-1 bg-surface text-fg hover:bg-bg-elevated",
							onClick: () => fileRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-4" }), "拍照 / 相册识别"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: cn("h-12 border-primary-fg/20 bg-transparent text-primary-fg"),
							onClick: onClose,
							children: "取消"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "image/*",
						className: "hidden",
						onChange: (e) => {
							const file = e.target.files?.[0];
							if (file) onPickFile(file);
							e.target.value = "";
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						id: "qd-html5-file",
						className: "hidden"
					})
				]
			})
		]
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg shadow-none transition-colors placeholder:text-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:border-primary", "disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium text-muted", className),
		...props
	});
}
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:border-primary", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var CATEGORIES = [
	"免疫",
	"生化",
	"凝血",
	"血球",
	"分子",
	"质控",
	"校准",
	"其他"
];
var STORAGE_OPTIONS = [
	"2–8℃",
	"常温",
	"-20℃",
	"-80℃",
	"避光干燥"
];
var UNITS = [
	"盒",
	"瓶",
	"支",
	"人份",
	"套",
	"桶",
	"袋",
	"测试"
];
var emptyDraft = () => ({
	code: "",
	name: "",
	category: "免疫",
	specification: "",
	manufacturer: "",
	unit: "盒",
	stockQuantity: "0",
	minStock: "0",
	storageCondition: "2–8℃",
	location: "",
	expiryDate: "",
	registrationNumber: "",
	notes: "",
	scanRule: "",
	scanSegmentsText: "[]",
	lotNumber: "",
	productionDate: "",
	rawBarcode: "",
	supplier: "",
	unitPrice: "0"
});
function fromReagent(r) {
	return {
		id: r.id,
		code: r.code,
		name: r.name,
		category: r.category || "其他",
		specification: r.specification,
		manufacturer: r.manufacturer,
		unit: r.unit || "盒",
		stockQuantity: String(r.stockQuantity),
		minStock: String(r.minStock),
		storageCondition: r.storageCondition,
		location: r.location,
		expiryDate: r.expiryDate,
		registrationNumber: r.registrationNumber,
		notes: r.notes,
		scanRule: r.scanRule,
		scanSegmentsText: JSON.stringify(r.scanSegments ?? [], null, 0),
		lotNumber: r.lotNumber,
		productionDate: r.productionDate,
		rawBarcode: r.rawBarcode,
		supplier: r.supplier,
		unitPrice: String(r.unitPrice || 0)
	};
}
function ReagentsView({ reagents, saving, onSave }) {
	const [q, setQ] = (0, import_react.useState)("");
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [cameraOpen, setCameraOpen] = (0, import_react.useState)(false);
	const filtered = (0, import_react.useMemo)(() => {
		const s = q.trim().toLowerCase();
		if (!s) return reagents;
		return reagents.filter((r) => [
			r.name,
			r.code,
			r.manufacturer,
			r.category,
			r.location,
			r.lotNumber
		].join(" ").toLowerCase().includes(s));
	}, [q, reagents]);
	function applyBarcode(code) {
		if (!draft) return;
		const cleaned = stripSymbologyId(code);
		const segs = parseBarcode(cleaned);
		const rules = rulesFromSegments(segs);
		const gtin = segs.find((s) => s.ai === "01")?.value || "";
		const lot = segs.find((s) => s.ai === "10")?.value || "";
		const prod = segs.find((s) => s.ai === "11")?.value || "";
		const exp = segs.find((s) => s.ai === "17")?.value || "";
		const fmt = (v) => v.length === 6 ? `20${v.slice(0, 2)}-${v.slice(2, 4)}-${v.slice(4, 6)}` : v;
		setDraft({
			...draft,
			rawBarcode: cleaned,
			scanRule: gtin || draft.scanRule || cleaned,
			code: draft.code || gtin || cleaned,
			lotNumber: lot || draft.lotNumber,
			productionDate: prod ? fmt(prod) : draft.productionDate,
			expiryDate: exp ? fmt(exp) : draft.expiryDate,
			scanSegmentsText: JSON.stringify(rules)
		});
		toast.success("已解析条码并生成切割规则");
	}
	async function save() {
		if (!draft) return;
		if (!draft.code.trim() || !draft.name.trim()) {
			toast.error("请填写 GTIN 和试剂名称");
			return;
		}
		let scanSegments = [];
		try {
			scanSegments = JSON.parse(draft.scanSegmentsText || "[]");
		} catch {
			toast.error("切割规则 JSON 格式错误");
			return;
		}
		await onSave({
			id: draft.id,
			code: draft.code.trim(),
			name: draft.name.trim(),
			category: draft.category,
			specification: draft.specification,
			manufacturer: draft.manufacturer,
			unit: draft.unit,
			stockQuantity: Number(draft.stockQuantity) || 0,
			minStock: Number(draft.minStock) || 0,
			storageCondition: draft.storageCondition,
			location: draft.location,
			expiryDate: draft.expiryDate,
			registrationNumber: draft.registrationNumber,
			notes: draft.notes,
			scanRule: draft.scanRule.trim() || draft.code.trim(),
			scanSegments,
			lotNumber: draft.lotNumber,
			productionDate: draft.productionDate,
			rawBarcode: draft.rawBarcode,
			supplier: draft.supplier,
			unitPrice: Number(draft.unitPrice) || 0
		});
		setDraft(null);
	}
	if (draft) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold",
					children: draft.id ? "编辑试剂" : "预录试剂"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 px-2 text-sm text-muted",
					onClick: () => setDraft(null),
					children: "返回"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "secondary",
				onClick: () => setCameraOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-4" }), "扫码自动解析 GS1"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "GTIN / 编码",
				value: draft.code,
				onChange: (v) => setDraft({
					...draft,
					code: v
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "试剂名称",
				value: draft.name,
				onChange: (v) => setDraft({
					...draft,
					name: v
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
						label: "类别",
						value: draft.category,
						options: CATEGORIES,
						onChange: (v) => setDraft({
							...draft,
							category: v
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
						label: "单位",
						value: draft.unit,
						options: UNITS,
						onChange: (v) => setDraft({
							...draft,
							unit: v
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "规格",
						value: draft.specification,
						onChange: (v) => setDraft({
							...draft,
							specification: v
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "厂家",
						value: draft.manufacturer,
						onChange: (v) => setDraft({
							...draft,
							manufacturer: v
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "当前库存",
						value: draft.stockQuantity,
						onChange: (v) => setDraft({
							...draft,
							stockQuantity: v
						}),
						inputMode: "numeric"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "安全库存",
						value: draft.minStock,
						onChange: (v) => setDraft({
							...draft,
							minStock: v
						}),
						inputMode: "numeric"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectField, {
						label: "储存条件",
						value: draft.storageCondition,
						options: STORAGE_OPTIONS,
						onChange: (v) => setDraft({
							...draft,
							storageCondition: v
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "货位",
						value: draft.location,
						onChange: (v) => setDraft({
							...draft,
							location: v
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "有效期",
						value: draft.expiryDate,
						onChange: (v) => setDraft({
							...draft,
							expiryDate: v
						}),
						placeholder: "YYYY-MM-DD"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "生产日期",
						value: draft.productionDate,
						onChange: (v) => setDraft({
							...draft,
							productionDate: v
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "批号",
						value: draft.lotNumber,
						onChange: (v) => setDraft({
							...draft,
							lotNumber: v
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
						label: "参考单价",
						value: draft.unitPrice,
						onChange: (v) => setDraft({
							...draft,
							unitPrice: v
						}),
						inputMode: "numeric"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "供应商",
				value: draft.supplier,
				onChange: (v) => setDraft({
					...draft,
					supplier: v
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "注册证号",
				value: draft.registrationNumber,
				onChange: (v) => setDraft({
					...draft,
					registrationNumber: v
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "扫码匹配规则（GTIN）",
				value: draft.scanRule,
				onChange: (v) => setDraft({
					...draft,
					scanRule: v
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "切割规则 JSON" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				className: "mt-1 font-mono text-xs",
				rows: 3,
				value: draft.scanSegmentsText,
				onChange: (e) => setDraft({
					...draft,
					scanSegmentsText: e.target.value
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "备注" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				className: "mt-1",
				rows: 2,
				value: draft.notes,
				onChange: (e) => setDraft({
					...draft,
					notes: e.target.value
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "h-12",
				disabled: saving,
				onClick: () => void save(),
				children: saving ? "保存中…" : draft.id ? "更新试剂" : "保存预录"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScannerOverlay, {
				open: cameraOpen,
				onClose: () => setCameraOpen(false),
				onDetect: (c) => {
					setCameraOpen(false);
					applyBarcode(c);
				}
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "pl-9",
						placeholder: "搜索名称 / GTIN / 厂家",
						value: q,
						onChange: (e) => setQ(e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "shrink-0",
					onClick: () => setDraft(emptyDraft()),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "预录"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: filtered.map((r) => {
					const days = daysUntil(r.expiryDate);
					const low = r.minStock > 0 && r.stockQuantity <= r.minStock;
					const expired = days !== null && days < 0;
					const expiring = days !== null && days >= 0 && days <= 30;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setDraft(fromReagent(r)),
						className: "flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-left shadow-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-medium",
										children: r.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-0.5 truncate text-xs text-muted",
										children: [
											r.manufacturer,
											" · ",
											r.specification || "无规格",
											" · ",
											r.location || "无货位"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1.5 flex flex-wrap gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "muted",
												children: r.category || "未分类"
											}),
											expired ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "danger",
												children: "已过期"
											}) : null,
											expiring && !expired ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "warn",
												children: "近效期"
											}) : null,
											low ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "warn",
												children: "低库存"
											}) : null,
											r.stockQuantity === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "out",
												children: "缺货"
											}) : null
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: cn("text-base font-semibold tabular", low || r.stockQuantity === 0 ? "text-warn" : "text-fg"),
									children: r.stockQuantity
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-subtle",
									children: r.unit
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-subtle" })
						]
					}) }, r.id);
				})
			}),
			filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-10 text-center text-sm text-muted",
				children: "没有匹配的试剂"
			}) : null
		]
	});
}
function Field$1({ label, value, onChange, placeholder, inputMode }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
		className: "mt-1",
		value,
		placeholder,
		inputMode,
		onChange: (e) => onChange(e.target.value)
	})] });
}
function SelectField({ label, value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
		className: "mt-1 flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm",
		value,
		onChange: (e) => onChange(e.target.value),
		children: [options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: o,
			children: o
		}, o)), value && !options.includes(value) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value,
			children: value
		}) : null]
	})] });
}
function ScanView({ reagents, submitting, onSubmit }) {
	const [tab, setTab] = (0, import_react.useState)("in");
	const [cameraOpen, setCameraOpen] = (0, import_react.useState)(false);
	const [raw, setRaw] = (0, import_react.useState)("");
	const [matched, setMatched] = (0, import_react.useState)(null);
	const [fields, setFields] = (0, import_react.useState)({});
	const [quantity, setQuantity] = (0, import_react.useState)("1");
	const [lotNumber, setLotNumber] = (0, import_react.useState)("");
	const [expiryDate, setExpiryDate] = (0, import_react.useState)("");
	const [productionDate, setProductionDate] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)([]);
	const [flash, setFlash] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	const demos = (0, import_react.useMemo)(() => reagents.slice(0, 6), [reagents]);
	function applyMatch(code) {
		const cleaned = stripSymbologyId(code);
		if (!cleaned) return;
		setRaw(cleaned);
		const result = matchReagentByScan(cleaned, reagents);
		if (result) {
			setMatched(result.reagent);
			setFields(result.fields);
			if (result.fields.lotNumber) setLotNumber(result.fields.lotNumber);
			else setLotNumber(result.reagent.lotNumber || "");
			if (result.fields.expiryDateFormatted) setExpiryDate(result.fields.expiryDateFormatted);
			else setExpiryDate(result.reagent.expiryDate || "");
			if (result.fields.productionDateFormatted) setProductionDate(result.fields.productionDateFormatted);
			else setProductionDate(result.reagent.productionDate || "");
			setFlash(true);
			window.setTimeout(() => setFlash(false), 420);
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
		setPending((list) => [...list, {
			key: `${matched.id}-${Date.now()}`,
			reagentId: matched.id,
			reagentName: matched.name,
			unit: matched.unit,
			quantity: qty,
			lotNumber,
			expiryDate,
			productionDate,
			note,
			stockQuantity: matched.stockQuantity
		}]);
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
	(0, import_react.useEffect)(() => {
		const onPaste = (e) => {
			const text = e.clipboardData?.getData("text");
			if (!text) return;
			const t = text.trim();
			if (t.length < 6) return;
			if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
			e.preventDefault();
			applyMatch(t);
		};
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	}, [reagents]);
	const segments = raw ? parseBarcode(raw) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 rounded-lg bg-bg-elevated p-1",
				children: ["in", "out"].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(id),
					className: cn("h-11 rounded-md text-sm font-medium transition-colors", tab === id ? id === "in" ? "bg-primary text-primary-fg" : "bg-out text-primary-fg" : "text-muted"),
					children: id === "in" ? "入库" : "出库"
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: cn("rounded-xl border border-border bg-surface p-3 shadow-card", flash && "scan-flash"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "h-12 w-full",
						onClick: () => setCameraOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-4" }), "打开摄像头扫码"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-subtle",
						children: "支持手机摄像头、扫码枪（键盘口）和粘贴。覆盖市面主流一维 / 二维 / GS1 条码。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[11px] leading-5 text-subtle",
						children: SUPPORTED_FORMATS.join(" · ")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "mt-3 block",
						children: "扫码结果 / 粘贴条码"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						ref: inputRef,
						value: raw,
						autoCapitalize: "off",
						autoCorrect: "off",
						spellCheck: false,
						placeholder: "对准扫码枪，或粘贴条码后回车",
						className: "mt-1 font-mono text-[13px]",
						onChange: (e) => setRaw(e.target.value),
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								applyMatch(raw);
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: demos.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => applyMatch(buildDemoBarcode(r)),
							className: "rounded-full border border-border bg-bg-elevated px-2.5 py-1 text-[11px] text-muted",
							children: ["示例 · ", r.name.replace(/测定试剂盒|测定试剂|试剂盒/g, "")]
						}, r.id))
					})
				]
			}),
			segments.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5",
				children: segments.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded-md bg-primary-soft px-2 py-1 font-mono text-[11px] text-primary",
					children: [
						s.ai ? `(${s.ai}) ` : "",
						s.desc,
						" ",
						s.value
					]
				}, `${s.ai}-${i}`))
			}) : null,
			matched ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-surface p-3 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: matched.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-0.5 text-xs text-muted",
								children: [
									matched.manufacturer,
									" · ",
									matched.specification
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: matched.stockQuantity <= matched.minStock ? "warn" : "ok",
							children: [
								"库存 ",
								matched.stockQuantity,
								" ",
								matched.unit
							]
						})]
					}),
					fields.gtin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 font-mono text-[11px] text-subtle",
						children: ["GTIN ", fields.gtin]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "数量" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "icon",
											className: "size-11 shrink-0",
											onClick: () => setQuantity(String(Math.max(1, Number(quantity || 1) - 1))),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											inputMode: "numeric",
											value: quantity,
											onChange: (e) => setQuantity(e.target.value),
											className: "text-center text-base tabular"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "icon",
											className: "size-11 shrink-0",
											onClick: () => setQuantity(String(Number(quantity || 0) + 1)),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "批号",
								value: lotNumber,
								onChange: setLotNumber
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "有效期",
								value: expiryDate,
								onChange: setExpiryDate,
								placeholder: "YYYY-MM-DD"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "生产日期",
								value: productionDate,
								onChange: setProductionDate,
								placeholder: "YYYY-MM-DD"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "备注",
								value: note,
								onChange: setNote
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "h-11 flex-1",
							onClick: addToPending,
							children: "加入待提交"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "h-11",
							onClick: clearMatch,
							children: "清除"
						})]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-surface p-3 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-sm font-semibold",
							children: ["待提交 · ", tab === "in" ? "入库" : "出库"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-subtle",
							children: [pending.length, " 条"]
						})]
					}),
					pending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-5 text-center text-sm text-muted",
						children: "扫码匹配后加入，可一次提交多条"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-2",
						children: pending.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2 rounded-lg bg-bg-elevated px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm",
									children: p.reagentName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-subtle",
									children: [
										p.lotNumber || "无批号",
										" · ",
										p.expiryDate || "无效期"
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm font-medium tabular",
									children: [
										p.quantity,
										" ",
										p.unit
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "flex size-10 items-center justify-center text-subtle",
									onClick: () => setPending((list) => list.filter((x) => x.key !== p.key)),
									"aria-label": "移除",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})]
							})]
						}, p.key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 h-12 w-full",
						variant: tab === "out" ? "warn" : "default",
						disabled: submitting || pending.length === 0,
						onClick: () => void submit(),
						children: submitting ? "提交中…" : `提交 ${pending.length} 条${tab === "in" ? "入库" : "出库"}`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScannerOverlay, {
				open: cameraOpen,
				onClose: () => setCameraOpen(false),
				onDetect: (code) => {
					setCameraOpen(false);
					applyMatch(code);
				}
			})
		]
	});
}
function Field({ label, value, onChange, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
		className: "mt-1",
		value,
		placeholder,
		onChange: (e) => onChange(e.target.value)
	})] });
}
var TABS = [
	{
		id: "home",
		label: "工作台",
		icon: LayoutDashboard
	},
	{
		id: "scan",
		label: "扫码",
		icon: ScanLine
	},
	{
		id: "reagents",
		label: "试剂",
		icon: FlaskConical
	},
	{
		id: "records",
		label: "记录",
		icon: ScrollText
	}
];
function AppShell({ tab, onTab, alertCount, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border/80 bg-bg/92 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-9 items-center justify-center rounded-md bg-primary text-primary-fg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
								viewBox: "0 0 32 32",
								className: "size-5",
								"aria-hidden": true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									fill: "currentColor",
									d: "M16 4.8l8.2 3.3v8.4c0 4.9-3.4 8.6-8.2 10.3C10.2 25.1 6.8 21.4 6.8 16.5V8.1L16 4.8z"
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-medium uppercase tracking-[0.16em] text-muted",
								children: "QuanDun Lab"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "truncate text-base font-semibold tracking-tight text-fg",
								children: "权盾智检 · 试剂管家"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted",
							children: "检验科"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "min-h-0 flex-1 px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-4",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 mx-auto max-w-3xl border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-4",
					children: TABS.map((item) => {
						const Icon = item.icon;
						const active = tab === item.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => onTab(item.id),
							className: cn("relative flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors", active ? "text-primary" : "text-subtle"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-5",
									strokeWidth: active ? 2.2 : 1.8
								}),
								item.label,
								item.id === "home" && alertCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute right-[18%] top-1.5 min-w-4 rounded-full bg-danger px-1 text-[10px] leading-4 text-primary-fg tabular",
									children: alertCount > 9 ? "9+" : alertCount
								}) : null
							]
						}) }, item.id);
					})
				})
			})
		]
	});
}
function Home() {
	const initial = Route.useLoaderData();
	const queryClient = useQueryClient();
	const [tab, setTab] = (0, import_react.useState)("home");
	const reagentsQuery = useQuery({
		queryKey: ["reagents"],
		queryFn: () => listReagents(),
		initialData: initial.reagents
	});
	const recordsQuery = useQuery({
		queryKey: ["records"],
		queryFn: () => listStockRecords(),
		initialData: initial.records
	});
	const ordersQuery = useQuery({
		queryKey: ["orders"],
		queryFn: () => listOrders(),
		initialData: initial.orders
	});
	const reagents = reagentsQuery.data ?? [];
	const records = recordsQuery.data ?? [];
	const orders = ordersQuery.data ?? [];
	const alertCount = (0, import_react.useMemo)(() => computeAlerts(reagents).length, [reagents]);
	async function refreshAll() {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["reagents"] }),
			queryClient.invalidateQueries({ queryKey: ["records"] }),
			queryClient.invalidateQueries({ queryKey: ["orders"] })
		]);
	}
	const stockMutation = useMutation({
		mutationFn: (input) => submitStockBatch({ data: {
			type: input.type,
			operator: "检验员",
			department: "检验科",
			items: input.items.map((i) => ({
				reagentId: i.reagentId,
				quantity: i.quantity,
				lotNumber: i.lotNumber,
				expiryDate: i.expiryDate,
				productionDate: i.productionDate,
				note: i.note
			}))
		} }),
		onSuccess: async (res, vars) => {
			toast.success(`已提交 ${res.count} 条${vars.type === "in" ? "入库" : "出库"}`);
			await refreshAll();
		},
		onError: (err) => toast.error(err.message || "提交失败")
	});
	const saveMutation = useMutation({
		mutationFn: (data) => saveReagent({ data }),
		onSuccess: async () => {
			toast.success("试剂已保存");
			await refreshAll();
		},
		onError: (err) => toast.error(err.message || "保存失败")
	});
	const orderMutation = useMutation({
		mutationFn: () => createRestockOrder({ data: { note: "一键补货" } }),
		onSuccess: async (order) => {
			toast.success(`已生成采购单 #${order.id}，共 ${order.itemCount} 项`);
			await refreshAll();
		},
		onError: (err) => toast.error(err.message || "下单失败")
	});
	const receiveMutation = useMutation({
		mutationFn: (id) => receiveOrder({ data: {
			id,
			operator: "检验员"
		} }),
		onSuccess: async () => {
			toast.success("到货已入库");
			await refreshAll();
		},
		onError: (err) => toast.error(err.message || "入库失败")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		tab,
		onTab: setTab,
		alertCount,
		children: [
			tab === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeView, {
				reagents,
				records,
				orders,
				ordering: orderMutation.isPending,
				receivingId: receiveMutation.isPending ? receiveMutation.variables ?? null : null,
				onOrder: () => orderMutation.mutate(),
				onReceive: (id) => receiveMutation.mutate(id),
				onGoScan: () => setTab("scan"),
				onGoReagents: () => setTab("reagents")
			}) : null,
			tab === "scan" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanView, {
				reagents,
				submitting: stockMutation.isPending,
				onSubmit: async (type, items) => {
					await stockMutation.mutateAsync({
						type,
						items
					});
				}
			}) : null,
			tab === "reagents" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReagentsView, {
				reagents,
				saving: saveMutation.isPending,
				onSave: async (data) => {
					await saveMutation.mutateAsync(data);
				}
			}) : null,
			tab === "records" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordsView, { records }) : null
		]
	});
}
//#endregion
export { Home as component };
