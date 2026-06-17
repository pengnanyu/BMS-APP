import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { WebContainer } from "@/platforms/web/WebContainer";
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
