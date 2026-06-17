import { useState, useCallback, useEffect } from 'react';
import { ConnectionBar } from '@/components/ConnectionBar';
import { BMSAppShell } from '@/components/BMSAppShell';
import { bmsManager } from '@/lib/bms-manager';
import type { ConnectionState, ConnectionType } from '@/lib/bridge';
import { ThemeContext } from '@/lib/theme-context';

// 暗色主题
const DARK: Record<string, string> = {
  bg: 'hsl(220 15% 8%)',
  fg: 'hsl(210 25% 98%)',
  card: 'hsl(220 15% 11%)',
  cardFg: 'hsl(210 25% 98%)',
  border: 'hsl(220 15% 18%)',
  muted: 'hsl(220 15% 15%)',
  mutedFg: 'hsl(215 15% 62%)',
  primary: 'hsl(180 100% 45%)',
  primaryFg: 'hsl(220 15% 8%)',
  ok: 'hsl(140 70% 45%)',
  warn: 'hsl(35 90% 55%)',
  danger: 'hsl(0 85% 55%)',
  info: 'hsl(180 100% 45%)',
};

// 亮色主题
const LIGHT: Record<string, string> = {
  bg: 'hsl(0 0% 98%)',
  fg: 'hsl(220 15% 12%)',
  card: 'hsl(0 0% 100%)',
  cardFg: 'hsl(220 15% 12%)',
  border: 'hsl(220 15% 88%)',
  muted: 'hsl(220 15% 94%)',
  mutedFg: 'hsl(220 10% 42%)',
  primary: 'hsl(180 100% 35%)',
  primaryFg: 'hsl(0 0% 100%)',
  ok: 'hsl(140 65% 38%)',
  warn: 'hsl(35 85% 48%)',
  danger: 'hsl(0 75% 50%)',
  info: 'hsl(180 100% 35%)',
};

function App() {
  const [connState, setConnState] = useState<ConnectionState>('disconnected');
  const [connType, setConnType] = useState<ConnectionType | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // 切换主题 — 通过切换 html 的 class 来切换 CSS 变量
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', isDark);
    html.classList.toggle('light', !isDark);
    console.log('[Theme] isDark=%s classes=%s', isDark, html.className);
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(p => !p), []);

  const handleStateChange = useCallback((type: ConnectionType, state: ConnectionState) => {
    setConnType(type);
    setConnState(state);
    if (state === 'connected') bmsManager.startRefresh();
    else if (state === 'disconnected' && !isDemo) bmsManager.stopRefresh();
  }, [isDemo]);

  const handleData = useCallback((data: Uint8Array) => {
    bmsManager.handleRawData(data);
  }, []);

  const toggleDemo = useCallback(() => {
    const next = !isDemo;
    setIsDemo(next);
    bmsManager.setDemoMode(next);
    setConnState(next ? 'connected' : 'disconnected');
  }, [isDemo]);

  const t = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: t.bg, color: t.fg, overflow: 'hidden' }}>
        <ConnectionBar onData={handleData} onStateChange={handleStateChange} />

        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <BMSAppShell />
          {isDemo && (
            <div style={{
              position: 'absolute', top: 8, right: 8, zIndex: 50,
              padding: '2px 8px', backgroundColor: `${t.ok}22`, color: t.ok,
              border: `1px solid ${t.ok}44`, borderRadius: 4, fontSize: 10,
              fontVariantNumeric: 'tabular-nums',
            }}>
              DEMO
            </div>
          )}
        </main>

        <footer style={{
          height: 28, borderTop: `1px solid ${t.border}`,
          backgroundColor: `${t.bg}e6`, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px',
          fontSize: 10, color: t.mutedFg, fontVariantNumeric: 'tabular-nums',
        }}>
          <span>AI BMS Monitor v1.0.3</span>
          <span>
            {connState === 'connected' && connType
              ? `${connType === 'bluetooth' ? '蓝牙' : '串口'} 已连接`
              : isDemo ? '演示模式' : '等待连接'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={toggleDemo} style={{ color: t.info, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10 }}>
              {isDemo ? '退出演示' : '演示模式'}
            </button>
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '2px 10px', borderRadius: 6, fontSize: 11,
                fontWeight: 600, cursor: 'pointer', border: 'none',
                backgroundColor: isDark ? `${t.info}18` : `${t.warn}18`,
                color: isDark ? t.info : t.warn,
              }}
              title={isDark ? '切换亮色模式' : '切换暗色模式'}
            >
              <span style={{ fontSize: 14 }}>{isDark ? '☀️' : '🌙'}</span>
              <span>{isDark ? '暗色' : '亮色'}</span>
            </button>
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
