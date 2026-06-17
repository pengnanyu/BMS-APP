import { EmptyState } from '@/components/bms/shared/EmptyState';

export function CommandPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center p-3">
      <EmptyState text="功能开发中，后续支持自定义指令下发、预设指令集、批量操作等功能" />
    </div>
  );
}
