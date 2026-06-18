import { ConnectionBar } from '@/platforms/web/components/ConnectionBar';
import { UIContent } from '@/platforms/web/components/UIContent';

/** Web 容器主页面 */
export function WebContainer() {
  return (
    <div className="relative h-screen overflow-hidden bg-background">
      <ConnectionBar />
      <UIContent />
    </div>
  );
}
