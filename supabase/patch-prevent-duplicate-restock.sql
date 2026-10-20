-- 一键下单：未补过安全库存的已下单试剂不重复。
-- 入库后库存曾经高于安全库存，旧采购单不再挡住；再次缺货可以直接再下。
-- 不需要关闭采购单，也不改库存。可重复执行。
--
-- 使用方法：
--   1. 打开 https://supabase.com/dashboard/project/eqgrtoeivuykemfferwb/sql/new
--   2. 粘贴本文件全部内容
--   3. 点击 Run

create or replace function public.restock_line_still_blocks(
  p_tenant_id uuid,
  p_reagent_id bigint,
  p_min_stock integer,
  p_ordered_at timestamptz
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
  qty integer := 0;
  seen_inbound boolean := false;
begin
  if p_min_stock is null or p_min_stock <= 0 then
    return false;
  end if;

  for rec in
    select type, quantity, created_at
    from public.stock_records
    where tenant_id = p_tenant_id
      and reagent_id = p_reagent_id
    order by created_at, id
  loop
    if rec.created_at <= p_ordered_at then
      qty := qty + case when rec.type = 'in' then rec.quantity else -rec.quantity end;
      continue;
    end if;
    if rec.type = 'in' then
      seen_inbound := true;
    end if;
    qty := qty + case when rec.type = 'in' then rec.quantity else -rec.quantity end;
    if seen_inbound and qty > p_min_stock then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

create or replace function public.create_restock_order(p_tenant_id uuid, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order public.purchase_orders;
  reagent_row public.reagents;
  target_quantity integer;
  inserted_count integer := 0;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception '只有检验科管理员可以创建采购单';
  end if;

  perform pg_advisory_xact_lock(hashtext('restock:' || p_tenant_id::text));

  if not exists (
    select 1
    from public.reagents r
    where r.tenant_id = p_tenant_id
      and r.min_stock > 0
      and r.stock_quantity <= r.min_stock
      and not exists (
        select 1
        from public.purchase_order_items i
        join public.purchase_orders o
          on o.id = i.order_id
         and o.tenant_id = i.tenant_id
        where i.tenant_id = p_tenant_id
          and i.reagent_id = r.id
          and o.status = 'submitted'
          and public.restock_line_still_blocks(p_tenant_id, r.id, r.min_stock, o.created_at)
      )
  ) then
    raise exception '缺货试剂都已在采购单中，且入库后库存还没高于安全库存，无需重复下单';
  end if;

  insert into public.purchase_orders (tenant_id, status, note, item_count)
  values (p_tenant_id, 'submitted', coalesce(p_note, ''), 0)
  returning * into new_order;

  for reagent_row in
    select r.*
    from public.reagents r
    where r.tenant_id = p_tenant_id
      and r.min_stock > 0
      and r.stock_quantity <= r.min_stock
      and not exists (
        select 1
        from public.purchase_order_items i
        join public.purchase_orders o
          on o.id = i.order_id
         and o.tenant_id = i.tenant_id
        where i.tenant_id = p_tenant_id
          and i.reagent_id = r.id
          and o.status = 'submitted'
          and public.restock_line_still_blocks(p_tenant_id, r.id, r.min_stock, o.created_at)
      )
    order by r.id
  loop
    target_quantity := greatest(reagent_row.min_stock * 2 - reagent_row.stock_quantity, 1);
    insert into public.purchase_order_items
      (tenant_id, order_id, reagent_id, quantity, unit, name, manufacturer, specification, supplier)
    values
      (p_tenant_id, new_order.id, reagent_row.id, target_quantity,
       reagent_row.unit, reagent_row.name, reagent_row.manufacturer, reagent_row.specification, reagent_row.supplier);
    inserted_count := inserted_count + 1;
  end loop;

  update public.purchase_orders
    set item_count = inserted_count
    where id = new_order.id and tenant_id = p_tenant_id;

  return jsonb_build_object('id', new_order.id, 'item_count', inserted_count);
end;
$$;

create or replace function public.create_restock_order_once(p_tenant_id uuid, p_note text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.create_restock_order(p_tenant_id, p_note);
$$;

create or replace function public.create_restock_order_auto(p_tenant_id uuid, p_note text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.create_restock_order(p_tenant_id, p_note);
$$;

revoke all on function public.restock_line_still_blocks(uuid, bigint, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.create_restock_order_auto(uuid, text) from public, anon;
grant execute on function public.create_restock_order_auto(uuid, text) to authenticated;
