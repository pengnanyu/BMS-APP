// ==================== 参数配置 Tab ====================
// 读写参数 + 导入导出 + 一键配置（三元/铁锂/钠锂）

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ==================== 参数类型定义 ====================

export interface ParamItem {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  type: 'number' | 'select' | 'text';
  options?: { label: string; value: number | string }[];
  group: string;
}

/** 预设配置模板 */
export interface PresetConfig {
  name: string;
  description: string;
  params: Record<string, number | string>;
}

// ==================== 预设配置 ====================

const PRESETS: PresetConfig[] = [
  {
    name: '三元锂 (NCM)',
    description: '3.7V 标称，4.2V 满电',
    params: {
      cellNominalVoltage: 3.7,
      cellMaxVoltage: 4.2,
      cellMinVoltage: 2.8,
      chargeCurrent: 50,
      dischargeCurrent: 100,
      overTempCharge: 45,
      overTempDischarge: 55,
      underTempCharge: 0,
      underTempDischarge: -10,
      balanceStart: 4.0,
      balanceDiff: 30,
    },
  },
  {
    name: '磷酸铁锂 (LFP)',
    description: '3.2V 标称，3.65V 满电',
    params: {
      cellNominalVoltage: 3.2,
      cellMaxVoltage: 3.65,
      cellMinVoltage: 2.5,
      chargeCurrent: 50,
      dischargeCurrent: 100,
      overTempCharge: 50,
      overTempDischarge: 60,
      underTempCharge: 0,
      underTempDischarge: -10,
      balanceStart: 3.4,
      balanceDiff: 20,
    },
  },
  {
    name: '钠离子 (Na-ion)',
    description: '3.0V 标称，3.8V 满电',
    params: {
      cellNominalVoltage: 3.0,
      cellMaxVoltage: 3.8,
      cellMinVoltage: 1.5,
      chargeCurrent: 30,
      dischargeCurrent: 60,
      overTempCharge: 50,
      overTempDischarge: 60,
      underTempCharge: -20,
      underTempDischarge: -30,
      balanceStart: 3.5,
      balanceDiff: 30,
    },
  },
];

// ==================== 默认参数列表 ====================

function getDefaultParams(): ParamItem[] {
  return [
    // 电压参数
    { key: 'cellNominalVoltage', label: '单体标称电压', value: 3.2, unit: 'V', min: 1.5, max: 4.5, step: 0.05, type: 'number', group: '电压参数' },
    { key: 'cellMaxVoltage', label: '单体过压保护', value: 3.65, unit: 'V', min: 2.0, max: 4.5, step: 0.05, type: 'number', group: '电压参数' },
    { key: 'cellMinVoltage', label: '单体欠压保护', value: 2.5, unit: 'V', min: 1.0, max: 3.5, step: 0.05, type: 'number', group: '电压参数' },

    // 电流参数
    { key: 'chargeCurrent', label: '最大充电电流', value: 50, unit: 'A', min: 0, max: 500, step: 1, type: 'number', group: '电流参数' },
    { key: 'dischargeCurrent', label: '最大放电电流', value: 100, unit: 'A', min: 0, max: 500, step: 1, type: 'number', group: '电流参数' },

    // 温度参数
    { key: 'overTempCharge', label: '充电过温保护', value: 50, unit: '°C', min: 0, max: 80, step: 1, type: 'number', group: '温度参数' },
    { key: 'overTempDischarge', label: '放电过温保护', value: 60, unit: '°C', min: 0, max: 80, step: 1, type: 'number', group: '温度参数' },
    { key: 'underTempCharge', label: '充电欠温保护', value: 0, unit: '°C', min: -40, max: 20, step: 1, type: 'number', group: '温度参数' },
    { key: 'underTempDischarge', label: '放电欠温保护', value: -10, unit: '°C', min: -40, max: 20, step: 1, type: 'number', group: '温度参数' },

    // 均衡参数
    { key: 'balanceStart', label: '均衡启动电压', value: 3.4, unit: 'V', min: 2.0, max: 4.5, step: 0.05, type: 'number', group: '均衡参数' },
    { key: 'balanceDiff', label: '均衡压差阈值', value: 20, unit: 'mV', min: 5, max: 100, step: 5, type: 'number', group: '均衡参数' },
  ];
}

// ==================== 主组件 ====================

export function ParamConfigPanel() {
  const [params, setParams] = useState<ParamItem[]>(getDefaultParams);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 显示临时提示
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // 修改参数值
  const updateParam = useCallback((key: string, value: number | string) => {
    setParams(prev => prev.map(p => p.key === key ? { ...p, value } : p));
  }, []);

  // 一键配置
  const applyPreset = useCallback((preset: PresetConfig) => {
    setParams(prev => prev.map(p => {
      if (preset.params[p.key] !== undefined) {
        return { ...p, value: preset.params[p.key] };
      }
      return p;
    }));
    showToast(`已应用预设: ${preset.name}`);
  }, [showToast]);

  // 读取参数（从设备）
  const handleRead = useCallback(() => {
    // 实际项目中：通过 Bridge 发送读取指令
    showToast('已从设备读取参数');
  }, [showToast]);

  // 写入参数（到设备）
  const handleWrite = useCallback(() => {
    // 实际项目中：通过 Bridge 发送写入指令
    showToast('参数已写入设备');
    setEditing(false);
  }, [showToast]);

  // 导出参数
  const handleExport = useCallback(() => {
    const data = params.reduce((acc, p) => {
      acc[p.key] = p.value;
      return acc;
    }, {} as Record<string, number | string>);

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bms-params-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('参数已导出');
  }, [params, showToast]);

  // 导入参数
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          setParams(prev => prev.map(p => {
            if (data[p.key] !== undefined) {
              return { ...p, value: data[p.key] };
            }
            return p;
          }));
          showToast('参数已导入');
        } catch {
          showToast('导入失败：文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showToast]);

  // 按分组
  const groups = params.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {} as Record<string, ParamItem[]>);

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3 relative">
      {/* 提示 */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-xs font-mono-num animate-pulse">
          {toast}
        </div>
      )}

      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 一键配置 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">一键配置:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="px-2.5 py-1 text-[10px] bg-card border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* 读写按钮 */}
        <button
          onClick={handleRead}
          className="px-3 py-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-md hover:bg-primary/20 transition-colors"
        >
          读取
        </button>
        <button
          onClick={handleWrite}
          disabled={!editing}
          className={cn(
            'px-3 py-1 text-xs rounded-md border transition-colors',
            editing
              ? 'bg-bms-ok/10 text-bms-ok border-bms-ok/30 hover:bg-bms-ok/20'
              : 'bg-card/50 text-muted-foreground border-border cursor-not-allowed'
          )}
        >
          写入
        </button>

        {/* 导入导出 */}
        <button
          onClick={handleImport}
          className="px-3 py-1 text-xs bg-card border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          导入
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-1 text-xs bg-card border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          导出
        </button>
      </div>

      {/* 参数列表（按分组） */}
      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-card/80">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{groupName}</span>
          </div>
          <div className="divide-y divide-border/50">
            {items.map((param) => (
              <div key={param.key} className="flex items-center gap-3 px-3 py-2">
                <span className="text-xs text-muted-foreground w-28 shrink-0">{param.label}</span>

                {param.type === 'number' ? (
                  <input
                    type="number"
                    value={param.value as number}
                    onChange={(e) => {
                      updateParam(param.key, Number(e.target.value));
                      setEditing(true);
                    }}
                    min={param.min}
                    max={param.max}
                    step={param.step || 1}
                    className="w-24 h-7 px-2 text-xs bg-background border border-border rounded font-mono-num focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : param.type === 'select' && param.options ? (
                  <select
                    value={param.value}
                    onChange={(e) => {
                      updateParam(param.key, e.target.value);
                      setEditing(true);
                    }}
                    className="w-32 h-7 px-2 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {param.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={param.value as string}
                    onChange={(e) => {
                      updateParam(param.key, e.target.value);
                      setEditing(true);
                    }}
                    className="w-40 h-7 px-2 text-xs bg-background border border-border rounded font-mono-num focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}

                {param.unit && <span className="text-[10px] text-muted-foreground">{param.unit}</span>}

                {editing && (
                  <span className="text-[10px] text-bms-warn ml-auto">已修改</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
