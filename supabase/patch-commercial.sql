-- 商用改造补丁：邀请制 + 开通码
--
-- 目的：
--   1. 关闭“任何人注册后自助创建检验科”
--   2. 邀请码支持 admin 角色 → 成为新科室的“开通码”
--   3. 新增平台管理员：只有你指定的账号可以开通新检验科并获得开通码
--
-- 使用方法（不会删除任何数据，可安全重复执行）：
--   1. 打开 https://supabase.com/dashboard/project/eqgrtoeivuykemfferwb/sql/new
--   2. 粘贴本文件全部内容 → 点击 Run
--   3. 再执行文件末尾注释里那条 SQL，把你的账号登记为平台管理员

-- ── 1) 邀请码允许 admin 角色（开通码）────────────────────────────────

alter table public.tenant_invites drop constraint if exists tenant_invites_role_check;
alter table public.tenant_invites add constraint tenant_invites_role_check check (role in ('admin', 'employee'));

-- ── 2) 接受邀请时使用邀请码自带的角色（员工码→员工，开通码→管理员）─────

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
  values (invite_row.tenant_id, auth.uid(), invite_row.role);
  update public.tenant_invites set used_by = auth.uid(), used_at = now() where id = invite_row.id;
  select * into result from public.tenants where id = invite_row.tenant_id;
  return result;
end;
$$;

revoke all on function public.accept_tenant_invite(text) from public;
grant execute on function public.accept_tenant_invite(text) to authenticated;

-- ── 3) 平台管理员表 ─────────────────────────────────────────────────

create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

drop policy if exists platform_admins_self_select on public.platform_admins;
create policy platform_admins_self_select on public.platform_admins
  for select using (user_id = auth.uid());

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid());
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- ── 4) 平台管理员开通新检验科：返回“开通码” ─────────────────────────

create or replace function public.create_platform_tenant(p_name text, p_code text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  new_tenant public.tenants;
  invite_code text;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if not public.is_platform_admin() then raise exception '只有平台管理员可以开通检验科'; end if;
  if trim(coalesce(p_name, '')) = '' or trim(coalesce(p_code, '')) = '' then raise exception '检验科名称和编码不能为空'; end if;
  insert into public.tenants (name, code, created_by)
  values (trim(p_name), upper(trim(p_code)), auth.uid())
  returning * into new_tenant;
  invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.tenant_invites (tenant_id, code, role, created_by)
  values (new_tenant.id, invite_code, 'admin', auth.uid());
  return invite_code;
end;
$$;

revoke all on function public.create_platform_tenant(text, text) from public;
grant execute on function public.create_platform_tenant(text, text) to authenticated;

-- ── 5) 关闭自助创建检验科的后端入口（前端入口已在代码中移除）──────────

revoke execute on function public.create_tenant(text, text) from public, anon, authenticated;

select 'ok' as patch_status;

-- ── 6) 最后一步：把你自己登记为平台管理员 ────────────────────────────
-- 把下面的邮箱换成你自己的登录邮箱，单独选中执行：
--
-- insert into public.platform_admins (user_id)
-- select id from auth.users where email = '你的邮箱@example.com'
-- on conflict do nothing;
