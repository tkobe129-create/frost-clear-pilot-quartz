-- 一键下单不再重复生成未关闭采购单里的试剂。
-- 关闭采购单只改状态，不增加库存。可重复执行。
--
-- 使用方法：
--   1. 打开 https://supabase.com/dashboard/project/eqgrtoeivuykemfferwb/sql/new
--   2. 粘贴本文件全部内容
--   3. 点击 Run

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

  -- Serialize one-click orders for this lab so two taps cannot both pass the check.
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
      )
  ) then
    raise exception '缺货试剂都已在未关闭的采购单中，无需重复下单';
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

-- Probe used by the website. Missing this function means the patch is not installed yet.
create or replace function public.create_restock_order_once(p_tenant_id uuid, p_note text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.create_restock_order(p_tenant_id, p_note);
$$;

create or replace function public.close_purchase_order(p_tenant_id uuid, p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id bigint;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception '只有检验科管理员可以关闭采购单';
  end if;

  update public.purchase_orders
    set status = 'cancelled'
    where id = p_id
      and tenant_id = p_tenant_id
      and status = 'submitted'
    returning id into updated_id;

  if updated_id is null then
    raise exception '采购单不存在或已关闭';
  end if;
end;
$$;

revoke all on function public.create_restock_order_once(uuid, text) from public, anon;
grant execute on function public.create_restock_order_once(uuid, text) to authenticated;
revoke all on function public.close_purchase_order(uuid, bigint) from public, anon;
grant execute on function public.close_purchase_order(uuid, bigint) to authenticated;
