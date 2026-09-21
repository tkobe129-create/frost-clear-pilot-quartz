import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reagents-DbQZQAej.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var _0002_reagents_default = "-- 权盾智检 · 试剂库存 / 出入库 / 采购单\ncreate table if not exists reagents (\n  id                  serial primary key,\n  code                text not null default '',\n  name                text not null default '',\n  category            text not null default '',\n  specification       text not null default '',\n  manufacturer        text not null default '',\n  unit                text not null default '盒',\n  stock_quantity      integer not null default 0,\n  min_stock           integer not null default 0,\n  storage_condition   text not null default '',\n  location            text not null default '',\n  expiry_date         text not null default '',\n  registration_number text not null default '',\n  notes               text not null default '',\n  scan_rule           text not null default '',\n  scan_segments       text not null default '[]',\n  lot_number          text not null default '',\n  production_date     text not null default '',\n  raw_barcode         text not null default '',\n  supplier            text not null default '',\n  unit_price          integer not null default 0,\n  created_at          timestamptz not null default now()\n);\n\ncreate index if not exists reagents_code_idx on reagents (code);\ncreate index if not exists reagents_scan_rule_idx on reagents (scan_rule);\n\ncreate table if not exists stock_records (\n  id              serial primary key,\n  reagent_id      integer not null references reagents(id),\n  type            text not null,\n  quantity        integer not null,\n  lot_number      text not null default '',\n  expiry_date     text not null default '',\n  production_date text not null default '',\n  note            text not null default '',\n  operator        text not null default '',\n  department      text not null default '',\n  reason          text not null default '',\n  created_at      timestamptz not null default now()\n);\n\ncreate index if not exists stock_records_reagent_idx on stock_records (reagent_id);\ncreate index if not exists stock_records_created_idx on stock_records (created_at desc);\n\ncreate table if not exists purchase_orders (\n  id          serial primary key,\n  status      text not null default 'submitted',\n  note        text not null default '',\n  item_count  integer not null default 0,\n  created_at  timestamptz not null default now()\n);\n\ncreate table if not exists purchase_order_items (\n  id            serial primary key,\n  order_id      integer not null references purchase_orders(id) on delete cascade,\n  reagent_id    integer not null references reagents(id),\n  quantity      integer not null,\n  unit          text not null default '',\n  name          text not null default '',\n  manufacturer  text not null default '',\n  specification text not null default '',\n  supplier      text not null default ''\n);\n\n-- 预置检验科常见试剂，覆盖低库存 / 近效期 / 过期 / 正常，便于扫码演示\ninsert into reagents (\n  code, name, category, specification, manufacturer, unit,\n  stock_quantity, min_stock, storage_condition, location, expiry_date,\n  registration_number, notes, scan_rule, scan_segments, lot_number,\n  production_date, raw_barcode, supplier, unit_price\n) values\n(\n  '06954414719413',\n  '糖化血红蛋白测定试剂',\n  '生化',\n  '100人份/盒',\n  '罗氏诊断',\n  '盒',\n  24, 8, '2–8℃', '冷藏A-01',\n  '2027-06-06',\n  '国械注进20152401234',\n  'HbA1c 免疫比浊法，配套校准品。',\n  '06954414719413',\n  '[{\"ai\":\"01\",\"desc\":\"GTIN\"},{\"ai\":\"11\",\"desc\":\"生产日期\"},{\"ai\":\"17\",\"desc\":\"有效期至\"},{\"ai\":\"10\",\"desc\":\"批号\"}]',\n  'AB25100721H000502',\n  '2025-12-06',\n  '(01)06954414719413(11)251206(17)270606(10)AB25100721H000502',\n  '罗氏诊断（上海）有限公司',\n  1860\n),\n(\n  '06901800001234',\n  '心肌肌钙蛋白I测定试剂盒',\n  '免疫',\n  '50人份/盒',\n  '雅培',\n  '盒',\n  2, 10, '2–8℃', '冷藏A-03',\n  to_char(CURRENT_DATE + 80, 'YYYY-MM-DD'),\n  '国械注进20183401567',\n  'cTnI 化学发光法。低库存预警。',\n  '06901800001234',\n  '[{\"ai\":\"01\",\"desc\":\"GTIN\"},{\"ai\":\"17\",\"desc\":\"有效期至\"},{\"ai\":\"10\",\"desc\":\"批号\"}]',\n  'CTn2509A',\n  '2025-09-12',\n  '(01)06901800001234(17)270412(10)CTn2509A',\n  '雅培贸易（上海）有限公司',\n  2480\n),\n(\n  '06920000005678',\n  '降钙素原 PCT 测定试剂',\n  '免疫',\n  '100人份/盒',\n  '罗氏诊断',\n  '盒',\n  0, 6, '2–8℃', '冷藏B-02',\n  to_char(CURRENT_DATE + 140, 'YYYY-MM-DD'),\n  '国械注进20192401890',\n  '缺货，需立即补货。',\n  '06920000005678',\n  '[{\"ai\":\"01\",\"desc\":\"GTIN\"},{\"ai\":\"11\",\"desc\":\"生产日期\"},{\"ai\":\"17\",\"desc\":\"有效期至\"},{\"ai\":\"10\",\"desc\":\"批号\"}]',\n  'PCT2601B',\n  '2026-01-08',\n  '(01)06920000005678(11)260108(17)270508(10)PCT2601B',\n  '罗氏诊断（上海）有限公司',\n  3120\n),\n(\n  '06903300009876',\n  '超敏 C 反应蛋白试剂',\n  '免疫',\n  '200人份/盒',\n  '贝克曼库尔特',\n  '盒',\n  9, 8, '2–8℃', '冷藏A-07',\n  to_char(CURRENT_DATE + 11, 'YYYY-MM-DD'),\n  '国械注进20172402211',\n  '近效期，请优先使用。',\n  '06903300009876',\n  '[{\"ai\":\"01\",\"desc\":\"GTIN\"},{\"ai\":\"17\",\"desc\":\"有效期至\"},{\"ai\":\"10\",\"desc\":\"批号\"}]',\n  'CRP2508X',\n  '2025-08-01',\n  '(01)06903300009876(17)' || to_char(CURRENT_DATE + 11, 'YYMMDD') || '(10)CRP2508X',\n  '贝克曼库尔特商贸（中国）有限公司',\n  980\n),\n(\n  '06905500001122',\n  '乙型肝炎病毒表面抗原试剂盒',\n  '免疫',\n  '96人份/盒',\n  '安图生物',\n  '盒',\n  18, 6, '2–8℃', '冷藏C-01',\n  '2027-11-20',\n  '国械注准20173400112',\n  'HBsAg ELISA。',\n  '06905500001122',\n  '[{\"ai\":\"01\",\"desc\":\"GTIN\"},{\"ai\":\"10\",\"desc\":\"批号\"},{\"ai\":\"17\",\"desc\":\"有效期至\"}]',\n  'HBs2603',\n  '2026-03-20',\n  '(01)06905500001122(10)HBs2603(17)271120',\n  '郑州安图生物工程股份有限公司',\n  420\n),\n(\n  '06907700003344',\n  '全自动生化复合校准品',\n  '生化',\n  '5mL × 6',\n  '迈瑞',\n  '套',\n  4, 2, '-20℃', '冷冻D-01',\n  '2026-12-01',\n  '粤械注准20202400101',\n  '配套 BS 系列生化仪。',\n  '06907700003344',\n  '[{\"ai\":\"01\",\"desc\":\"GTIN\"},{\"ai\":\"17\",\"desc\":\"有效期至\"},{\"ai\":\"10\",\"desc\":\"批号\"}]',\n  'CAL2602',\n  '2026-02-01',\n  '(01)06907700003344(17)261201(10)CAL2602',\n  '深圳迈瑞生物医疗电子股份有限公司',\n  760\n),\n(\n  '06908800005566',\n  '质控品水平 1（过期）',\n  '质控',\n  '5mL × 10',\n  '伯乐',\n  '盒',\n  3, 2, '2–8℃', '冷藏Q-01',\n  to_char(CURRENT_DATE - 6, 'YYYY-MM-DD'),\n  '国械注进20152409901',\n  '已过期，禁止继续使用，待报损。',\n  '06908800005566',\n  '[{\"ai\":\"01\",\"desc\":\"GTIN\"},{\"ai\":\"17\",\"desc\":\"有效期至\"},{\"ai\":\"10\",\"desc\":\"批号\"}]',\n  'QC1-2501',\n  '2025-01-10',\n  '(01)06908800005566(17)' || to_char(CURRENT_DATE - 6, 'YYMMDD') || '(10)QC1-2501',\n  '伯乐生命医学产品（上海）有限公司',\n  540\n),\n(\n  '06909900007788',\n  '血细胞分析稀释液',\n  '血球',\n  '20L/桶',\n  '迈瑞',\n  '桶',\n  12, 4, '常温', '常温E-04',\n  '2028-01-15',\n  '粤械注准20182400331',\n  'BC 系列血球仪配套。',\n  '06909900007788',\n  '[{\"ai\":\"01\",\"desc\":\"GTIN\"},{\"ai\":\"10\",\"desc\":\"批号\"}]',\n  'DIL2801',\n  '2026-01-15',\n  '(01)06909900007788(10)DIL2801',\n  '深圳迈瑞生物医疗电子股份有限公司',\n  210\n);\n\ninsert into stock_records (\n  reagent_id, type, quantity, lot_number, expiry_date, production_date,\n  note, operator, department, reason, created_at\n) values\n(1, 'in', 10, 'AB25100721H000502', '2027-06-06', '2025-12-06', '月度补货', '检验员', '检验科', '采购入库', now() - interval '12 days'),\n(1, 'out', 2, 'AB25100721H000502', '2027-06-06', '2025-12-06', '日常检测', '检验员', '检验科', '日常消耗', now() - interval '2 days'),\n(2, 'out', 3, 'CTn2509A', to_char(CURRENT_DATE + 80, 'YYYY-MM-DD'), '2025-09-12', '急诊使用', '检验员', '检验科', '日常消耗', now() - interval '1 day'),\n(4, 'in', 6, 'CRP2508X', to_char(CURRENT_DATE + 11, 'YYYY-MM-DD'), '2025-08-01', '近效期批次到货', '检验员', '检验科', '采购入库', now() - interval '20 days'),\n(5, 'in', 8, 'HBs2603', '2027-11-20', '2026-03-20', '常规采购', '检验员', '检验科', '采购入库', now() - interval '30 days'),\n(8, 'out', 1, 'DIL2801', '2028-01-15', '2026-01-15', '更换稀释液', '检验员', '检验科', '日常消耗', now() - interval '5 days');\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_reagents.sql": _0002_reagents_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
function parseSegments(raw) {
	try {
		const v = JSON.parse(raw || "[]");
		return Array.isArray(v) ? v : [];
	} catch {
		return [];
	}
}
function fromReagent(r) {
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
		createdAt: r.created_at
	};
}
var reagentInput = object({
	id: number().optional(),
	code: string(),
	name: string(),
	category: string().optional().default(""),
	specification: string().optional().default(""),
	manufacturer: string().optional().default(""),
	unit: string().optional().default("盒"),
	stockQuantity: number().optional().default(0),
	minStock: number().optional().default(0),
	storageCondition: string().optional().default(""),
	location: string().optional().default(""),
	expiryDate: string().optional().default(""),
	registrationNumber: string().optional().default(""),
	notes: string().optional().default(""),
	scanRule: string().optional().default(""),
	scanSegments: array(object({
		ai: string(),
		desc: string(),
		start: number().optional(),
		len: number().optional()
	})).optional().default([]),
	lotNumber: string().optional().default(""),
	productionDate: string().optional().default(""),
	rawBarcode: string().optional().default(""),
	supplier: string().optional().default(""),
	unitPrice: number().optional().default(0)
});
var listReagents_createServerFn_handler = createServerRpc({
	id: "c43bab918abed429bb65984405d1d993a78388340554c9c68f68bf362611f3d7",
	name: "listReagents",
	filename: "src/lib/reagents.ts"
}, (opts) => listReagents.__executeServer(opts));
var listReagents = createServerFn({ method: "GET" }).handler(listReagents_createServerFn_handler, async () => {
	return (await (await getSql())`select * from reagents order by id asc`).map(fromReagent);
});
var saveReagent_createServerFn_handler = createServerRpc({
	id: "f0381a8579af96b684ecf8a33582e86ec4861dd734b19b6a2108d26b38e5ea5e",
	name: "saveReagent",
	filename: "src/lib/reagents.ts"
}, (opts) => saveReagent.__executeServer(opts));
var saveReagent = createServerFn({ method: "POST" }).validator(reagentInput).handler(saveReagent_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const segments = JSON.stringify(data.scanSegments ?? []);
	if (data.id) {
		const row = (await sql`
        update reagents set
          code = ${data.code},
          name = ${data.name},
          category = ${data.category},
          specification = ${data.specification},
          manufacturer = ${data.manufacturer},
          unit = ${data.unit},
          stock_quantity = ${data.stockQuantity},
          min_stock = ${data.minStock},
          storage_condition = ${data.storageCondition},
          location = ${data.location},
          expiry_date = ${data.expiryDate},
          registration_number = ${data.registrationNumber},
          notes = ${data.notes},
          scan_rule = ${data.scanRule},
          scan_segments = ${segments},
          lot_number = ${data.lotNumber},
          production_date = ${data.productionDate},
          raw_barcode = ${data.rawBarcode},
          supplier = ${data.supplier},
          unit_price = ${data.unitPrice}
        where id = ${data.id}
        returning *`)[0];
		if (!row) throw new Error("试剂不存在");
		return fromReagent(row);
	}
	const row = (await sql`
      insert into reagents (
        code, name, category, specification, manufacturer, unit,
        stock_quantity, min_stock, storage_condition, location, expiry_date,
        registration_number, notes, scan_rule, scan_segments, lot_number,
        production_date, raw_barcode, supplier, unit_price
      ) values (
        ${data.code}, ${data.name}, ${data.category}, ${data.specification},
        ${data.manufacturer}, ${data.unit}, ${data.stockQuantity}, ${data.minStock},
        ${data.storageCondition}, ${data.location}, ${data.expiryDate},
        ${data.registrationNumber}, ${data.notes}, ${data.scanRule}, ${segments},
        ${data.lotNumber}, ${data.productionDate}, ${data.rawBarcode},
        ${data.supplier}, ${data.unitPrice}
      ) returning *`)[0];
	if (!row) throw new Error("保存失败");
	return fromReagent(row);
});
var deleteReagent_createServerFn_handler = createServerRpc({
	id: "023358a8fa0547c50d1b7af320e16931f01bac731485f596a912443526d5773b",
	name: "deleteReagent",
	filename: "src/lib/reagents.ts"
}, (opts) => deleteReagent.__executeServer(opts));
var deleteReagent = createServerFn({ method: "POST" }).validator(object({ id: number() })).handler(deleteReagent_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	if (((await sql`
      select count(*)::int as c from stock_records where reagent_id = ${data.id}`)[0]?.c ?? 0) > 0) throw new Error("该试剂已有出入库记录，无法删除");
	if (((await sql`
      select count(*)::int as c from purchase_order_items where reagent_id = ${data.id}`)[0]?.c ?? 0) > 0) throw new Error("该试剂已有采购单，无法删除");
	await sql`delete from reagents where id = ${data.id}`;
	return { ok: true };
});
var stockItem = object({
	reagentId: number(),
	quantity: number().int().positive(),
	lotNumber: string().optional().default(""),
	expiryDate: string().optional().default(""),
	productionDate: string().optional().default(""),
	note: string().optional().default("")
});
var submitStockBatch_createServerFn_handler = createServerRpc({
	id: "f94c1289840551a23f35e137450d6da18ea52fb2ef2befcd5430da991068ef09",
	name: "submitStockBatch",
	filename: "src/lib/reagents.ts"
}, (opts) => submitStockBatch.__executeServer(opts));
var submitStockBatch = createServerFn({ method: "POST" }).validator(object({
	type: _enum(["in", "out"]),
	operator: string().optional().default("检验员"),
	department: string().optional().default("检验科"),
	reason: string().optional().default(""),
	items: array(stockItem).min(1)
})).handler(submitStockBatch_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const reason = data.reason || (data.type === "in" ? "扫码入库" : "扫码出库");
	for (const item of data.items) {
		const reagent = (await sql`select * from reagents where id = ${item.reagentId}`)[0];
		if (!reagent) throw new Error("试剂不存在");
		const current = Number(reagent.stock_quantity) || 0;
		if (data.type === "out" && item.quantity > current) throw new Error(`${reagent.name} 库存不足（当前 ${current}）`);
		const next = data.type === "in" ? current + item.quantity : Math.max(0, current - item.quantity);
		await sql`
        insert into stock_records (
          reagent_id, type, quantity, lot_number, expiry_date, production_date,
          note, operator, department, reason
        ) values (
          ${item.reagentId}, ${data.type}, ${item.quantity}, ${item.lotNumber},
          ${item.expiryDate}, ${item.productionDate}, ${item.note},
          ${data.operator}, ${data.department}, ${reason}
        )`;
		await sql`update reagents set stock_quantity = ${next} where id = ${item.reagentId}`;
	}
	return { count: data.items.length };
});
var listStockRecords_createServerFn_handler = createServerRpc({
	id: "d3f40c05a48560310858d107e6fee9c3929f145199f9d002883522c4d950f62b",
	name: "listStockRecords",
	filename: "src/lib/reagents.ts"
}, (opts) => listStockRecords.__executeServer(opts));
var listStockRecords = createServerFn({ method: "GET" }).handler(listStockRecords_createServerFn_handler, async () => {
	return (await (await getSql())`
    select s.*, r.name as reagent_name
    from stock_records s
    left join reagents r on r.id = s.reagent_id
    order by s.created_at desc, s.id desc
    limit 200`).map((r) => ({
		id: r.id,
		reagentId: r.reagent_id,
		reagentName: r.reagent_name || "未知试剂",
		type: r.type === "out" ? "out" : "in",
		quantity: Number(r.quantity) || 0,
		lotNumber: r.lot_number || "",
		expiryDate: r.expiry_date || "",
		productionDate: r.production_date || "",
		note: r.note || "",
		operator: r.operator || "",
		department: r.department || "",
		reason: r.reason || "",
		createdAt: r.created_at
	}));
});
function restockQty(stock, min) {
	if (min <= 0) return 0;
	if (stock > min) return 0;
	return Math.max(min * 2 - stock, min);
}
var createRestockOrder_createServerFn_handler = createServerRpc({
	id: "41f6014d6fc8e2f1a95e5dda810946149b2b3b2591ac051f0d10c737107a7fe7",
	name: "createRestockOrder",
	filename: "src/lib/reagents.ts"
}, (opts) => createRestockOrder.__executeServer(opts));
var createRestockOrder = createServerFn({ method: "POST" }).validator(object({ note: string().optional().default("") }).optional()).handler(createRestockOrder_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const reagents = await sql`
      select * from reagents
      where min_stock > 0 and stock_quantity <= min_stock
      order by stock_quantity asc, id asc`;
	if (reagents.length === 0) throw new Error("当前没有低于安全库存的试剂");
	const order = (await sql`
      insert into purchase_orders (status, note, item_count)
      values ('submitted', ${data?.note || "一键补货"}, ${reagents.length})
      returning *`)[0];
	if (!order) throw new Error("创建采购单失败");
	const items = [];
	for (const r of reagents) {
		const qty = restockQty(Number(r.stock_quantity) || 0, Number(r.min_stock) || 0);
		const item = (await sql`
        insert into purchase_order_items (
          order_id, reagent_id, quantity, unit, name, manufacturer, specification, supplier
        ) values (
          ${order.id}, ${r.id}, ${qty}, ${r.unit}, ${r.name}, ${r.manufacturer},
          ${r.specification}, ${r.supplier}
        ) returning *`)[0];
		if (item) items.push({
			id: item.id,
			orderId: item.order_id,
			reagentId: item.reagent_id,
			quantity: Number(item.quantity) || 0,
			unit: item.unit,
			name: item.name,
			manufacturer: item.manufacturer,
			specification: item.specification,
			supplier: item.supplier
		});
	}
	return {
		id: order.id,
		status: "submitted",
		note: order.note,
		itemCount: items.length,
		createdAt: order.created_at,
		items
	};
});
var listOrders_createServerFn_handler = createServerRpc({
	id: "f207e7ae9b22927fa79a50a8e0a9b14e9da3d264aaf1fffdfa2a475992f9215b",
	name: "listOrders",
	filename: "src/lib/reagents.ts"
}, (opts) => listOrders.__executeServer(opts));
var listOrders = createServerFn({ method: "GET" }).handler(listOrders_createServerFn_handler, async () => {
	const sql = await getSql();
	const orders = await sql`select * from purchase_orders order by created_at desc, id desc`;
	const items = await sql`select * from purchase_order_items order by id asc`;
	const byOrder = /* @__PURE__ */ new Map();
	for (const item of items) {
		const list = byOrder.get(item.order_id) ?? [];
		list.push({
			id: item.id,
			orderId: item.order_id,
			reagentId: item.reagent_id,
			quantity: Number(item.quantity) || 0,
			unit: item.unit,
			name: item.name,
			manufacturer: item.manufacturer,
			specification: item.specification,
			supplier: item.supplier
		});
		byOrder.set(item.order_id, list);
	}
	return orders.map((o) => ({
		id: o.id,
		status: o.status === "received" || o.status === "cancelled" ? o.status : "submitted",
		note: o.note,
		itemCount: Number(o.item_count) || 0,
		createdAt: o.created_at,
		items: byOrder.get(o.id) ?? []
	}));
});
var receiveOrder_createServerFn_handler = createServerRpc({
	id: "a29f4f762435b1ada22aede26a09782cdb3fa981b5204b0812182f1d842bc7f2",
	name: "receiveOrder",
	filename: "src/lib/reagents.ts"
}, (opts) => receiveOrder.__executeServer(opts));
var receiveOrder = createServerFn({ method: "POST" }).validator(object({
	id: number(),
	operator: string().optional().default("检验员")
})).handler(receiveOrder_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const order = (await sql`select * from purchase_orders where id = ${data.id}`)[0];
	if (!order) throw new Error("采购单不存在");
	if (order.status !== "submitted") throw new Error("该采购单已处理");
	const items = await sql`select * from purchase_order_items where order_id = ${data.id}`;
	for (const item of items) {
		const reagent = (await sql`select * from reagents where id = ${item.reagent_id}`)[0];
		if (!reagent) continue;
		await sql`update reagents set stock_quantity = ${(Number(reagent.stock_quantity) || 0) + (Number(item.quantity) || 0)} where id = ${item.reagent_id}`;
		await sql`
        insert into stock_records (
          reagent_id, type, quantity, lot_number, expiry_date, production_date,
          note, operator, department, reason
        ) values (
          ${item.reagent_id}, 'in', ${item.quantity}, ${reagent.lot_number},
          ${reagent.expiry_date}, ${reagent.production_date},
          ${"采购单 #" + data.id}, ${data.operator}, '检验科', '采购入库'
        )`;
	}
	await sql`update purchase_orders set status = 'received' where id = ${data.id}`;
	return { ok: true };
});
//#endregion
export { createRestockOrder_createServerFn_handler, deleteReagent_createServerFn_handler, listOrders_createServerFn_handler, listReagents_createServerFn_handler, listStockRecords_createServerFn_handler, receiveOrder_createServerFn_handler, saveReagent_createServerFn_handler, submitStockBatch_createServerFn_handler };
