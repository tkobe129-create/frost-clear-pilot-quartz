import { useEffect, useState } from "react";
import { ClipboardCopy, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tenant } from "@/lib/types";
import {
  acceptTenantInvite,
  checkPlatformAdmin,
  createPlatformTenant,
  listPlatformTenants,
  setPlatformTenantStatus,
  signInWithEmail,
  signOutGitHubUser,
  signUpWithEmail,
} from "@/lib/github-data";

export function TenantAuthScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 6) {
      toast.error("请输入邮箱和至少 6 位密码");
      return;
    }
    if (mode === "sign-up" && !name.trim()) {
      toast.error("请填写姓名，出入库记录会用它标记操作人");
      return;
    }
    setBusy(true);
    try {
      const session = mode === "sign-in" ? await signInWithEmail(email, password) : await signUpWithEmail(email, password, name);
      if (!session) {
        toast.success("注册成功，请先到邮箱完成验证后再登录");
      } else {
        toast.success(mode === "sign-in" ? "登录成功" : "注册成功");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Quandun Lab</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">权盾智检</h1>
        <p className="mt-2 text-sm text-muted">登录后进入所属检验科，员工共享同一套库存数据。</p>
        <div className="mt-6 flex rounded-lg bg-bg-elevated p-1">
          <button
            type="button"
            className={`h-10 flex-1 rounded-md text-sm ${mode === "sign-in" ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
            onClick={() => setMode("sign-in")}
          >
            登录
          </button>
          <button
            type="button"
            className={`h-10 flex-1 rounded-md text-sm ${mode === "sign-up" ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
            onClick={() => setMode("sign-up")}
          >
            注册管理员账号
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {mode === "sign-up" ? (
            <label className="text-sm font-medium">
              姓名
              <Input
                className="mt-1"
                autoComplete="name"
                placeholder="真实姓名，用于出入库记录"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          ) : null}
          <label className="text-sm font-medium">
            邮箱
            <Input className="mt-1" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            密码
            <Input
              className="mt-1"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
            />
          </label>
          <Button className="mt-1 h-11" disabled={busy} onClick={() => void submit()}>
            {busy ? "处理中…" : mode === "sign-in" ? "登录" : "注册并继续"}
          </Button>
        </div>
      </section>
    </main>
  );
}

export function TenantOnboardingScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [labName, setLabName] = useState("");
  const [labCode, setLabCode] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [issuedCode, setIssuedCode] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    checkPlatformAdmin()
      .then((ok) => {
        if (active) setIsPlatformAdmin(ok);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    let active = true;
    setLoadingTenants(true);
    listPlatformTenants()
      .then((items) => {
        if (active) setTenants(items);
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : "读取科室列表失败");
      })
      .finally(() => {
        if (active) setLoadingTenants(false);
      });
    return () => {
      active = false;
    };
  }, [isPlatformAdmin]);

  async function leaveOnboarding() {
    setSigningOut(true);
    try {
      await signOutGitHubUser();
      toast.success("已退出登录，可以切换其他账号");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "退出登录失败");
      setSigningOut(false);
    }
  }

  async function join() {
    setBusy(true);
    try {
      await acceptTenantInvite(inviteCode);
      toast.success("已加入检验科");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  async function toggleTenantStatus(tenant: Tenant) {
    const status = tenant.status === "active" ? "disabled" : "active";
    setStatusBusyId(tenant.id);
    try {
      await setPlatformTenantStatus(tenant.id, status);
      setTenants((current) => current.map((item) => (item.id === tenant.id ? { ...item, status } : item)));
      toast.success(status === "disabled" ? `已停用「${tenant.name}」` : `已恢复「${tenant.name}」`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更改科室状态失败");
    } finally {
      setStatusBusyId(null);
    }
  }

  async function issueTenant() {
    if (!labName.trim() || !labCode.trim()) return;
    setIssuing(true);
    try {
      const invite = await createPlatformTenant(labName, labCode);
      setIssuedCode(invite);
      void listPlatformTenants().then(setTenants).catch(() => undefined);
      setLabName("");
      setLabCode("");
      toast.success("已开通新检验科，把开通码发给客户的第一个管理员");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "开通失败");
    } finally {
      setIssuing(false);
    }
  }

  async function copyIssuedCode() {
    try {
      await navigator.clipboard.writeText(issuedCode);
      toast.success("开通码已复制");
    } catch {
      toast.info(`开通码：${issuedCode}`);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-8">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">检验科设置</p>
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            disabled={signingOut}
            onClick={() => void leaveOnboarding()}
          >
            <LogOut className="size-3.5" />
            {signingOut ? "退出中…" : "退出登录"}
          </Button>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">加入检验科</h1>
        <p className="mt-2 text-sm text-muted">
          输入邀请码或开通码加入检验科。没有码请联系你的检验科管理员或平台方获取。
        </p>

        <div className="mt-6 rounded-xl border border-border bg-bg-elevated p-4">
          <h2 className="text-sm font-semibold">使用邀请码 / 开通码加入</h2>
          <div className="mt-3 flex gap-2">
            <Input
              className="h-11 font-mono uppercase"
              placeholder="输入邀请码或开通码"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            />
            <Button className="h-11 shrink-0" disabled={busy || inviteCode.trim().length < 4} onClick={() => void join()}>
              加入
            </Button>
          </div>
        </div>

        {isPlatformAdmin ? (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary-soft p-4">
            <h2 className="text-sm font-semibold">平台开通新检验科</h2>
            <p className="mt-1 text-xs text-muted">仅限平台管理员使用。开通后把开通码发给客户的第一个管理员。</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">
                检验科名称
                <Input className="mt-1" placeholder="例如：B 医院检验科" value={labName} onChange={(event) => setLabName(event.target.value)} />
              </label>
              <label className="text-sm font-medium">
                检验科编码
                <Input className="mt-1" placeholder="例如：B-LAB" value={labCode} onChange={(event) => setLabCode(event.target.value)} />
              </label>
              <Button className="h-11 self-end" disabled={issuing || !labName.trim() || !labCode.trim()} onClick={() => void issueTenant()}>
                {issuing ? "开通中…" : "开通并生成开通码"}
              </Button>
            </div>
            {issuedCode ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                <span className="flex-1 font-mono text-lg tracking-widest text-primary">{issuedCode}</span>
                <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={() => void copyIssuedCode()}>
                  <ClipboardCopy className="size-3.5" />
                  复制
                </Button>
              </div>
            ) : null}
            <div className="mt-5 border-t border-primary/20 pt-4">
              <h3 className="text-sm font-semibold">已开通检验科</h3>
              <p className="mt-1 text-xs leading-5 text-muted">停用后该科室成员将无法读取或修改科室数据；重新启用后可恢复访问。</p>
              {loadingTenants ? (
                <p className="py-5 text-center text-sm text-muted">正在读取科室列表…</p>
              ) : tenants.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {tenants.map((tenant) => (
                    <li key={tenant.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{tenant.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">{tenant.code}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                          tenant.status === "active" ? "bg-primary-soft text-primary" : "bg-bg-elevated text-muted"
                        }`}
                      >
                        {tenant.status === "active" ? "运行中" : "已停用"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0"
                        disabled={statusBusyId === tenant.id}
                        onClick={() => void toggleTenantStatus(tenant)}
                      >
                        {statusBusyId === tenant.id ? "处理中…" : tenant.status === "active" ? "停用" : "重新启用"}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-5 text-center text-sm text-muted">暂无已开通检验科</p>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function TenantDisabledScreen({ tenantName }: { tenantName: string }) {
  const [signingOut, setSigningOut] = useState(false);

  async function leave() {
    setSigningOut(true);
    try {
      await signOutGitHubUser();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "退出登录失败");
      setSigningOut(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-card sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">检验科访问受限</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">该检验科目前已停用</h1>
        <p className="mt-2 text-sm text-muted">
          「{tenantName}」已暂停使用。该科室数据暂不可读取或修改；如需恢复，请联系平台管理员。
        </p>
        <Button variant="outline" className="mt-6" disabled={signingOut} onClick={() => void leave()}>
          <LogOut className="size-4" />
          {signingOut ? "退出中…" : "退出登录"}
        </Button>
      </section>
    </main>
  );
}
