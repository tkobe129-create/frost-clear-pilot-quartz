-- Protect reagent inventory from direct PostgREST table edits. Apply once in the
-- Supabase SQL editor; existing reagent quantities are not rewritten.
revoke insert, update on public.reagents from public, anon, authenticated;
grant update (
  code, name, category, specification, manufacturer, unit, min_stock,
  storage_condition, location, expiry_date, registration_number, notes,
  scan_rule, scan_segments, lot_number, production_date, raw_barcode,
  supplier, unit_price
) on public.reagents to authenticated;
grant delete on public.reagents to authenticated;

-- 试剂资料通过受控 RPC 保存；期初库存以入库流水原子记录，编辑资料永远不改库存。
create or replace function public.save_reagent(
  p_tenant_id uuid,
  p_id bigint,
  p_reagent jsonb,
  p_initial_stock integer,
  p_operator text
)
returns public.reagents
language plpgsql security definer set search_path = public
as $$
declare
  saved public.reagents;
  opening_stock integer := coalesce(p_initial_stock, 0);
begin
  if not public.is_tenant_admin(p_tenant_id) then raise exception '只有检验科管理员可以保存试剂'; end if;
  if p_reagent is null or jsonb_typeof(p_reagent) is distinct from 'object' then raise exception '试剂资料格式错误'; end if;
  if opening_stock < 0 then raise exception '期初库存不能小于 0'; end if;

  if p_id is null then
    insert into public.reagents (
      tenant_id, code, name, category, specification, manufacturer, unit,
      stock_quantity, min_stock, storage_condition, location, expiry_date,
      registration_number, notes, scan_rule, scan_segments, lot_number,
      production_date, raw_barcode, supplier, unit_price
    ) values (
      p_tenant_id,
      coalesce(p_reagent->>'code', ''),
      coalesce(p_reagent->>'name', ''),
      coalesce(p_reagent->>'category', ''),
      coalesce(p_reagent->>'specification', ''),
      coalesce(p_reagent->>'manufacturer', ''),
      coalesce(p_reagent->>'unit', '盒'),
      0,
      coalesce(nullif(p_reagent->>'min_stock', '')::integer, 0),
      coalesce(p_reagent->>'storage_condition', ''),
      coalesce(p_reagent->>'location', ''),
      coalesce(p_reagent->>'expiry_date', ''),
      coalesce(p_reagent->>'registration_number', ''),
      coalesce(p_reagent->>'notes', ''),
      coalesce(p_reagent->>'scan_rule', ''),
      case when jsonb_typeof(p_reagent->'scan_segments') = 'array' then p_reagent->'scan_segments' else '[]'::jsonb end,
      coalesce(p_reagent->>'lot_number', ''),
      coalesce(p_reagent->>'production_date', ''),
      coalesce(p_reagent->>'raw_barcode', ''),
      coalesce(p_reagent->>'supplier', ''),
      coalesce(nullif(p_reagent->>'unit_price', '')::numeric, 0)
    ) returning * into saved;

    if opening_stock > 0 then
      update public.reagents set stock_quantity = opening_stock
        where id = saved.id and tenant_id = p_tenant_id returning * into saved;
      insert into public.stock_records (
        tenant_id, reagent_id, type, quantity, lot_number, expiry_date,
        production_date, note, operator, department, reason
      ) values (
        p_tenant_id, saved.id, 'in', opening_stock, saved.lot_number,
        saved.expiry_date, saved.production_date, '新建试剂期初库存',
        coalesce(nullif(p_operator, ''), '管理员'), '检验科', '期初库存'
      );
    end if;
    return saved;
  end if;

  if opening_stock <> 0 then raise exception '编辑试剂资料不能变更库存'; end if;
  update public.reagents set
    code = coalesce(p_reagent->>'code', ''),
    name = coalesce(p_reagent->>'name', ''),
    category = coalesce(p_reagent->>'category', ''),
    specification = coalesce(p_reagent->>'specification', ''),
    manufacturer = coalesce(p_reagent->>'manufacturer', ''),
    unit = coalesce(p_reagent->>'unit', '盒'),
    min_stock = coalesce(nullif(p_reagent->>'min_stock', '')::integer, 0),
    storage_condition = coalesce(p_reagent->>'storage_condition', ''),
    location = coalesce(p_reagent->>'location', ''),
    expiry_date = coalesce(p_reagent->>'expiry_date', ''),
    registration_number = coalesce(p_reagent->>'registration_number', ''),
    notes = coalesce(p_reagent->>'notes', ''),
    scan_rule = coalesce(p_reagent->>'scan_rule', ''),
    scan_segments = case when jsonb_typeof(p_reagent->'scan_segments') = 'array' then p_reagent->'scan_segments' else '[]'::jsonb end,
    lot_number = coalesce(p_reagent->>'lot_number', ''),
    production_date = coalesce(p_reagent->>'production_date', ''),
    raw_barcode = coalesce(p_reagent->>'raw_barcode', ''),
    supplier = coalesce(p_reagent->>'supplier', ''),
    unit_price = coalesce(nullif(p_reagent->>'unit_price', '')::numeric, 0)
  where id = p_id and tenant_id = p_tenant_id
  returning * into saved;
  if saved.id is null then raise exception '试剂不存在或不属于当前检验科'; end if;
  return saved;
end;
$$;

revoke all on function public.save_reagent(uuid, bigint, jsonb, integer, text) from public, anon;
grant execute on function public.save_reagent(uuid, bigint, jsonb, integer, text) to authenticated;
