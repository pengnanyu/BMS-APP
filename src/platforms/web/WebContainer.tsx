import { ConnectionBar } from '@/platforms/web/components/ConnectionBar';
import { UIContent } from '@/platforms/web/components/UIContent';
import { useTheme } from '@/components/theme-provider';

/** Web 容器主页面 */
export function WebContainer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const darkBg = `
    radial-gradient(ellipse 80% 50% at 20% 40%, oklch(0.25 0.06 270 / 0.6), transparent),
    radial-gradient(ellipse 60% 60% at 80% 30%, oklch(0.22 0.05 50 / 0.4), transparent),
    radial-gradient(ellipse 70% 40% at 50% 90%, oklch(0.20 0.04 200 / 0.5), transparent),
    oklch(0.13 0.02 265)
  `;

  const lightBg = `
    radial-gradient(ellipse 80% 50% at 20% 40%, oklch(0.90 0.04 270 / 0.5), transparent),
    radial-gradient(ellipse 60% 60% at 80% 30%, oklch(0.92 0.03 50 / 0.4), transparent),
    radial-gradient(ellipse 70% 40% at 50% 90%, oklch(0.88 0.03 200 / 0.4), transparent),
    oklch(0.95 0.01 265)
  `;

  return (
    <div
      className="relative h-screen overflow-hidden"
      style={{ background: isDark ? darkBg : lightBg }}
    >
      <ConnectionBar />
      <UIContent />
    </div>
  );
}
