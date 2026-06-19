import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { webBridge } from '@/platforms/web/lib/web-bridge';
import { useTheme } from '@/components/theme-provider';
import type { ConnectionStatus } from '@/shared/types/bridge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const UI_URL = import.meta.env.VITE_UI_URL || 'https://ui.aibms.net';

/** UI 内容区 - 加载 iframe 子 UI */
export function UIContent() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('disconnected');

  /* 监听连接状态，同步给 iframe */
  useEffect(() => {
    const unsub = webBridge.onConnectionStatusChange((status) => {
      setConnStatus(status);
      sendMessageToIframe({
        type: 'bms:connection-status',
        payload: { status },
      });
    });
    return unsub;
  }, []);

  /* 监听数据，同步给 iframe */
  useEffect(() => {
    const unsub = webBridge.onDataReceived((data) => {
      sendMessageToIframe({
        type: 'bms:realtime-data',
        payload: { raw: Array.from(data) },
      });
    });
    return unsub;
  }, []);

  /* 监听语言变化，同步给 iframe */
  useEffect(() => {
    const handleLocaleChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      sendMessageToIframe({
        type: 'bms:locale-change',
        payload: detail,
      });
    };
    window.addEventListener('aibms:locale-change', handleLocaleChange);
    return () => window.removeEventListener('aibms:locale-change', handleLocaleChange);
  }, []);

  /* 监听主题变化，同步给 iframe */
  useEffect(() => {
    sendMessageToIframe({
      type: 'bms:theme-change',
      payload: { theme },
    });
  }, [theme]);

  /* 监听 iframe 发来的消息 */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || !data.type) return;

      /* iframe 内滚动时，在顶层触发 scrollTo 隐藏移动端浏览器地址栏 */
      if (data.type === 'bms:iframe-scroll') {
        try { window.scrollTo(0, 1); } catch {}
        return;
      }

      handleIframeMessage(data);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeMessage = useCallback((msg: { type: string; payload: unknown }) => {
    switch (msg.type) {
      case 'bms:param-read': {
        /* iframe 请求读取参数 - 后续对接协议 */
        sendMessageToIframe({
          type: 'bms:param-read-response',
          payload: { requestId: (msg.payload as Record<string, unknown>)?.requestId, params: [] },
        });
        break;
      }
      case 'bms:param-write': {
        /* iframe 请求写入参数 - 后续对接协议 */
        sendMessageToIframe({
          type: 'bms:param-write-response',
          payload: { requestId: (msg.payload as Record<string, unknown>)?.requestId, success: false },
        });
        break;
      }
      case 'bms:fault-records': {
        /* iframe 请求异常记录 - 后续对接协议 */
        sendMessageToIframe({
          type: 'bms:fault-records',
          payload: { requestId: (msg.payload as Record<string, unknown>)?.requestId, records: [] },
        });
        break;
      }
      case 'bms:command': {
        /* iframe 请求发送指令 - 后续对接协议 */
        sendMessageToIframe({
          type: 'bms:command-response',
          payload: { requestId: (msg.payload as Record<string, unknown>)?.requestId, success: false },
        });
        break;
      }
      case 'bms:realtime-data': {
        /* iframe 订阅/取消订阅实时数据 */
        const payload = msg.payload as { action?: string };
        if (payload?.action === 'subscribe') {
          /* 已通过 onDataReceived 自动推送 */
        }
        break;
      }
    }
  }, []);

  /** 向 iframe 发送消息 */
  const sendMessageToIframe = useCallback((message: { type: string; payload: unknown }) => {
    iframeRef.current?.contentWindow?.postMessage(message, UI_URL);
  }, []);

  /** iframe 加载完成 */
  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    /* 同步初始状态给 iframe */
    sendMessageToIframe({
      type: 'bms:connection-status',
      payload: { status: connStatus },
    });
    sendMessageToIframe({
      type: 'bms:theme-change',
      payload: { theme },
    });
    const locale = document.documentElement.lang?.startsWith('zh') ? 'zh' : 'en';
    sendMessageToIframe({
      type: 'bms:locale-change',
      payload: { locale },
    });
  }, [connStatus, theme, sendMessageToIframe]);

  return (
    <div className="absolute inset-0 top-12">
      {/* 加载指示器 */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">{t('common.loading')}</span>
          </div>
        </div>
      )}

      {/* iframe 加载 UI */}
      <iframe
        ref={iframeRef}
        src={UI_URL}
        onLoad={handleIframeLoad}
        allowTransparency
        className={cn(
          "w-full h-full border-0",
          loading && "invisible"
        )}
        title="AIBMS UI"
        allow="bluetooth; serial"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
