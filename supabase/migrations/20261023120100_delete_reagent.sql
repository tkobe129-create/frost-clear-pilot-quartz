-- 管理员可删除试剂，并同时删除其库存流水和采购单明细。
-- 可重复执行，不改其他试剂。
--
-- 由发布流程自动执行。不要在 SQL 编辑器里手工粘贴。

create or replace function public.delete_reagent(p_tenant_id uuid, p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reagent_row public.reagents;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception '只有检验科管理员可以删除试剂';
  end if;

  select * into reagent_row
  from public.reagents
  where id = p_id and tenant_id = p_tenant_id
  for update;

  if reagent_row.id is null then
    raise exception '试剂不存在或不属于当前检验科';
  end if;

  delete from public.stock_records
  where tenant_id = p_tenant_id and reagent_id = p_id;

  with removed as (
    delete from public.purchase_order_items
    where tenant_id = p_tenant_id and reagent_id = p_id
    returning order_id
  )
  update public.purchase_orders as orders
  set item_count = (
    select count(*)
    from public.purchase_order_items as items
    where items.order_id = orders.id and items.tenant_id = orders.tenant_id
  )
  where orders.tenant_id = p_tenant_id
    and orders.id in (select removed.order_id from removed);

  delete from public.reagents
  where id = p_id and tenant_id = p_tenant_id;
end;
$$;

revoke all on function public.delete_reagent(uuid, bigint) from public, anon;
grant execute on function public.delete_reagent(uuid, bigint) to authenticated;
