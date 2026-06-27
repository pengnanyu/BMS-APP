/** UI 内容区 — 加载 iframe 子 UI，纯透传转发
 *
 * APP → iframe：只转发连接状态、原始数据、主题、语言
 * iframe → APP：只转发帧发送请求
 *
 * APP 不参与任何业务逻辑（初始化帧、参数读写、异常记录等）
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { webBridge } from '@/platforms/web/lib/web-bridge';
import { useTheme } from '@/components/theme-provider';
import type { ConnectionStatus } from '@/shared/types/bridge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const UI_URL = import.meta.env.VITE_UI_URL || 'https://ui.aibms.net';

export function UIContent() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('disconnected');
  const handleMessageRef = useRef<(msg: { type: string; payload: unknown }) => void>(() => {});

  /** 向 iframe 发送消息 */
  const sendMessageToIframe = useCallback((message: { type: string; payload: unknown }) => {
    iframeRef.current?.contentWindow?.postMessage(message, '*');
  }, []);

  /* 监听连接状态，透传给 iframe */
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

  /* 监听原始数据，透传给 iframe */
  useEffect(() => {
    const unsub = webBridge.onRawDataReceived((data) => {
      sendMessageToIframe({
        type: 'bms:raw-data',
        payload: { data: Array.from(data) },
      });
    });
    return unsub;
  }, []);

  /* 监听语言变化，透传给 iframe */
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

  /* 监听主题变化，透传给 iframe */
  useEffect(() => {
    sendMessageToIframe({
      type: 'bms:theme-change',
      payload: { theme },
    });
  }, [theme]);

  /* 监听 iframe 发来的消息 — 只处理帧发送请求 */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || !data.type) return;

      handleMessageRef.current(data);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeMessage = useCallback((msg: { type: string; payload: unknown }) => {
    switch (msg.type) {
      /* iframe 请求发送协议帧 — 通过数据队列透传到设备 */
      case 'bms:frame-send': {
        const payload = msg.payload as { frame?: number[]; requestId?: string };
        if (payload.frame && Array.isArray(payload.frame)) {
          const data = new Uint8Array(payload.frame);
          const queueId = webBridge.sendFrame(data, payload.requestId);
          /* 回复队列 ID */
          sendMessageToIframe({
            type: 'bms:frame-send-ack',
            payload: { requestId: payload.requestId, queueId },
          });
        }
        break;
      }
      /* iframe 请求重新推送状态 */
      case 'bms:request-status': {
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
        break;
      }
    }
  }, [connStatus, theme, sendMessageToIframe]);

  handleMessageRef.current = handleIframeMessage;

  /** iframe 加载完成 — 推送当前状态 */
  const handleIframeLoad = useCallback(() => {
    setLoading(false);
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
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">{t('common.loading')}</span>
          </div>
        </div>
      )}

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
