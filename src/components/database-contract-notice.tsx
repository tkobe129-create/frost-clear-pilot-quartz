export function DatabaseContractNotice({ missing }: { missing: string[] }) {
  if (missing.length === 0) return null;

  return (
    <section className="mb-3 rounded-xl border border-warn/40 bg-warn-soft px-3 py-3 text-fg">
      <p className="text-sm font-semibold">数据库还没跟上页面</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        现在会失败：{missing.join("、")}。不用手工执行 SQL。发布时会自动写入数据库，但数据库连接还没配上，所以这两项暂时不能用。
      </p>
    </section>
  );
}
