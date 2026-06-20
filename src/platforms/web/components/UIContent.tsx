import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { webBridge } from '@/platforms/web/lib/web-bridge';
import { useTheme } from '@/components/theme-provider';
import type { ConnectionStatus } from '@/shared/types/bridge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const UI_URL = import.meta.env.VITE_UI_URL || 'https://ui.aibms.net';

/** UI 内容区 - 加载 iframe 子 UI，负责数据转发与帧级通信 */
export function UIContent() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('disconnected');
  /* 保存初始化帧响应，iframe 加载完成后重新推送 */
  const initFrameRef = useRef<{ success: boolean; frame: number[] | null } | null>(null);
  /* 保存最新的 handleIframeMessage，避免 useEffect 闭包捕获旧值 */
  const handleMessageRef = useRef<(msg: { type: string; payload: unknown }) => void>(() => {});

  /** 向 iframe 发送消息（使用 '*' 作为目标 origin，因为 iframe 可能被 ESA 反向代理到不同域名） */
  const sendMessageToIframe = useCallback((message: { type: string; payload: unknown }) => {
    iframeRef.current?.contentWindow?.postMessage(message, '*');
  }, []);

  /* 监听连接状态，同步给 iframe */
  useEffect(() => {
    const unsub = webBridge.onConnectionStatusChange((status) => {
      setConnStatus(status);
      /* 断开连接时清除初始化帧缓存，避免重推过时数据 */
      if (status === 'disconnected') {
        initFrameRef.current = null;
      }
      sendMessageToIframe({
        type: 'bms:connection-status',
        payload: { status },
      });
    });
    return unsub;
  }, []);

  /* 监听原始数据，同步给 iframe（向后兼容） */
  useEffect(() => {
    const unsub = webBridge.onDataReceived((data) => {
      sendMessageToIframe({
        type: 'bms:raw-data',
        payload: { raw: Array.from(data) },
      });
    });
    return unsub;
  }, []);

  /* 监听完整帧，同步给 iframe（协议级通信） */
  useEffect(() => {
    const unsub = webBridge.onFramesReceived((frames) => {
      for (const frame of frames) {
        sendMessageToIframe({
          type: 'bms:frame-received',
          payload: { frame: Array.from(frame) },
        });
      }
    });
    return unsub;
  }, []);

  /* 监听初始化帧完成，通知 iframe 加载协议数据库 */
  useEffect(() => {
    const unsub = webBridge.onInitComplete((success, frame) => {
      console.log('[AIBMS] Init complete:', success, frame ? Array.from(frame).map(b => b.toString(16).padStart(2, '0')).join(' ') : 'no frame');
      /* 保存初始化帧响应，以便 iframe 加载完成后重新推送 */
      initFrameRef.current = { success, frame: frame ? Array.from(frame) : null };
      sendMessageToIframe({
        type: 'bms:init-complete',
        payload: initFrameRef.current,
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

      handleMessageRef.current(data);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeMessage = useCallback((msg: { type: string; payload: unknown }) => {
    switch (msg.type) {
      /* iframe 请求发送协议帧 — 通过数据队列发送 */
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
      /* iframe 请求读取参数 — 转发为协议帧 */
      case 'bms:param-read': {
        const payload = msg.payload as { requestId?: string; frame?: number[] };
        if (payload.frame && Array.isArray(payload.frame)) {
          webBridge.sendFrame(new Uint8Array(payload.frame), payload.requestId);
        } else {
          sendMessageToIframe({
            type: 'bms:param-read-response',
            payload: { requestId: payload.requestId, params: [] },
          });
        }
        break;
      }
      /* iframe 请求写入参数 — 转发为协议帧 */
      case 'bms:param-write': {
        const payload = msg.payload as { requestId?: string; frame?: number[] };
        if (payload.frame && Array.isArray(payload.frame)) {
          webBridge.sendFrame(new Uint8Array(payload.frame), payload.requestId);
        } else {
          sendMessageToIframe({
            type: 'bms:param-write-response',
            payload: { requestId: payload.requestId, success: false },
          });
        }
        break;
      }
      /* iframe 请求异常记录 */
      case 'bms:fault-records': {
        const payload = msg.payload as { requestId?: string; frame?: number[] };
        if (payload.frame && Array.isArray(payload.frame)) {
          webBridge.sendFrame(new Uint8Array(payload.frame), payload.requestId);
        } else {
          sendMessageToIframe({
            type: 'bms:fault-records-response',
            payload: { requestId: payload.requestId, records: [] },
          });
        }
        break;
      }
      /* iframe 请求重新推送状态（防止消息丢失） */
      case 'bms:request-status': {
        /* 重新推送当前连接状态 */
        sendMessageToIframe({
          type: 'bms:connection-status',
          payload: { status: connStatus },
        });
        /* 重新推送初始化帧响应（如果有） */
        if (initFrameRef.current) {
          sendMessageToIframe({
            type: 'bms:init-complete',
            payload: initFrameRef.current,
          });
        }
        /* 重新推送主题和语言 */
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
      /* iframe 请求发送指令 — 转发为协议帧 */
      case 'bms:command': {
        const payload = msg.payload as { requestId?: string; frame?: number[] };
        if (payload.frame && Array.isArray(payload.frame)) {
          webBridge.sendFrame(new Uint8Array(payload.frame), payload.requestId);
        } else {
          sendMessageToIframe({
            type: 'bms:command-response',
            payload: { requestId: payload.requestId, success: false },
          });
        }
        break;
      }
      /* iframe 订阅/取消订阅实时数据 */
      case 'bms:realtime-data': {
        break;
      }
    }
  }, [connStatus, theme, sendMessageToIframe]);

  /* 保持 ref 指向最新的 handleIframeMessage */
  handleMessageRef.current = handleIframeMessage;

  /** iframe 加载完成 */
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
    /* 重新推送初始化帧响应（如果 iframe 加载前已收到） */
    if (initFrameRef.current) {
      console.log('[AIBMS] Re-sending init-complete to iframe on load');
      sendMessageToIframe({
        type: 'bms:init-complete',
        payload: initFrameRef.current,
      });
    }
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
