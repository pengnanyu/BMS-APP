import { ConnectionBar } from '@/platforms/web/components/ConnectionBar';
import { UIContent } from '@/platforms/web/components/UIContent';

/** Web 容器主页面 */
export function WebContainer() {
  return (
    <div className="h-screen bg-background">
      {/* 顶部连接控制栏 - 固定定位 */}
      <ConnectionBar />

      {/* UI 内容区 - 独立滚动 */}
      <UIContent />
    </div>
  );
}
