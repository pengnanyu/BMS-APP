// ==================== 指令下发 Tab ====================
// 预留功能，后续扩展

export function CommandPanel() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 p-6">
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
        <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">指令下发</p>
        <p className="text-xs opacity-60 max-w-xs">
          功能开发中，后续支持自定义指令下发、预设指令集、批量操作等功能
        </p>
      </div>
    </div>
  );
}
