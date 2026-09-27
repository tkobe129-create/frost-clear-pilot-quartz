-- 权盾智检第一版多租户：一个检验科是一个租户，成员共享该租户的全部业务数据。
-- 依赖 Supabase Auth（auth.uid()）。上线前请在 Supabase SQL Editor 执行本迁移。

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null,
  status      text not null default 'active' check (status in ('active', 'disabled')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create unique index if not exists tenants_code_lower_idx on public.tenants (lower(code));

create table if not exists public.tenant_members (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_members_user_idx on public.tenant_members (user_id);

create table if not exists public.tenant_invites (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  code        text not null unique,
  role        text not null default 'employee' check (role = 'employee'),
  created_by  uuid not null references auth.users(id) on delete restrict,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists tenant_invites_tenant_idx on public.tenant_invites (tenant_id, created_at desc);

-- 给既有单租户数据建立一个默认检验科，迁移后由第一个管理员认领。
insert into public.tenants (id, name, code)
values ('00000000-0000-0000-0000-000000000001', '权盾智检演示检验科', 'DEMO-LAB')
on conflict (id) do nothing;

alter table public.reagents add column if not exists tenant_id uuid;
alter table public.stock_records add column if not exists tenant_id uuid;
alter table public.purchase_orders add column if not exists tenant_id uuid;
alter table public.purchase_order_items add column if not exists tenant_id uuid;

update public.reagents set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;
update public.stock_records set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;
update public.purchase_orders set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;
update public.purchase_order_items set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;

alter table public.reagents alter column tenant_id set not null;
alter table public.stock_records alter column tenant_id set not null;
alter table public.purchase_orders alter column tenant_id set not null;
alter table public.purchase_order_items alter column tenant_id set not null;

alter table public.reagents drop constraint if exists reagents_tenant_fk;
alter table public.stock_records drop constraint if exists stock_records_tenant_fk;
alter table public.purchase_orders drop constraint if exists purchase_orders_tenant_fk;
alter table public.purchase_order_items drop constraint if exists purchase_order_items_tenant_fk;
alter table public.reagents add constraint reagents_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.stock_records add constraint stock_records_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.purchase_orders add constraint purchase_orders_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.purchase_order_items add constraint purchase_order_items_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete cascade;

create index if not exists reagents_tenant_idx on public.reagents (tenant_id, id);
create index if not exists stock_records_tenant_idx on public.stock_records (tenant_id, created_at desc);
create index if not exists purchase_orders_tenant_idx on public.purchase_orders (tenant_id, created_at desc);
create index if not exists purchase_order_items_tenant_idx on public.purchase_order_items (tenant_id, order_id);
create unique index if not exists reagents_tenant_code_idx on public.reagents (tenant_id, code) where code <> '';

create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = p_tenant_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_admin(p_tenant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = p_tenant_id and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

-- 首个账号可以认领旧数据所在的默认租户；之后必须通过邀请码加入。
create or replace function public.claim_default_tenant()
returns public.tenants
language plpgsql security definer set search_path = public
as $$
declare
  result public.tenants;
  default_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if exists (select 1 from public.tenant_members where user_id = auth.uid()) then
    raise exception '该账号已经加入检验科';
  end if;
  if exists (select 1 from public.tenant_members where tenant_id = default_id) then
    raise exception '默认检验科已经被认领，请使用邀请码加入';
  end if;
  insert into public.tenant_members (tenant_id, user_id, role)
  values (default_id, auth.uid(), 'admin');
  select * into result from public.tenants where id = default_id;
  return result;
end;
$$;

create or replace function public.create_tenant(p_name text, p_code text)
returns public.tenants
language plpgsql security definer set search_path = public
as $$
declare
  result public.tenants;
  normalized_code text := upper(trim(p_code));
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if trim(coalesce(p_name, '')) = '' or normalized_code = '' then raise exception '检验科名称和编码不能为空'; end if;
  if exists (select 1 from public.tenant_members where user_id = auth.uid()) then
    raise exception '该账号已经加入检验科';
  end if;
  insert into public.tenants (name, code, created_by)
  values (trim(p_name), normalized_code, auth.uid())
  returning * into result;
  insert into public.tenant_members (tenant_id, user_id, role)
  values (result.id, auth.uid(), 'admin');
  return result;
end;
$$;

create or replace function public.create_tenant_invite(p_tenant_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  invite_code text;
begin
  if not public.is_tenant_admin(p_tenant_id) then raise exception '只有检验科管理员可以生成邀请码'; end if;
  invite_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
  insert into public.tenant_invites (tenant_id, code, created_by)
  values (p_tenant_id, invite_code, auth.uid());
  return invite_code;
end;
$$;

create or replace function public.accept_tenant_invite(p_code text)
returns public.tenants
language plpgsql security definer set search_path = public
as $$
declare
  invite_row public.tenant_invites;
  result public.tenants;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if exists (select 1 from public.tenant_members where user_id = auth.uid()) then
    raise exception '该账号已经加入检验科';
  end if;
  select * into invite_row from public.tenant_invites
  where code = upper(trim(p_code)) and used_by is null and expires_at > now()
  for update;
  if invite_row.id is null then raise exception '邀请码无效或已过期'; end if;
  insert into public.tenant_members (tenant_id, user_id, role)
  values (invite_row.tenant_id, auth.uid(), 'employee');
  update public.tenant_invites set used_by = auth.uid(), used_at = now() where id = invite_row.id;
  select * into result from public.tenants where id = invite_row.tenant_id;
  return result;
end;
$$;

-- RLS：所有业务数据只能被当前用户所属检验科访问。
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.tenant_invites enable row level security;
alter table public.reagents enable row level security;
alter table public.stock_records enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

drop policy if exists tenants_member_select on public.tenants;
create policy tenants_member_select on public.tenants for select using (public.is_tenant_member(id));
drop policy if exists tenant_members_self_or_admin_select on public.tenant_members;
create policy tenant_members_self_or_admin_select on public.tenant_members for select using (user_id = auth.uid() or public.is_tenant_admin(tenant_id));
drop policy if exists tenant_invites_admin_select on public.tenant_invites;
create policy tenant_invites_admin_select on public.tenant_invites for select using (public.is_tenant_admin(tenant_id));

drop policy if exists reagents_member_select on public.reagents;
create policy reagents_member_select on public.reagents for select using (public.is_tenant_member(tenant_id));
drop policy if exists reagents_admin_insert on public.reagents;
create policy reagents_admin_insert on public.reagents for insert with check (public.is_tenant_admin(tenant_id));
drop policy if exists reagents_admin_update on public.reagents;
create policy reagents_admin_update on public.reagents for update using (public.is_tenant_admin(tenant_id)) with check (public.is_tenant_admin(tenant_id));
drop policy if exists reagents_admin_delete on public.reagents;
create policy reagents_admin_delete on public.reagents for delete using (public.is_tenant_admin(tenant_id));

drop policy if exists stock_records_member_select on public.stock_records;
create policy stock_records_member_select on public.stock_records for select using (public.is_tenant_member(tenant_id));
drop policy if exists purchase_orders_member_select on public.purchase_orders;
create policy purchase_orders_member_select on public.purchase_orders for select using (public.is_tenant_member(tenant_id));
drop policy if exists purchase_order_items_member_select on public.purchase_order_items;
create policy purchase_order_items_member_select on public.purchase_order_items for select using (public.is_tenant_member(tenant_id));

-- 业务写入通过下方 RPC 完成，避免员工直接修改库存数量。
revoke all on function public.claim_default_tenant() from public;
grant execute on function public.claim_default_tenant() to anon, authenticated;
revoke all on function public.create_tenant(text, text) from public;
grant execute on function public.create_tenant(text, text) to anon, authenticated;
revoke all on function public.create_tenant_invite(uuid) from public;
grant execute on function public.create_tenant_invite(uuid) to authenticated;
revoke all on function public.accept_tenant_invite(text) from public;
grant execute on function public.accept_tenant_invite(text) to authenticated;

-- 下面三个 RPC 都要求传入当前租户，并在函数内再次校验成员关系。
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
  total integer := 0;
begin
  if not public.is_tenant_member(p_tenant_id) then raise exception '无权访问该检验科'; end if;
  if p_type not in ('in', 'out') then raise exception '无效的库存操作'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    item_quantity := (item->>'quantity')::integer;
    if item_quantity is null or item_quantity <= 0 then raise exception '数量必须大于 0'; end if;
    select * into reagent_row from public.reagents where id = (item->>'reagent_id')::integer and tenant_id = p_tenant_id for update;
    if reagent_row.id is null then raise exception '试剂不存在或不属于当前检验科'; end if;
    if p_type = 'out' and reagent_row.stock_quantity < item_quantity then raise exception '出库数量超过库存：%', reagent_row.name; end if;
    update public.reagents set stock_quantity = stock_quantity + case when p_type = 'in' then item_quantity else -item_quantity end where id = reagent_row.id and tenant_id = p_tenant_id;
    insert into public.stock_records (tenant_id, reagent_id, type, quantity, lot_number, expiry_date, production_date, note, operator, department, reason)
    values (p_tenant_id, reagent_row.id, p_type, item_quantity, coalesce(item->>'lot_number',''), coalesce(item->>'expiry_date',''), coalesce(item->>'production_date',''), coalesce(item->>'note',''), coalesce(p_operator,''), coalesce(p_department,''), coalesce(p_reason,''));
    total := total + 1;
  end loop;
  return total;
end;
$$;

grant execute on function public.submit_stock_batch(uuid, text, text, text, text, jsonb) to authenticated;

-- 采购和到货仅限管理员，避免普通员工修改主数据和采购状态。
create or replace function public.create_restock_order(p_tenant_id uuid, p_note text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  new_order public.purchase_orders;
  reagent_row public.reagents;
  target_quantity integer;
begin
  if not public.is_tenant_admin(p_tenant_id) then raise exception '只有检验科管理员可以创建采购单'; end if;
  insert into public.purchase_orders (tenant_id, status, note, item_count)
  values (p_tenant_id, 'submitted', coalesce(p_note,''), 0) returning * into new_order;
  for reagent_row in select * from public.reagents where tenant_id = p_tenant_id and min_stock > 0 and stock_quantity <= min_stock loop
    target_quantity := greatest(reagent_row.min_stock * 2 - reagent_row.stock_quantity, 1);
    insert into public.purchase_order_items (tenant_id, order_id, reagent_id, quantity, unit, name, manufacturer, specification, supplier)
    values (p_tenant_id, new_order.id, reagent_row.id, target_quantity, reagent_row.unit, reagent_row.name, reagent_row.manufacturer, reagent_row.specification, reagent_row.supplier);
  end loop;
  update public.purchase_orders set item_count = (select count(*) from public.purchase_order_items where order_id = new_order.id and tenant_id = p_tenant_id) where id = new_order.id and tenant_id = p_tenant_id returning * into new_order;
  return jsonb_build_object('id', new_order.id);
end;
$$;

grant execute on function public.create_restock_order(uuid, text) to authenticated;

create or replace function public.receive_purchase_order(p_tenant_id uuid, p_id integer, p_operator text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  order_row public.purchase_orders;
  item_row public.purchase_order_items;
begin
  if not public.is_tenant_admin(p_tenant_id) then raise exception '只有检验科管理员可以确认到货'; end if;
  select * into order_row from public.purchase_orders where id = p_id and tenant_id = p_tenant_id for update;
  if order_row.id is null then raise exception '采购单不存在'; end if;
  if order_row.status <> 'submitted' then return; end if;
  for item_row in select * from public.purchase_order_items where order_id = p_id and tenant_id = p_tenant_id loop
    update public.reagents set stock_quantity = stock_quantity + item_row.quantity where id = item_row.reagent_id and tenant_id = p_tenant_id;
    insert into public.stock_records (tenant_id, reagent_id, type, quantity, lot_number, note, operator, department, reason)
    values (p_tenant_id, item_row.reagent_id, 'in', item_row.quantity, '', '采购单到货', coalesce(p_operator,''), '检验科', '采购入库');
  end loop;
  update public.purchase_orders set status = 'received' where id = p_id and tenant_id = p_tenant_id;
end;
$$;

grant execute on function public.receive_purchase_order(uuid, integer, text) to authenticated;

-- 减少跨租户误关联：采购明细和出入库记录的 tenant_id 必须与试剂一致由 RPC 保证。
comment on table public.tenants is '一个检验科对应一个租户';
comment on table public.tenant_members is '检验科员工成员；第一版仅 admin / employee 两种角色';
