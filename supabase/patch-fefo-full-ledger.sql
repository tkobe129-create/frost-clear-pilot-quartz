-- 修复：FEFO 批次余量由数据库汇总完整库存台账，出库时在数据库核对批次库存。
-- 可重复执行，不删除或重写既有库存记录。

create index if not exists stock_records_batch_idx
  on public.stock_records (tenant_id, reagent_id, lot_number, expiry_date, production_date);

create or replace function public.list_available_stock_batches(p_tenant_id uuid)
returns table (
  reagent_id bigint,
  lot_number text,
  expiry_date text,
  production_date text,
  quantity bigint
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if p_tenant_id is null or not public.is_tenant_member(p_tenant_id) then
    raise exception '无权访问该检验科';
  end if;

  return query
  with tenant_reagents as (
    select r.id, r.lot_number, r.expiry_date, r.production_date, r.stock_quantity
    from public.reagents r
    where r.tenant_id = p_tenant_id
  ),
  batch_ledger as (
    select
      sr.reagent_id,
      sr.lot_number,
      sr.expiry_date,
      sr.production_date,
      sum(case when sr.type = 'in' then sr.quantity else -sr.quantity end)::bigint as quantity
    from public.stock_records sr
    where sr.tenant_id = p_tenant_id
      and (sr.lot_number <> '' or sr.expiry_date <> '')
    group by sr.reagent_id, sr.lot_number, sr.expiry_date, sr.production_date
  ),
  known_net as (
    select bl.reagent_id, sum(bl.quantity)::bigint as quantity
    from batch_ledger bl
    group by bl.reagent_id
  ),
  combined as (
    select bl.reagent_id, bl.lot_number, bl.expiry_date, bl.production_date, bl.quantity
    from batch_ledger bl
    union all
    select
      r.id,
      r.lot_number,
      r.expiry_date,
      r.production_date,
      (r.stock_quantity - coalesce(kn.quantity, 0))::bigint
    from tenant_reagents r
    left join known_net kn on kn.reagent_id = r.id
  )
  select c.reagent_id, c.lot_number, c.expiry_date, c.production_date, sum(c.quantity)::bigint
  from combined c
  group by c.reagent_id, c.lot_number, c.expiry_date, c.production_date
  having sum(c.quantity) > 0;
end;
$$;

create or replace function public.submit_stock_batch(
  p_tenant_id uuid, p_type text, p_operator text, p_department text, p_reason text, p_items jsonb
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  item jsonb;
  reagent_row public.reagents;
  item_quantity integer;
  batch_lot text;
  batch_expiry text;
  batch_production text;
  batch_net bigint;
  known_net bigint;
  available_batch bigint;
  total integer := 0;
begin
  if not public.is_tenant_member(p_tenant_id) then raise exception '无权访问该检验科'; end if;
  if p_type is null or p_type not in ('in', 'out') then raise exception '无效的库存操作'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception '库存明细格式错误'; end if;

  for item in select * from jsonb_array_elements(p_items) loop
    item_quantity := (item->>'quantity')::integer;
    if item_quantity is null or item_quantity <= 0 then raise exception '数量必须大于 0'; end if;
    batch_lot := coalesce(item->>'lot_number', '');
    batch_expiry := coalesce(item->>'expiry_date', '');
    batch_production := coalesce(item->>'production_date', '');

    select * into reagent_row
    from public.reagents
    where id = (item->>'reagent_id')::bigint and tenant_id = p_tenant_id
    for update;
    if reagent_row.id is null then raise exception '试剂不存在或不属于当前检验科'; end if;

    if p_type = 'out' then
      if reagent_row.stock_quantity < item_quantity then
        raise exception '出库数量超过库存：%', reagent_row.name;
      end if;

      select coalesce(sum(case when sr.type = 'in' then sr.quantity else -sr.quantity end), 0)::bigint
      into batch_net
      from public.stock_records sr
      where sr.tenant_id = p_tenant_id
        and sr.reagent_id = reagent_row.id
        and (sr.lot_number <> '' or sr.expiry_date <> '')
        and sr.lot_number = batch_lot
        and sr.expiry_date = batch_expiry
        and sr.production_date = batch_production;

      select coalesce(sum(case when sr.type = 'in' then sr.quantity else -sr.quantity end), 0)::bigint
      into known_net
      from public.stock_records sr
      where sr.tenant_id = p_tenant_id
        and sr.reagent_id = reagent_row.id
        and (sr.lot_number <> '' or sr.expiry_date <> '');

      available_batch := batch_net;
      if batch_lot = reagent_row.lot_number
        and batch_expiry = reagent_row.expiry_date
        and batch_production = reagent_row.production_date then
        available_batch := available_batch + reagent_row.stock_quantity - known_net;
      end if;
      if available_batch < item_quantity then
        raise exception '所选批次库存不足：%', reagent_row.name;
      end if;
    end if;

    update public.reagents
      set stock_quantity = stock_quantity + case when p_type = 'in' then item_quantity else -item_quantity end
      where id = reagent_row.id and tenant_id = p_tenant_id;
    insert into public.stock_records
      (tenant_id, reagent_id, type, quantity, lot_number, expiry_date, production_date, note, operator, department, reason)
    values
      (p_tenant_id, reagent_row.id, p_type, item_quantity,
       batch_lot, batch_expiry, batch_production, coalesce(item->>'note', ''),
       coalesce(p_operator, ''), coalesce(p_department, ''), coalesce(p_reason, ''));
    total := total + 1;
  end loop;
  return total;
end;
$$;

revoke all on function public.list_available_stock_batches(uuid) from public, anon;
grant execute on function public.list_available_stock_batches(uuid) to authenticated;
grant execute on function public.submit_stock_batch(uuid, text, text, text, text, jsonb) to authenticated;

select 'fefo_full_ledger_patch_applied' as status;
