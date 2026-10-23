import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DATABASE_SQL_EDITOR_URL } from "@/lib/db-contract";
import deleteReagentSql from "../../supabase/patch-delete-reagent.sql?raw";
import autoReleaseSql from "../../supabase/patch-auto-release-restock.sql?raw";

const PATCH_SQL = `${autoReleaseSql.trim()}\n\n${deleteReagentSql.trim()}\n`;

export function DatabaseContractNotice({ missing }: { missing: string[] }) {
  const [open, setOpen] = useState(false);
  if (missing.length === 0) return null;

  async function copySql() {
    try {
      await navigator.clipboard.writeText(PATCH_SQL);
      toast.success("补丁已复制。粘贴到 SQL 编辑器后点 Run，再刷新本页");
    } catch {
      setOpen(true);
      toast.error("复制失败，请长按下面的文本手动复制");
    }
  }

  return (
    <section className="mb-3 rounded-xl border border-warn/40 bg-warn-soft px-3 py-3 text-fg">
      <p className="text-sm font-semibold">数据库补丁还没执行</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        页面已经更新，但数据库还是旧的。现在会失败：{missing.join("、")}。这两段 SQL 可以重复执行，不会改其他试剂。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void copySql()}>
          复制补丁
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen((value) => !value)}>
          {open ? "收起 SQL" : "查看 SQL"}
        </Button>
        <a
          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-xs font-medium text-fg hover:bg-bg-elevated"
          href={DATABASE_SQL_EDITOR_URL}
          target="_blank"
          rel="noreferrer"
        >
          打开 SQL 编辑器
        </a>
      </div>
      {open ? (
        <textarea
          readOnly
          className="mt-3 h-40 w-full resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs text-fg"
          value={PATCH_SQL}
          onFocus={(event) => event.currentTarget.select()}
        />
      ) : null}
    </section>
  );
}
