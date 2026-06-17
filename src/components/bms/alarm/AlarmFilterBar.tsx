import { cn } from '@/lib/utils';

type AlarmFilterType = 'all' | 'critical' | 'warning' | 'info';

interface AlarmFilterBarProps {
  filter: AlarmFilterType;
  onFilterChange: (filter: AlarmFilterType) => void;
  counts: { critical: number; warning: number; info: number; total: number };
  onClearAll?: () => void;
}

const filterItems: { key: AlarmFilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'critical', label: '严重' },
  { key: 'warning', label: '警告' },
  { key: 'info', label: '信息' },
];

export function AlarmFilterBar({ filter, onFilterChange, counts, onClearAll }: AlarmFilterBarProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {filterItems.map(item => (
        <button
          key={item.key}
          onClick={() => onFilterChange(item.key)}
          className={cn(
            'h-7 px-2.5 rounded-md text-xs font-medium transition-colors',
            filter === item.key
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted',
          )}
        >
          {item.label}
          <span className="ml-1 font-mono-num text-[10px]">
            {item.key === 'all' ? counts.total : counts[item.key]}
          </span>
        </button>
      ))}
      {counts.total > 0 && onClearAll && (
        <button
          onClick={onClearAll}
          className="ml-auto h-7 px-2.5 rounded-md text-xs text-bms-warn hover:text-bms-danger transition-colors"
        >
          全部清除
        </button>
      )}
    </div>
  );
}
