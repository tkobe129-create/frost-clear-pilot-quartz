import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  acceptTenantInvite,
  createTenant,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/github-data";

export function TenantAuthScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 6) {
      toast.error("请输入邮箱和至少 6 位密码");
      return;
    }
    setBusy(true);
    try {
      const session = mode === "sign-in" ? await signInWithEmail(email, password) : await signUpWithEmail(email, password);
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
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-8">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">检验科设置</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">加入或创建检验科</h1>
        <p className="mt-2 text-sm text-muted">管理员创建检验科，普通员工使用管理员生成的邀请码加入。</p>

        <div className="mt-6 rounded-xl border border-border bg-bg-elevated p-4">
          <h2 className="text-sm font-semibold">创建新的检验科</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium sm:col-span-2">
              检验科名称
              <Input className="mt-1" placeholder="例如：A 检验科" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="text-sm font-medium">
              检验科编码
              <Input className="mt-1" placeholder="例如：A-LAB" value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
            <Button
              className="self-end h-11"
              disabled={busy || !name.trim() || !code.trim()}
              onClick={() => void run(() => createTenant(name, code), "检验科已创建")}
            >
              创建并成为管理员
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-4">
          <h2 className="text-sm font-semibold">使用邀请码加入</h2>
          <div className="mt-3 flex gap-2">
            <Input
              className="h-11 font-mono uppercase"
              placeholder="输入管理员提供的邀请码"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            />
            <Button
              className="h-11 shrink-0"
              disabled={busy || inviteCode.trim().length < 4}
              onClick={() => void run(() => acceptTenantInvite(inviteCode), "已加入检验科")}
            >
              加入
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
