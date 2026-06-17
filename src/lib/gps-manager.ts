// ==================== GPS 定位管理器 ====================

import type { GPSData } from '@/types/bms';

export class GPSManager {
  private watchId: number | null = null;
  private lastPosition: GPSData | null = null;
  private onPositionCallback: ((data: GPSData) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  /** 检查浏览器是否支持 Geolocation API */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  /** 获取最新位置 */
  getLastPosition(): GPSData | null {
    return this.lastPosition;
  }

  /** 设置位置更新回调 */
  setOnPosition(callback: (data: GPSData) => void) {
    this.onPositionCallback = callback;
  }

  /** 设置错误回调 */
  setOnError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  /** 开始监听位置 */
  startWatching(options?: PositionOptions): boolean {
    if (!GPSManager.isSupported()) {
      this.onErrorCallback?.('Geolocation API is not supported');
      return false;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      ...options,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const gpsData: GPSData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || 0,
          speed: (position.coords.speed || 0) * 3.6, // m/s → km/h
          heading: position.coords.heading || 0,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        this.lastPosition = gpsData;
        this.onPositionCallback?.(gpsData);
      },
      (error) => {
        const messages: Record<number, string> = {
          1: '用户拒绝了定位权限',
          2: '位置信息不可用',
          3: '定位请求超时',
        };
        this.onErrorCallback?.(messages[error.code] || '定位失败');
      },
      geoOptions
    );

    return true;
  }

  /** 获取单次位置 */
  async getCurrentPosition(options?: PositionOptions): Promise<GPSData | null> {
    if (!GPSManager.isSupported()) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsData: GPSData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || 0,
            speed: (position.coords.speed || 0) * 3.6,
            heading: position.coords.heading || 0,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          this.lastPosition = gpsData;
          resolve(gpsData);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, ...options }
      );
    });
  }

  /** 停止监听位置 */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
