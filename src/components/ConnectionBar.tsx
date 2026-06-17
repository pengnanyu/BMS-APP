// ==================== Web 容器顶部导航栏 ====================

import { useState, useCallback } from 'react';
import { webBridge } from '@/lib/bridge';
import type { ConnectionState, ConnectionType } from '@/lib/bridge';
import { cn } from '@/lib/utils';

// 波特率选项
const BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200] as const;

// 校验位选项
const PARITY_OPTIONS = [
  { value: 'none' as const, label: '无' },
  { value: 'odd' as const, label: '奇校验' },
  { value: 'even' as const, label: '偶校验' },
] as const;

interface ConnectionBarProps {
  onData?: (data: Uint8Array) => void;
  onStateChange?: (type: ConnectionType, state: ConnectionState) => void;
}

export function ConnectionBar({ onData, onStateChange }: ConnectionBarProps) {
  // 连接方式选择
  const [connectionType, setConnectionType] = useState<ConnectionType>('bluetooth');

  // 蓝牙设置
  const [btFilterName, setBtFilterName] = useState('DCSF+');

  // 串口设置
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [parity, setParity] = useState<'none' | 'odd' | 'even'>('none');

  // 连接状态
  const [connState, setConnState] = useState<ConnectionState>('disconnected');
  const [statusMessage, setStatusMessage] = useState('');

  // 能力检测
  const btSupported = webBridge.isBluetoothSupported();
  const serialSupported = webBridge.isSerialSupported();

  // 处理状态变化
  const handleStateChange = useCallback((type: ConnectionType, data: { state: ConnectionState; error?: string }) => {
    setConnState(data.state);
    if (data.error) {
      setStatusMessage(data.error);
    } else {
      const stateLabels: Record<ConnectionState, string> = {
        disconnected: '已断开',
        connecting: '连接中...',
        connected: '已连接',
        error: '连接失败',
      };
      setStatusMessage(stateLabels[data.state]);
    }
    onStateChange?.(type, data.state);
  }, [onStateChange]);

  // 处理数据接收
  const handleData = useCallback((data: { data: Uint8Array }) => {
    onData?.(data.data);
  }, [onData]);

  // 连接/断开
  const handleConnect = useCallback(async () => {
    if (connState === 'connected') {
      // 断开连接 — 状态由 Bridge 的 setState 回调驱动，无需手动设置
      if (connectionType === 'bluetooth') {
        await webBridge.bluetoothDisconnect();
      } else {
        await webBridge.serialDisconnect();
      }
      return;
    }

    // 注册回调
    if (connectionType === 'bluetooth') {
      webBridge.onBluetoothState((data) => handleStateChange('bluetooth', data));
      webBridge.onBluetoothData(handleData);
    } else {
      webBridge.onSerialState((data) => handleStateChange('serial', data));
      webBridge.onSerialData(handleData);
    }

    // 立即触发设备选择（必须在用户手势上下文中同步调用）
    let ok = false;
    if (connectionType === 'bluetooth') {
      ok = await webBridge.bluetoothConnect({ filterName: btFilterName });
    } else {
      ok = await webBridge.serialConnect({ baudRate, parity });
    }

    if (!ok) {
      setConnState('error');
      setStatusMessage('连接失败，请重试');
    }
  }, [connectionType, connState, btFilterName, baudRate, parity, handleStateChange, handleData]);

  // 连接方式切换时断开当前连接
  const handleTypeChange = useCallback(async (type: ConnectionType) => {
    if (connState === 'connected') {
      if (connectionType === 'bluetooth') {
        await webBridge.bluetoothDisconnect();
      } else {
        await webBridge.serialDisconnect();
      }
    }
    setConnState('disconnected');
    setStatusMessage('');
    setConnectionType(type);
  }, [connectionType, connState]);

  // 状态颜色
  const stateColor: Record<ConnectionState, string> = {
    disconnected: 'bg-muted-foreground',
    connecting: 'bg-bms-info animate-pulse',
    connected: 'bg-bms-ok',
    error: 'bg-bms-danger',
  };

  return (
    <header className="bg-card border-b border-border shadow-lg shadow-background/50">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center gap-3 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.png" alt="BMS" className="h-8 w-auto" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
                AI BMS
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wider leading-tight">
                MONITOR
              </span>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-8 bg-border shrink-0" />

          {/* 连接方式选择 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground shrink-0">连接方式</label>
            <select
              value={connectionType}
              onChange={(e) => handleTypeChange(e.target.value as ConnectionType)}
              className="h-8 px-2.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              disabled={connState === 'connecting'}
            >
              <option value="bluetooth" disabled={!btSupported}>
                蓝牙{!btSupported ? ' (不支持)' : ''}
              </option>
              <option value="serial" disabled={!serialSupported}>
                串口{!serialSupported ? ' (不支持)' : ''}
              </option>
            </select>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-8 bg-border shrink-0" />

          {/* 蓝牙设置 */}
          {connectionType === 'bluetooth' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground shrink-0">过滤名称</label>
              <input
                type="text"
                value={btFilterName}
                onChange={(e) => setBtFilterName(e.target.value)}
                placeholder="DCSF+"
                className="h-8 w-28 px-2.5 text-xs bg-background border border-border rounded-md text-foreground font-mono-num focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={connState === 'connecting' || connState === 'connected'}
              />
            </div>
          )}

          {/* 串口设置 */}
          {connectionType === 'serial' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground shrink-0">波特率</label>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(Number(e.target.value))}
                className="h-8 px-2.5 text-xs bg-background border border-border rounded-md text-foreground font-mono-num focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                disabled={connState === 'connecting' || connState === 'connected'}
              >
                {BAUD_RATES.map((rate) => (
                  <option key={rate} value={rate}>{rate}</option>
                ))}
              </select>

              <label className="text-xs text-muted-foreground shrink-0 ml-1">校验位</label>
              <select
                value={parity}
                onChange={(e) => setParity(e.target.value as 'none' | 'odd' | 'even')}
                className="h-8 px-2.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                disabled={connState === 'connecting' || connState === 'connected'}
              >
                {PARITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 弹性空间 */}
          <div className="flex-1" />

          {/* 状态指示 */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('w-2 h-2 rounded-full', stateColor[connState])} />
            <span className={cn(
              'text-xs font-mono-num',
              connState === 'connected' ? 'text-bms-ok' :
              connState === 'connecting' ? 'text-bms-info' :
              connState === 'error' ? 'text-bms-danger' :
              'text-muted-foreground'
            )}>
              {statusMessage || '未连接'}
            </span>
          </div>

          {/* 连接/断开按钮 */}
          <button
            onClick={handleConnect}
            disabled={connState === 'connecting'}
            className={cn(
              'h-8 px-4 text-xs font-medium rounded-md transition-all shrink-0',
              connState === 'connected'
                ? 'bg-bms-danger/15 text-bms-danger border border-bms-danger/30 hover:bg-bms-danger/25'
                : connState === 'connecting'
                  ? 'bg-primary/10 text-primary/50 border border-primary/20 cursor-wait'
                  : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25'
            )}
          >
            {connState === 'connecting' ? '连接中...' : connState === 'connected' ? '断开连接' : '连接设备'}
          </button>
        </div>
      </div>
    </header>
  );
}
