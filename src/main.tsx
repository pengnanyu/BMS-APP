import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { WebContainer } from "@/platforms/web/WebContainer";
import i18n, { STORAGE_KEY as LOCALE_KEY } from "@/i18n";
import "./index.css";

// 在 React 渲染前先应用主题，避免闪烁
(function applyInitialTheme() {
  const stored = localStorage.getItem('aibms-theme') as 'dark' | 'light' | 'system' | null;
  const theme = stored || 'system';
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(isDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
})();

// 初始化页面语言和标题
(function applyInitialLocale() {
  const lng = localStorage.getItem(LOCALE_KEY) || 'zh';
  document.documentElement.lang = lng === 'zh' ? 'zh-CN' : 'en';
  document.title = i18n.t('app.title');
})();

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng === 'zh' ? 'zh-CN' : 'en';
  document.title = i18n.t('app.title');
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="aibms-theme">
      <WebContainer />
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          className: "text-xs",
        }}
      />
    </ThemeProvider>
  </QueryClientProvider>
);
