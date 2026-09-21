import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "权盾智检";

function RootError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <html lang="zh-CN">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f7f5f0", color: "#1c1d1a", padding: 24 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>权盾智检</h1>
        <p style={{ marginTop: 12 }}>预览页出错，请刷新。</p>
        <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", fontSize: 12, color: "#6b6a64" }}>{message}</pre>
      </body>
    </html>
  );
}

export const Route = createRootRoute({
  errorComponent: RootError,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: APP_NAME },
      { name: "theme-color", content: "#0E5C56" },
      {
        name: "description",
        content: "检验科试剂预录、手机扫码出入库、效期库存预警与一键补货。",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <html lang="zh-CN" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Outlet />
            <Toaster
              position="top-center"
              richColors={false}
              toastOptions={{
                className: "font-sans",
                style: {
                  background: "#fffcf7",
                  color: "#1c1d1a",
                  border: "1px solid #d8d3c8",
                },
              }}
            />
          </QueryClientProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
