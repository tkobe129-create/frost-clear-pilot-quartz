-- 修复：数据库强制一个登录账号只能属于一个检验科。
-- 不删除或迁移任何成员数据。若发现已有账号加入多个科室，脚本会停止，
-- 需要先人工确认并清理重复成员关系后再重跑。

-- 防止将现存重复关系静默保留；不自动删除任何账号或成员关系。
do $$
begin
  if exists (
    select 1
    from public.tenant_members
    group by user_id
    having count(*) > 1
  ) then
    raise exception '检测到账号已加入多个检验科。请先检查 tenant_members 中重复的 user_id，人工确认保留哪个成员关系后再运行此补丁。';
  end if;
end $$;

-- 原来只有 (tenant_id, user_id) 联合主键，不能阻止同一账号加入不同科室。
-- 唯一索引是最终的并发安全约束；普通的 RPC 前置查询无法替代它。
create unique index if not exists tenant_members_one_tenant_per_user_idx
  on public.tenant_members (user_id);

-- 并发领取不同邀请码时，唯一索引会阻止第二个科室成员关系落库。
-- 将底层唯一冲突转换成用户可理解的错误；事务也会回滚，不会消耗邀请码。
create or replace function public.accept_tenant_invite(p_code text)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.tenant_invites;
  result public.tenants;
begin
  if auth.uid() is null then
    raise exception '请先登录';
  end if;

  if exists (
    select 1 from public.tenant_members where user_id = auth.uid()
  ) then
    raise exception '该账号已经加入检验科';
  end if;

  select * into invite_row
  from public.tenant_invites
  where code = upper(trim(p_code))
    and used_by is null
    and expires_at > now()
  for update;

  if invite_row.id is null then
    raise exception '邀请码无效或已过期';
  end if;

  begin
    insert into public.tenant_members (tenant_id, user_id, role)
    values (invite_row.tenant_id, auth.uid(), invite_row.role);
  exception when unique_violation then
    raise exception '该账号已经加入其他检验科或该邀请码已被使用';
  end;

  update public.tenant_invites
  set used_by = auth.uid(), used_at = now()
  where id = invite_row.id;

  select * into result
  from public.tenants
  where id = invite_row.tenant_id;

  return result;
end;
$$;

revoke all on function public.accept_tenant_invite(text) from public;
grant execute on function public.accept_tenant_invite(text) to authenticated;

select 'one_lab_per_account_patch_applied' as status;
