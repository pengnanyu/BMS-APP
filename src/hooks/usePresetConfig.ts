import { getPresetConfigs } from '@/lib/preset-configs';
import type { PresetConfig } from '@/types/bms';

interface PresetConfigState {
  presets: PresetConfig[];
}

export function usePresetConfig(): PresetConfigState {
  return {
    presets: getPresetConfigs(),
  };
}
