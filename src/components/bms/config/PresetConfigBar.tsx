import type { PresetConfig } from '@/types/bms';

interface PresetConfigBarProps {
  presets: PresetConfig[];
  onApply: (preset: PresetConfig) => void;
}

export function PresetConfigBar({ presets, onApply }: PresetConfigBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] text-muted-foreground">一键配置:</span>
      {presets.map(preset => (
        <button
          key={preset.code}
          onClick={() => onApply(preset)}
          className="h-7 px-2.5 rounded-md border border-border bg-muted/50 text-xs font-medium hover:bg-muted transition-colors"
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}
