import { useState, useCallback, useEffect } from 'react';
import { webBridge } from '@/platforms/web/lib/web-bridge';
import { useTheme, type Theme } from '@/components/theme-provider';
import type { ConnectionType, ConnectionStatus, BluetoothConfig, SerialConfig } from '@/shared/types/bridge';
import { BAUD_RATE_OPTIONS, PARITY_OPTIONS, CONNECTION_TYPE_OPTIONS } from '@/shared/types/bridge';
import { cn } from '@/lib/utils';
import { Bluetooth, Cable, Loader2, Sun, Moon, Monitor } from 'lucide-react';

/** 连接状态指示器 */
function StatusIndicator({ status }: { status: ConnectionStatus }) {
  const colorMap: Record<ConnectionStatus, string> = {
    disconnected: 'bg-muted-foreground/40',
    connecting: 'bg-warning animate-pulse',
    connected: 'bg-success',
    error: 'bg-destructive',
  };

  const textMap: Record<ConnectionStatus, string> = {
    disconnected: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    error: '连接错误',
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium shrink-0">
      <span className={cn('w-2 h-2 rounded-full transition-colors', colorMap[status])} />
      <span className="text-muted-foreground">{textMap[status]}</span>
    </span>
  );
}

/** 主题切换按钮 */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const resolve = () => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme as 'dark' | 'light');
      }
    };
    resolve();

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', resolve);
    return () => mq.removeEventListener('change', resolve);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    let next: Theme;
    if (theme === 'system') next = 'light';
    else if (theme === 'light') next = 'dark';
    else next = 'system';
    console.log('[AIBMS Theme] toggle:', theme, '→', next);
    setTheme(next);
  }, [theme, setTheme]);

  const Icon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const title = theme === 'system' ? '跟随系统' : resolvedTheme === 'dark' ? '深色模式' : '浅色模式';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded border border-border",
        "hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
      )}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/** 连接控制栏 - 容器顶部 UI */
export function ConnectionBar() {
  const [connType, setConnType] = useState<ConnectionType>('bluetooth');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [btConfig, setBtConfig] = useState<BluetoothConfig>({
    nameFilter: 'DCSF+',
    serviceUUID: '0xFF00',
    notifyUUID: '0xFF01',
    writeUUID: '0xFF02',
  });
  const [serialConfig, setSerialConfig] = useState<SerialConfig>({
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  });

  // 监听连接状态变化
  useEffect(() => {
    const unsubscribe = webBridge.onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleConnect = useCallback(async () => {
    webBridge.updateConfig({
      type: connType,
      bluetooth: btConfig,
      serial: serialConfig,
    });

    if (status === 'connected') {
      await webBridge.disconnect();
      setStatus('disconnected');
    } else {
      const success = await webBridge.connect();
      if (!success) {
        setStatus('disconnected');
      }
    }
  }, [connType, status, btConfig, serialConfig]);

  const handleConnTypeChange = useCallback((type: ConnectionType) => {
    if (status === 'connected' || status === 'connecting') {
      return;
    }
    setConnType(type);
    webBridge.updateConfig({ type });
  }, [status]);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <header className="relative z-50 bg-card border-b border-border shadow-sm">
      {/* 主栏 - 所有元素在同一行 */}
      <div className="h-12 px-4 flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <img
            src="/aibms-logo.png"
            alt="AIBMS"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-border shrink-0" />

        {/* 连接方式下拉 */}
        <div className="relative shrink-0">
          <select
            value={connType}
            onChange={(e) => handleConnTypeChange(e.target.value as ConnectionType)}
            disabled={isConnected || isConnecting}
            className={cn(
              "h-8 pl-8 pr-7 text-xs font-medium rounded border border-border bg-background",
              "focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer",
              "appearance-none transition-all",
              "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_4px_center]",
              (isConnected || isConnecting) && "opacity-50 cursor-not-allowed"
            )}
          >
            {CONNECTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {connType === 'bluetooth' ? (
            <Bluetooth className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-primary" />
          ) : (
            <Cable className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-primary" />
          )}
        </div>

        {/* 连接设置 - 紧跟下拉框后面，同一行显示 */}
        {connType === 'bluetooth' ? (
          <div className="flex items-center gap-2 animate-fade-in shrink-0">
            <label className="text-xs text-muted-foreground whitespace-nowrap">过滤:</label>
            <input
              type="text"
              value={btConfig.nameFilter}
              onChange={(e) => setBtConfig((prev) => ({ ...prev, nameFilter: e.target.value }))}
              className="h-8 w-24 px-2 text-xs rounded border border-border bg-background 
                         focus:outline-none focus:ring-1 focus:ring-ring font-mono transition-all"
              placeholder="DCSF+"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 animate-fade-in shrink-0">
            <label className="text-xs text-muted-foreground whitespace-nowrap">波特率:</label>
            <select
              value={serialConfig.baudRate}
              onChange={(e) => setSerialConfig((prev) => ({ ...prev, baudRate: Number(e.target.value) }))}
              className="h-8 px-2 text-xs rounded border border-border bg-background 
                         focus:outline-none focus:ring-1 focus:ring-ring font-mono
                         appearance-none pr-6 cursor-pointer transition-all
                         bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_4px_center]"
            >
              {BAUD_RATE_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </select>
            <label className="text-xs text-muted-foreground whitespace-nowrap">校验:</label>
            <select
              value={serialConfig.parity}
              onChange={(e) => setSerialConfig((prev) => ({ ...prev, parity: e.target.value as SerialConfig['parity'] }))}
              className="h-8 px-2 text-xs rounded border border-border bg-background 
                         focus:outline-none focus:ring-1 focus:ring-ring
                         appearance-none pr-6 cursor-pointer transition-all
                         bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_4px_center]"
            >
              {PARITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* 连接/断开按钮 */}
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={cn(
            "h-8 px-4 text-xs font-semibold rounded flex items-center gap-1.5 shrink-0",
            "transition-all duration-200 whitespace-nowrap",
            isConnected
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
            isConnecting && "opacity-70 cursor-not-allowed"
          )}
        >
          {isConnecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isConnected ? (
            <span>断开</span>
          ) : (
            <span>连接</span>
          )}
        </button>

        {/* 右侧空白填充 + 主题切换 */}
        <div className="flex-1" />
        <ThemeToggle />
      </div>
    </header>
  );
}
