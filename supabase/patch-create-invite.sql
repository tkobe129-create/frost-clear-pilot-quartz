-- 修复脚本：修复“生成邀请码失败”的问题。
-- 原因：create_tenant_invite 之前使用了扩展函数 gen_random_bytes，
-- 在部分 Supabase 项目中无法访问。改为 PostgreSQL 内置的 gen_random_uuid。
--
-- 使用方法（不会删除任何数据，可安全重复执行）：
--   1. 打开 https://supabase.com/dashboard/project/eqgrtoeivuykemfferwb/sql/new
--   2. 粘贴本文件全部内容 → 点击 Run
--   3. 回到应用，按 Ctrl+F5 强制刷新，再点一次“邀请员工”

create or replace function public.create_tenant_invite(p_tenant_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  invite_code text;
begin
  if not public.is_tenant_admin(p_tenant_id) then raise exception '只有检验科管理员可以生成邀请码'; end if;
  invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.tenant_invites (tenant_id, code, created_by)
  values (p_tenant_id, invite_code, auth.uid());
  return invite_code;
end;
$$;

grant execute on function public.create_tenant_invite(uuid) to authenticated;

-- 自检：应返回 'ok'
select 'ok' as patch_status;
