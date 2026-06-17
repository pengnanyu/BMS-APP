interface AlarmDefinitionConfig {
  code: string;
  label: string;
  level: 'info' | 'warning' | 'critical';
  description: string;
}

const ALARM_DEFINITIONS: AlarmDefinitionConfig[] = [
  {
    code: 'OVER_TEMP',
    label: '温度过高',
    level: 'critical',
    description: '电芯温度超过保护阈值',
  },
  {
    code: 'LOW_SOC',
    label: '电量过低',
    level: 'warning',
    description: '电池剩余电量低于告警阈值',
  },
  {
    code: 'VOLTAGE_DIFF',
    label: '压差过大',
    level: 'warning',
    description: '电芯间电压差异超过阈值',
  },
  {
    code: 'OVER_VOLTAGE',
    label: '过压',
    level: 'critical',
    description: '单体电压超过过压保护值',
  },
  {
    code: 'UNDER_VOLTAGE',
    label: '欠压',
    level: 'critical',
    description: '单体电压低于欠压保护值',
  },
  {
    code: 'OVER_CURRENT',
    label: '过流',
    level: 'critical',
    description: '充放电电流超过保护阈值',
  },
  {
    code: 'BALANCE_ACTIVE',
    label: '均衡启动',
    level: 'info',
    description: '电芯均衡功能已启动',
  },
];

export function getAlarmDefinitions(): AlarmDefinitionConfig[] {
  return [...ALARM_DEFINITIONS];
}

export function isAlarmDefined(code: string): boolean {
  return ALARM_DEFINITIONS.some(d => d.code === code);
}

export function getAlarmLabel(code: string): string {
  return ALARM_DEFINITIONS.find(d => d.code === code)?.label ?? code;
}
