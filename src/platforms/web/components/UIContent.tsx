import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Battery, Zap, Thermometer, Gauge } from 'lucide-react';

export function UIContent() {
  const { t } = useTranslation();

  return (
    <div className="relative h-screen overflow-y-auto bg-background">
      <div className="min-h-full flex flex-col items-center justify-center p-8 pt-16 animate-fade-in">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(currentColor 1px, transparent 1px),
              linear-gradient(90deg, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            color: 'var(--color-foreground)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center p-3">
            <img
              src="/aibms-logo.png"
              alt="AIBMS"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mt-4">
            <StatusCard
              icon={<Battery className="w-4 h-4" />}
              label={t('dashboard.batteryStatus')}
              value={t('dashboard.waitingForConnection')}
              muted
            />
            <StatusCard
              icon={<Zap className="w-4 h-4" />}
              label={t('dashboard.voltageCurrent')}
              value="-- V / -- A"
              muted
            />
            <StatusCard
              icon={<Thermometer className="w-4 h-4" />}
              label={t('dashboard.temperature')}
              value="-- °C"
              muted
            />
            <StatusCard
              icon={<Gauge className="w-4 h-4" />}
              label={t('dashboard.soc')}
              value="-- %"
              muted
            />
          </div>

          <div className="w-full mt-2 rounded-lg border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">{t('dashboard.tipLabel')}</span>
              {t('dashboard.tipMessage')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border border-border bg-card p-3 flex flex-col gap-1.5",
    )}>
      <div className="flex items-center gap-1.5">
        <span className={cn("w-4 h-4", muted ? "text-muted-foreground/40" : "text-primary")}>
          {icon}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-mono font-semibold",
        muted ? "text-muted-foreground/50" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}
