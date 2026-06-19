import { ConnectionBar } from '@/platforms/web/components/ConnectionBar';
import { UIContent } from '@/platforms/web/components/UIContent';

/** Web 容器主页面 */
export function WebContainer() {
  return (
    <div
      className="relative h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% 40%, oklch(0.25 0.06 270 / 0.6), transparent),
          radial-gradient(ellipse 60% 60% at 80% 30%, oklch(0.22 0.05 50 / 0.4), transparent),
          radial-gradient(ellipse 70% 40% at 50% 90%, oklch(0.20 0.04 200 / 0.5), transparent),
          oklch(0.13 0.02 265)
        `,
      }}
    >
      <ConnectionBar />
      <UIContent />
    </div>
  );
}
