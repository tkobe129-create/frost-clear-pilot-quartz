-- Enforce tenant status in database authorization and add platform-level
-- tenant suspension controls. Existing data is preserved.
begin;

create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members m
    join public.tenants t on t.id = m.tenant_id
    where m.tenant_id = p_tenant_id and m.user_id = auth.uid() and t.status = 'active'
  );
$$;

create or replace function public.is_tenant_admin(p_tenant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members m
    join public.tenants t on t.id = m.tenant_id
    where m.tenant_id = p_tenant_id and m.user_id = auth.uid() and m.role = 'admin' and t.status = 'active'
  );
$$;

drop policy if exists tenants_member_select on public.tenants;
create policy tenants_member_select on public.tenants
  for select using (exists (
    select 1 from public.tenant_members m where m.tenant_id = id and m.user_id = auth.uid()
  ));

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
  if not exists (select 1 from public.tenants where id = invite_row.tenant_id and status = 'active') then
    raise exception '该检验科已停用，暂时无法加入';
  end if;
  begin
    insert into public.tenant_members (tenant_id, user_id, role)
    values (invite_row.tenant_id, auth.uid(), invite_row.role);
  exception when unique_violation then
    raise exception '该账号已经加入其他检验科或该邀请码已被使用';
  end;
  update public.tenant_invites set used_by = auth.uid(), used_at = now() where id = invite_row.id;
  select * into result from public.tenants where id = invite_row.tenant_id;
  return result;
end;
$$;

-- 平台管理员查询与停用/恢复检验科；停用后 is_tenant_member/admin 均返回 false.
create or replace function public.list_platform_tenants()
returns table (id uuid, name text, code text, status text, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then raise exception '只有平台管理员可以查看检验科列表'; end if;
  return query
    select t.id, t.name, t.code, t.status, t.created_at
    from public.tenants t
    order by t.created_at desc, t.id;
end;
$$;

create or replace function public.set_platform_tenant_status(p_tenant_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then raise exception '只有平台管理员可以更改检验科状态'; end if;
  if p_status is null or p_status not in ('active', 'disabled') then raise exception '无效的检验科状态'; end if;
  update public.tenants set status = p_status where id = p_tenant_id;
  if not found then raise exception '检验科不存在'; end if;
end;
$$;

revoke all on function public.list_platform_tenants() from public, anon;
grant execute on function public.list_platform_tenants() to authenticated;
revoke all on function public.set_platform_tenant_status(uuid, text) from public, anon;
grant execute on function public.set_platform_tenant_status(uuid, text) to authenticated;

commit;
