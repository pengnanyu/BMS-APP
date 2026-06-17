// ==================== 连接状态栏 ====================

import { useBMS } from '@/lib/bms-store';
import { BluetoothManager } from '@/lib/bluetooth-manager';
import { SerialManager } from '@/lib/serial-manager';
import { cn } from '@/lib/utils';
import { Bluetooth, Cable, Wifi, Signal, Loader2, AlertCircle } from 'lucide-react';
import type { ConnectionState } from '@/types/bms';

// 内联 SVG 图标
function SerialIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 12h4" />
      <path d="M14 12h4" />
      <path d="M10 8v8" />
    </svg>
  );
}

function MQTTIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function SignalOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
      <path d="M12 12a3 3 0 0 1 0-4.24" />
      <path d="M8.46 8.46a9 9 0 0 1 0 7.07" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

const stateConfig: Record<ConnectionState, { icon: React.ReactNode; color: string; label: string }> = {
  disconnected: { icon: <SignalOffIcon className="w-3.5 h-3.5" />, color: 'text-muted-foreground', label: '未连接' },
  connecting: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, color: 'text-bms-info', label: '连接中...' },
  connected: { icon: <Signal className="w-3.5 h-3.5" />, color: 'text-bms-ok', label: '已连接' },
  error: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-bms-danger', label: '连接失败' },
};

interface ConnectionBadgeProps {
  label: string;
  icon: React.ReactNode;
  state: ConnectionState;
  onConnect?: () => void;
  disabled?: boolean;
}

function ConnectionBadge({ label, icon, state, onConnect, disabled }: ConnectionBadgeProps) {
  const config = stateConfig[state];
  const isConnected = state === 'connected';

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all',
      isConnected ? 'border-bms-ok/30 bg-bms-ok/5' : 'border-border bg-card/50'
    )}>
      <span className={isConnected ? 'text-bms-ok' : 'text-muted-foreground'}>{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className={config.color}>{config.icon}</span>
      {onConnect && !isConnected && !disabled && (
        <button
          onClick={onConnect}
          className="ml-1 px-2 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded text-[10px] transition-colors"
        >
          连接
        </button>
      )}
    </div>
  );
}

export function ConnectionBar() {
  const { bluetoothState, serialState, mqttState, connectBluetooth, connectSerial, disconnectAll, activeConnection } = useBMS();

  const btSupported = BluetoothManager.isSupported();
  const serialSupported = SerialManager.isSupported();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ConnectionBadge
        label="蓝牙"
        icon={<Bluetooth className="w-3.5 h-3.5" />}
        state={bluetoothState}
        onConnect={connectBluetooth}
        disabled={!btSupported}
      />
      <ConnectionBadge
        label="串口"
        icon={<SerialIcon className="w-3.5 h-3.5" />}
        state={serialState}
        onConnect={connectSerial}
        disabled={!serialSupported}
      />
      <ConnectionBadge
        label="MQTT"
        icon={<MQTTIcon className="w-3.5 h-3.5" />}
        state={mqttState}
      />

      {activeConnection && (
        <button
          onClick={disconnectAll}
          className="ml-auto px-3 py-1.5 text-xs bg-bms-danger/10 hover:bg-bms-danger/20 text-bms-danger border border-bms-danger/30 rounded-lg transition-colors"
        >
          断开连接
        </button>
      )}
    </div>
  );
}
