import { ConnectionBar } from '@/platforms/web/components/ConnectionBar';
import { UIContent } from '@/platforms/web/components/UIContent';

/** Web 容器主页面 */
export function WebContainer() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* 顶部连接控制栏 */}
      <ConnectionBar />

      {/* UI 内容区（占位，后续替换为 iframe 加载 ui.aibms.net） */}
      <UIContent />
    </div>
  );
}
