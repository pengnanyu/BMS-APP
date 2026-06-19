import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { webBridge } from '@/platforms/web/lib/web-bridge';
import { useTheme, type Theme } from '@/components/theme-provider';
import type { ConnectionType, ConnectionStatus, BluetoothConfig, SerialConfig } from '@/shared/types/bridge';
import { BAUD_RATE_OPTIONS, PARITY_OPTIONS, CONNECTION_TYPE_OPTIONS } from '@/shared/types/bridge';
import { cn } from '@/lib/utils';
import { Bluetooth, Cable, Loader2, Sun, Moon, Monitor, Languages } from 'lucide-react';

let _canvasCtx: CanvasRenderingContext2D | null = null;

function useAutoWidthSelect(value: string, extraWidth = 34) {
  const ref = useRef<HTMLSelectElement>(null);

  useLayoutEffect(() => {
    const sel = ref.current;
    if (!sel) return;
    const text = sel.options[sel.selectedIndex]?.text || '';
    if (!_canvasCtx) {
      const c = document.createElement('canvas');
      _canvasCtx = c.getContext('2d');
    }
    if (!_canvasCtx) return;
    const style = getComputedStyle(sel);
    _canvasCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    sel.style.width = `${Math.ceil(_canvasCtx.measureText(text).width) + extraWidth}px`;
  }, [value, extraWidth]);

  return { ref };
}

const STATUS_I18N_KEYS: Record<ConnectionStatus, string> = {
  disconnected: 'connection.statusDisconnected',
  connecting: 'connection.statusConnecting',
  connected: 'connection.statusConnected',
  error: 'connection.statusError',
};

function StatusIndicator({ status }: { status: ConnectionStatus }) {
  const { t } = useTranslation();
  const colorMap: Record<ConnectionStatus, string> = {
    disconnected: 'bg-muted-foreground/40',
    connecting: 'bg-warning animate-pulse',
    connected: 'bg-success',
    error: 'bg-destructive',
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium shrink-0">
      <span className={cn('w-2 h-2 rounded-full transition-colors', colorMap[status])} />
      <span className="text-muted-foreground">{t(STATUS_I18N_KEYS[status])}</span>
    </span>
  );
}

function ThemeToggle() {
  const { t } = useTranslation();
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
    setTheme(next);
  }, [theme, setTheme]);

  const Icon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const title = theme === 'system' ? t('theme.followSystem') : resolvedTheme === 'dark' ? t('theme.darkMode') : t('theme.lightMode');

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "h-10 w-10 flex items-center justify-center rounded border border-border",
        "hover:bg-accent hover:text-accent-foreground transition-colors shrink-0",
        "touch-manipulation"
      )}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function LanguageToggle() {
  const { i18n } = useTranslation();

  const LANGUAGES = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
  ];

  const current = LANGUAGES.find((l) => i18n.language.startsWith(l.code)) || LANGUAGES[0];
  const autoWidth = useAutoWidthSelect(current.code, 56);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng === 'zh' ? 'zh-CN' : lng;
    window.dispatchEvent(new CustomEvent('aibms:locale-change', { detail: { locale: lng } }));
  }, [i18n]);

  return (
    <div className="relative shrink-0">
      <Languages className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
      <select
        ref={autoWidth.ref}
        value={current.code}
        onChange={handleChange}
        className={cn(
          "h-8 pl-8 text-xs font-medium rounded border border-border bg-background",
          "focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer transition-all"
        )}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
}

export function ConnectionBar() {
  const { t } = useTranslation();
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

  const CONN_TYPE_I18N: Record<string, string> = {
    bluetooth: 'connection.typeBluetooth',
    serial: 'connection.typeSerial',
  };

  const PARITY_I18N: Record<string, string> = {
    none: 'connection.parityNone',
    odd: 'connection.parityOdd',
    even: 'connection.parityEven',
  };

  const connTypeLabel = t(CONN_TYPE_I18N[connType]);
  const parityLabel = t(PARITY_I18N[serialConfig.parity]);

  const connTypeSelect = useAutoWidthSelect(connTypeLabel, 58);
  const baudRateSelect = useAutoWidthSelect(String(serialConfig.baudRate), 34);
  const paritySelect = useAutoWidthSelect(parityLabel, 34);

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
    } else {
      await webBridge.connect();
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
    <header className="sticky top-0 z-50 border-b border-border/50 shadow-sm" style={{ backgroundColor: 'color-mix(in oklch, var(--color-card) 65%, transparent)' }}>
      <div className="h-12 px-4 flex items-center gap-3">
        <div className="flex items-center shrink-0 hidden sm:flex">
          <img
            src="/aibms-logo.png"
            alt="AIBMS"
            className="h-8 w-auto object-contain"
          />
        </div>

        <div className="w-px h-6 bg-border shrink-0 hidden sm:block" />

        <div className="relative">
           <select
            ref={connTypeSelect.ref}
            value={connType}
            onChange={(e) => handleConnTypeChange(e.target.value as ConnectionType)}
            disabled={isConnected || isConnecting}
            className={cn(
               "h-8 pl-8 text-xs font-medium rounded border border-border bg-background",
               "focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer",
               "transition-all",
               (isConnected || isConnecting) && "opacity-50 cursor-not-allowed"
             )}
          >
            {CONNECTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(CONN_TYPE_I18N[opt.value])}</option>
            ))}
          </select>
          {connType === 'bluetooth' ? (
            <Bluetooth className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-primary" />
          ) : (
            <Cable className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-primary" />
          )}
        </div>

        {connType === 'bluetooth' ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <label className="text-xs text-muted-foreground whitespace-nowrap">{t('connection.filterLabel')}</label>
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
          <div className="flex items-center gap-2 animate-fade-in">
            <label className="text-xs text-muted-foreground whitespace-nowrap">{t('connection.baudRateLabel')}</label>
            <select
              ref={baudRateSelect.ref}
              value={serialConfig.baudRate}
              onChange={(e) => setSerialConfig((prev) => ({ ...prev, baudRate: Number(e.target.value) }))}
              className="h-8 text-xs rounded border border-border bg-background 
                         focus:outline-none focus:ring-1 focus:ring-ring font-mono
                         cursor-pointer transition-all"
            >
              {BAUD_RATE_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </select>
            <label className="text-xs text-muted-foreground whitespace-nowrap">{t('connection.parityLabel')}</label>
            <select
              ref={paritySelect.ref}
              value={serialConfig.parity}
              onChange={(e) => setSerialConfig((prev) => ({ ...prev, parity: e.target.value as SerialConfig['parity'] }))}
              className="h-8 text-xs rounded border border-border bg-background 
                         focus:outline-none focus:ring-1 focus:ring-ring
                         cursor-pointer transition-all"
            >
              {PARITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(PARITY_I18N[opt.value])}</option>
              ))}
            </select>
          </div>
        )}

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
            <span>{t('connection.disconnect')}</span>
          ) : (
            <span>{t('connection.connect')}</span>
          )}
        </button>

        <div className="flex-1" />
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
