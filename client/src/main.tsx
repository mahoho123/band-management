import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// ============================================
// 消除 iOS/Android 300ms 點擊延遲
// ============================================
if (typeof document !== 'undefined') {
  // 設置 viewport meta 確保 touch-action 生效
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    const content = viewportMeta.getAttribute('content') || '';
    if (!content.includes('touch-action')) {
      // viewport 已設置，touch-action: manipulation 在 CSS 中處理
    }
  }

  // 為所有 touchstart 事件添加 passive 監聽，提升滾動性能
  document.addEventListener('touchstart', () => {}, { passive: true });

  // 防止 iOS 雙擊縮放導致的延遲
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 服務器重啟時自動重試，最多 2 次，間隔 1 秒
      retry: (failureCount, error) => {
        if (error instanceof TRPCClientError) {
          // HTML 回應（服務器重啟期間）則重試
          if (error.message.includes('<!doctype') || error.message.includes('is not valid JSON')) {
            return failureCount < 3;
          }
          // 未授權錯誤不重試
          if (error.message === UNAUTHED_ERR_MSG) return false;
        }
        return failureCount < 1;
      },
      retryDelay: (failureCount) => Math.min(1000 * (failureCount + 1), 3000),
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // 過濾服務器重啟期間的瞬間性 HTML 回應錯誤（不需要顯示給用戶）
    if (error instanceof TRPCClientError &&
        (error.message.includes('<!doctype') || error.message.includes('is not valid JSON'))) {
      console.warn('[API] Server restarting, will retry...');
      return;
    }
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    // 過濾服務器重啟期間的瞬間性 HTML 回應錯誤（不需要顯示給用戶）
    if (error instanceof TRPCClientError &&
        (error.message.includes('<!doctype') || error.message.includes('is not valid JSON'))) {
      console.warn('[API] Server restarting, will retry...');
      return;
    }
    console.error("[API Mutation Error]", error);
  }
});

// Register Service Worker for Web Push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
    .then(registration => {
      console.log('[SW] Service Worker registered successfully:', registration);

      // Listen for a new SW waiting to activate and immediately activate it
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW installed - tell it to skip waiting so it activates immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // When the SW controller changes (new SW activated), reload to use new cache
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    })
    .catch(error => {
      console.error('[SW] Service Worker registration failed:', error);
    });
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
