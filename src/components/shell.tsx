import type { ReactNode } from "react";
import { FlaskConical, LayoutDashboard, ScanLine, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "home" | "scan" | "reagents" | "records";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "home", label: "工作台", icon: LayoutDashboard },
  { id: "scan", label: "扫码", icon: ScanLine },
  { id: "reagents", label: "试剂", icon: FlaskConical },
  { id: "records", label: "记录", icon: ScrollText },
];

const TITLES: Record<TabId, string> = {
  home: "工作台",
  scan: "扫码出入库",
  reagents: "试剂档案",
  records: "出入库记录",
};

type Props = {
  tab: TabId;
  onTab: (id: TabId) => void;
  alertCount: number;
  children: ReactNode;
};

export function AppShell({ tab, onTab, alertCount, children }: Props) {
  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-bg pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border bg-surface md:flex lg:w-60">
        <div className="flex items-center gap-3 px-4 py-5">
          <BrandMark />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">QuanDun Lab</p>
            <p className="truncate text-sm font-semibold text-fg">权盾智检</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
          {TABS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={tab === item.id}
              alertCount={alertCount}
              layout="side"
              onClick={() => onTab(item.id)}
            />
          ))}
        </nav>
        <p className="px-4 pb-5 text-xs text-subtle">检验科 · 试剂管家</p>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border/80 bg-bg/92 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md md:px-8 md:py-4">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <BrandMark />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted md:hidden">QuanDun Lab</p>
              <h1 className="truncate text-base font-semibold tracking-tight text-fg md:text-lg">
                <span className="md:hidden">权盾智检 · 试剂管家</span>
                <span className="hidden md:inline">{TITLES[tab]}</span>
              </h1>
            </div>
            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted">检验科</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-6 md:pb-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
          aria-label="主导航"
        >
          <ul className="grid grid-cols-4">
            {TABS.map((item) => (
              <li key={item.id}>
                <NavButton
                  item={item}
                  active={tab === item.id}
                  alertCount={alertCount}
                  layout="bottom"
                  onClick={() => onTab(item.id)}
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg">
      <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
        <path
          fill="currentColor"
          d="M16 4.8l8.2 3.3v8.4c0 4.9-3.4 8.6-8.2 10.3C10.2 25.1 6.8 21.4 6.8 16.5V8.1L16 4.8z"
        />
      </svg>
    </div>
  );
}

function NavButton({
  item,
  active,
  alertCount,
  layout,
  onClick,
}: {
  item: (typeof TABS)[number];
  active: boolean;
  alertCount: number;
  layout: "bottom" | "side";
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative transition-colors",
        layout === "bottom" && "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs",
        layout === "side" && "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium",
        active ? "text-primary" : "text-subtle",
        layout === "side" && active && "bg-primary-soft",
        layout === "side" && !active && "hover:bg-bg-elevated hover:text-fg",
      )}
    >
      <Icon className="size-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
      {item.id === "home" && alertCount > 0 ? (
        <span
          className={cn(
            "min-w-4 rounded-full bg-danger px-1 text-center text-xs leading-4 text-primary-fg tabular",
            layout === "bottom" && "absolute right-[18%] top-1.5",
            layout === "side" && "ml-auto",
          )}
        >
          {alertCount > 9 ? "9+" : alertCount}
        </span>
      ) : null}
    </button>
  );
}
