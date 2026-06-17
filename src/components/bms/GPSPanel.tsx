// ==================== GPS 地图面板 ====================

import { useBMS } from '@/lib/bms-store';
import { GPSManager } from '@/lib/gps-manager';
import { useEffect, useState } from 'react';
import { MapPin, Navigation, Satellite, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GPSPanel() {
  const { gpsData, gpsTrack, gpsEnabled, dispatch } = useBMS();
  const [error, setError] = useState<string>('');
  const [isSupported] = useState(() => GPSManager.isSupported());

  const toggleGPS = () => {
    if (!isSupported) {
      setError('当前浏览器不支持定位');
      return;
    }

    if (gpsEnabled) {
      dispatch({ type: 'SET_GPS_ENABLED', payload: false });
    } else {
      // 获取单次定位
      const manager = new GPSManager();
      manager.setOnError((err) => setError(err));
      manager.getCurrentPosition().then((data) => {
        if (data) {
          dispatch({ type: 'SET_GPS_DATA', payload: data });
          dispatch({ type: 'SET_GPS_ENABLED', payload: true });
          dispatch({
            type: 'ADD_GPS_TRACK',
            payload: { ...data, id: `track-${Date.now()}` },
          });
          setError('');
        }
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground uppercase tracking-wider">GPS 定位</span>
        </div>
        <button
          onClick={toggleGPS}
          className={cn(
            'px-3 py-1 text-xs rounded border transition-colors font-mono-num',
            gpsEnabled
              ? 'bg-bms-ok/20 border-bms-ok/50 text-bms-ok hover:bg-bms-ok/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          )}
        >
          {gpsEnabled ? '已启用' : '启用'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-bms-danger bg-bms-danger/10 border border-bms-danger/30 rounded p-2">
          {error}
        </div>
      )}

      {/* GPS 数据展示 */}
      {gpsData ? (
        <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
          <div className="bg-card/50 rounded p-2 border border-border">
            <div className="text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> 纬度
            </div>
            <div className="text-foreground">{gpsData.latitude.toFixed(6)}°</div>
          </div>
          <div className="bg-card/50 rounded p-2 border border-border">
            <div className="text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> 经度
            </div>
            <div className="text-foreground">{gpsData.longitude.toFixed(6)}°</div>
          </div>
          <div className="bg-card/50 rounded p-2 border border-border">
            <div className="text-muted-foreground mb-1 flex items-center gap-1">
              <Navigation className="w-3 h-3" /> 速度
            </div>
            <div className="text-foreground">{gpsData.speed.toFixed(1)} km/h</div>
          </div>
          <div className="bg-card/50 rounded p-2 border border-border">
            <div className="text-muted-foreground mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" /> 精度
            </div>
            <div className="text-foreground">±{gpsData.accuracy.toFixed(1)}m</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">
          暂无定位数据
        </div>
      )}

      {/* 轨迹统计 */}
      {gpsTrack.length > 0 && (
        <div className="text-xs text-muted-foreground font-mono-num flex items-center justify-between">
          <span>轨迹点: {gpsTrack.length}</span>
          <button
            onClick={() => dispatch({ type: 'CLEAR_GPS_TRACK' })}
            className="text-bms-danger hover:underline"
          >
            清除轨迹
          </button>
        </div>
      )}
    </div>
  );
}
