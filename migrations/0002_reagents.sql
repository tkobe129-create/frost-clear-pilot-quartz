-- 权盾智检 · 试剂库存 / 出入库 / 采购单
create table if not exists reagents (
  id                  serial primary key,
  code                text not null default '',
  name                text not null default '',
  category            text not null default '',
  specification       text not null default '',
  manufacturer        text not null default '',
  unit                text not null default '盒',
  stock_quantity      integer not null default 0,
  min_stock           integer not null default 0,
  storage_condition   text not null default '',
  location            text not null default '',
  expiry_date         text not null default '',
  registration_number text not null default '',
  notes               text not null default '',
  scan_rule           text not null default '',
  scan_segments       text not null default '[]',
  lot_number          text not null default '',
  production_date     text not null default '',
  raw_barcode         text not null default '',
  supplier            text not null default '',
  unit_price          integer not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists reagents_code_idx on reagents (code);
create index if not exists reagents_scan_rule_idx on reagents (scan_rule);

create table if not exists stock_records (
  id              serial primary key,
  reagent_id      integer not null references reagents(id),
  type            text not null,
  quantity        integer not null,
  lot_number      text not null default '',
  expiry_date     text not null default '',
  production_date text not null default '',
  note            text not null default '',
  operator        text not null default '',
  department      text not null default '',
  reason          text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists stock_records_reagent_idx on stock_records (reagent_id);
create index if not exists stock_records_created_idx on stock_records (created_at desc);

create table if not exists purchase_orders (
  id          serial primary key,
  status      text not null default 'submitted',
  note        text not null default '',
  item_count  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id            serial primary key,
  order_id      integer not null references purchase_orders(id) on delete cascade,
  reagent_id    integer not null references reagents(id),
  quantity      integer not null,
  unit          text not null default '',
  name          text not null default '',
  manufacturer  text not null default '',
  specification text not null default '',
  supplier      text not null default ''
);

-- 预置检验科常见试剂，覆盖低库存 / 近效期 / 过期 / 正常，便于扫码演示
insert into reagents (
  code, name, category, specification, manufacturer, unit,
  stock_quantity, min_stock, storage_condition, location, expiry_date,
  registration_number, notes, scan_rule, scan_segments, lot_number,
  production_date, raw_barcode, supplier, unit_price
) values
(
  '06954414719413',
  '糖化血红蛋白测定试剂',
  '生化',
  '100人份/盒',
  '罗氏诊断',
  '盒',
  24, 8, '2–8℃', '冷藏A-01',
  '2027-06-06',
  '国械注进20152401234',
  'HbA1c 免疫比浊法，配套校准品。',
  '06954414719413',
  '[{"ai":"01","desc":"GTIN"},{"ai":"11","desc":"生产日期"},{"ai":"17","desc":"有效期至"},{"ai":"10","desc":"批号"}]',
  'AB25100721H000502',
  '2025-12-06',
  '(01)06954414719413(11)251206(17)270606(10)AB25100721H000502',
  '罗氏诊断（上海）有限公司',
  1860
),
(
  '06901800001234',
  '心肌肌钙蛋白I测定试剂盒',
  '免疫',
  '50人份/盒',
  '雅培',
  '盒',
  2, 10, '2–8℃', '冷藏A-03',
  to_char(CURRENT_DATE + 80, 'YYYY-MM-DD'),
  '国械注进20183401567',
  'cTnI 化学发光法。低库存预警。',
  '06901800001234',
  '[{"ai":"01","desc":"GTIN"},{"ai":"17","desc":"有效期至"},{"ai":"10","desc":"批号"}]',
  'CTn2509A',
  '2025-09-12',
  '(01)06901800001234(17)270412(10)CTn2509A',
  '雅培贸易（上海）有限公司',
  2480
),
(
  '06920000005678',
  '降钙素原 PCT 测定试剂',
  '免疫',
  '100人份/盒',
  '罗氏诊断',
  '盒',
  0, 6, '2–8℃', '冷藏B-02',
  to_char(CURRENT_DATE + 140, 'YYYY-MM-DD'),
  '国械注进20192401890',
  '缺货，需立即补货。',
  '06920000005678',
  '[{"ai":"01","desc":"GTIN"},{"ai":"11","desc":"生产日期"},{"ai":"17","desc":"有效期至"},{"ai":"10","desc":"批号"}]',
  'PCT2601B',
  '2026-01-08',
  '(01)06920000005678(11)260108(17)270508(10)PCT2601B',
  '罗氏诊断（上海）有限公司',
  3120
),
(
  '06903300009876',
  '超敏 C 反应蛋白试剂',
  '免疫',
  '200人份/盒',
  '贝克曼库尔特',
  '盒',
  9, 8, '2–8℃', '冷藏A-07',
  to_char(CURRENT_DATE + 11, 'YYYY-MM-DD'),
  '国械注进20172402211',
  '近效期，请优先使用。',
  '06903300009876',
  '[{"ai":"01","desc":"GTIN"},{"ai":"17","desc":"有效期至"},{"ai":"10","desc":"批号"}]',
  'CRP2508X',
  '2025-08-01',
  '(01)06903300009876(17)' || to_char(CURRENT_DATE + 11, 'YYMMDD') || '(10)CRP2508X',
  '贝克曼库尔特商贸（中国）有限公司',
  980
),
(
  '06905500001122',
  '乙型肝炎病毒表面抗原试剂盒',
  '免疫',
  '96人份/盒',
  '安图生物',
  '盒',
  18, 6, '2–8℃', '冷藏C-01',
  '2027-11-20',
  '国械注准20173400112',
  'HBsAg ELISA。',
  '06905500001122',
  '[{"ai":"01","desc":"GTIN"},{"ai":"10","desc":"批号"},{"ai":"17","desc":"有效期至"}]',
  'HBs2603',
  '2026-03-20',
  '(01)06905500001122(10)HBs2603(17)271120',
  '郑州安图生物工程股份有限公司',
  420
),
(
  '06907700003344',
  '全自动生化复合校准品',
  '生化',
  '5mL × 6',
  '迈瑞',
  '套',
  4, 2, '-20℃', '冷冻D-01',
  '2026-12-01',
  '粤械注准20202400101',
  '配套 BS 系列生化仪。',
  '06907700003344',
  '[{"ai":"01","desc":"GTIN"},{"ai":"17","desc":"有效期至"},{"ai":"10","desc":"批号"}]',
  'CAL2602',
  '2026-02-01',
  '(01)06907700003344(17)261201(10)CAL2602',
  '深圳迈瑞生物医疗电子股份有限公司',
  760
),
(
  '06908800005566',
  '质控品水平 1（过期）',
  '质控',
  '5mL × 10',
  '伯乐',
  '盒',
  3, 2, '2–8℃', '冷藏Q-01',
  to_char(CURRENT_DATE - 6, 'YYYY-MM-DD'),
  '国械注进20152409901',
  '已过期，禁止继续使用，待报损。',
  '06908800005566',
  '[{"ai":"01","desc":"GTIN"},{"ai":"17","desc":"有效期至"},{"ai":"10","desc":"批号"}]',
  'QC1-2501',
  '2025-01-10',
  '(01)06908800005566(17)' || to_char(CURRENT_DATE - 6, 'YYMMDD') || '(10)QC1-2501',
  '伯乐生命医学产品（上海）有限公司',
  540
),
(
  '06909900007788',
  '血细胞分析稀释液',
  '血球',
  '20L/桶',
  '迈瑞',
  '桶',
  12, 4, '常温', '常温E-04',
  '2028-01-15',
  '粤械注准20182400331',
  'BC 系列血球仪配套。',
  '06909900007788',
  '[{"ai":"01","desc":"GTIN"},{"ai":"10","desc":"批号"}]',
  'DIL2801',
  '2026-01-15',
  '(01)06909900007788(10)DIL2801',
  '深圳迈瑞生物医疗电子股份有限公司',
  210
);

insert into stock_records (
  reagent_id, type, quantity, lot_number, expiry_date, production_date,
  note, operator, department, reason, created_at
) values
(1, 'in', 10, 'AB25100721H000502', '2027-06-06', '2025-12-06', '月度补货', '检验员', '检验科', '采购入库', now() - interval '12 days'),
(1, 'out', 2, 'AB25100721H000502', '2027-06-06', '2025-12-06', '日常检测', '检验员', '检验科', '日常消耗', now() - interval '2 days'),
(2, 'out', 3, 'CTn2509A', to_char(CURRENT_DATE + 80, 'YYYY-MM-DD'), '2025-09-12', '急诊使用', '检验员', '检验科', '日常消耗', now() - interval '1 day'),
(4, 'in', 6, 'CRP2508X', to_char(CURRENT_DATE + 11, 'YYYY-MM-DD'), '2025-08-01', '近效期批次到货', '检验员', '检验科', '采购入库', now() - interval '20 days'),
(5, 'in', 8, 'HBs2603', '2027-11-20', '2026-03-20', '常规采购', '检验员', '检验科', '采购入库', now() - interval '30 days'),
(8, 'out', 1, 'DIL2801', '2028-01-15', '2026-01-15', '更换稀释液', '检验员', '检验科', '日常消耗', now() - interval '5 days');
