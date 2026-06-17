import { useState, useEffect, useCallback, useRef } from 'react';
import type { LayoutMode } from '@/types/bms';

interface AdaptiveLayoutInfo {
  mode: LayoutMode;
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  columns: number;
}

function getLayoutInfo(width: number): AdaptiveLayoutInfo {
  if (width < 640) {
    return { mode: 'mobile', width, isMobile: true, isTablet: false, isDesktop: false, columns: 1 };
  }
  if (width < 1024) {
    return { mode: 'tablet', width, isMobile: false, isTablet: true, isDesktop: false, columns: 2 };
  }
  return { mode: 'desktop', width, isMobile: false, isTablet: false, isDesktop: true, columns: 3 };
}

export function useAdaptiveLayout(): AdaptiveLayoutInfo {
  const ref = useRef<HTMLDivElement | null>(null);
  const [info, setInfo] = useState<AdaptiveLayoutInfo>(() => getLayoutInfo(window.innerWidth));

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setInfo(getLayoutInfo(width));
      }
    });

    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return info;
}
