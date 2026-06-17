import { useState, useCallback } from 'react';
import { bmsManager } from '@/lib/bms-manager';
import { getParamDefinitions } from '@/lib/param-definitions';
import type { ParamItem, PresetConfig } from '@/types/bms';

interface ParamConfigState {
  params: ParamItem[];
  modifiedKeys: Set<string>;
  updateParam: (key: string, value: number | string) => void;
  readFromDevice: () => Promise<void>;
  writeToDevice: () => Promise<boolean>;
  applyPreset: (preset: PresetConfig) => void;
  importConfig: (file: File) => Promise<boolean>;
  exportConfig: () => void;
  validateParam: (param: ParamItem, value: number | string) => boolean;
  hasModifications: boolean;
}

export function useParamConfig(): ParamConfigState {
  const [params, setParams] = useState<ParamItem[]>(() => getParamDefinitions());
  const [modifiedKeys, setModifiedKeys] = useState<Set<string>>(new Set());

  const updateParam = useCallback((key: string, value: number | string) => {
    setParams(prev => prev.map(p => p.key === key ? { ...p, value } : p));
    setModifiedKeys(prev => new Set(prev).add(key));
  }, []);

  const readFromDevice = useCallback(async () => {
    const deviceParams = await bmsManager.readParams();
    setParams(deviceParams);
    setModifiedKeys(new Set());
  }, []);

  const writeToDevice = useCallback(async (): Promise<boolean> => {
    const modified = params.filter(p => modifiedKeys.has(p.key));
    if (modified.length === 0) return false;
    const success = await bmsManager.writeParams(params);
    if (success) {
      setModifiedKeys(new Set());
    }
    return success;
  }, [params, modifiedKeys]);

  const applyPreset = useCallback((preset: PresetConfig) => {
    setParams(prev => prev.map(p => {
      if (p.key in preset.params) {
        return { ...p, value: preset.params[p.key] };
      }
      return p;
    }));
    setModifiedKeys(prev => {
      const next = new Set(prev);
      Object.keys(preset.params).forEach(key => next.add(key));
      return next;
    });
  }, []);

  const validateParam = useCallback((param: ParamItem, value: number | string): boolean => {
    if (param.type === 'number' && typeof value === 'number') {
      if (param.min !== undefined && value < param.min) return false;
      if (param.max !== undefined && value > param.max) return false;
    }
    return true;
  }, []);

  const importConfig = useCallback(async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== 'object' || data === null) return false;

      setParams(prev => prev.map(p => {
        if (p.key in data) {
          return { ...p, value: data[p.key] };
        }
        return p;
      }));

      const newModified = new Set<string>();
      Object.keys(data).forEach(key => newModified.add(key));
      setModifiedKeys(prev => new Set([...prev, ...newModified]));
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportConfig = useCallback(() => {
    const data: Record<string, number | string> = {};
    params.forEach(p => {
      data[p.key] = p.value;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bms-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [params]);

  return {
    params,
    modifiedKeys,
    updateParam,
    readFromDevice,
    writeToDevice,
    applyPreset,
    importConfig,
    exportConfig,
    validateParam,
    hasModifications: modifiedKeys.size > 0,
  };
}
