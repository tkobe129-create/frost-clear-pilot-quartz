import { createFileRoute } from "@tanstack/react-router";
import { GitHubPagesRoot } from "@/github-main";

export const Route = createFileRoute("/")({
  component: GitHubPagesRoot,
  errorComponent: PreviewError,
});

function PreviewError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="min-h-dvh bg-bg p-6 text-fg">
      <h1 className="text-lg font-semibold">权盾智检</h1>
      <p className="mt-2 text-sm text-muted">页面加载遇到问题，请刷新预览。</p>
      <p className="mt-3 break-all text-xs text-subtle">{message}</p>
    </div>
  );
}
