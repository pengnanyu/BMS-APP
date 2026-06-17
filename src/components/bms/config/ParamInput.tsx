import { cn } from '@/lib/utils';
import type { ParamItem } from '@/types/bms';

interface ParamInputProps {
  param: ParamItem;
  isModified: boolean;
  isInvalid: boolean;
  onUpdate: (key: string, value: number | string) => void;
}

export function ParamInput({ param, isModified, isInvalid, onUpdate }: ParamInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = param.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    onUpdate(param.key, isNaN(val as number) ? e.target.value : val);
  };

  return (
    <div className="flex items-center gap-2">
      {param.type === 'select' && param.options ? (
        <select
          value={String(param.value)}
          onChange={handleChange}
          className={cn(
            'h-7 rounded-md border bg-transparent px-2 text-xs font-mono-num',
            isInvalid ? 'border-bms-danger' : 'border-border',
          )}
        >
          {param.options.map(opt => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={param.type}
          value={param.value}
          onChange={handleChange}
          min={param.min}
          max={param.max}
          step={param.step}
          className={cn(
            'h-7 w-24 rounded-md border bg-transparent px-2 text-xs font-mono-num',
            isInvalid ? 'border-bms-danger' : 'border-border',
          )}
        />
      )}

      {param.unit && <span className="text-[10px] text-muted-foreground">{param.unit}</span>}

      {isModified && (
        <span className="text-[9px] text-bms-info bg-bms-info/10 px-1 py-0.5 rounded">已修改</span>
      )}

      {isInvalid && (
        <span className="text-[9px] text-bms-danger">
          {param.min !== undefined && param.max !== undefined
            ? `${param.min}~${param.max}`
            : '无效值'}
        </span>
      )}
    </div>
  );
}
