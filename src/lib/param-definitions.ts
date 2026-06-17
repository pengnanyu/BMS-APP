import type { ParamItem } from '@/types/bms';

interface ParamDefinitionConfig {
  key: string;
  label: string;
  defaultValue: number | string;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  type: 'number' | 'select' | 'text';
  options?: { label: string; value: number | string }[];
  group: string;
}

const PARAM_DEFINITIONS: ParamDefinitionConfig[] = [
  {
    key: 'nominalVoltage',
    label: '单体标称电压',
    defaultValue: 3.20,
    unit: 'V',
    min: 1.0,
    max: 5.0,
    step: 0.01,
    type: 'number',
    group: '电压参数',
  },
  {
    key: 'overVoltageProtection',
    label: '单体过压保护',
    defaultValue: 3.65,
    unit: 'V',
    min: 1.0,
    max: 5.0,
    step: 0.01,
    type: 'number',
    group: '电压参数',
  },
  {
    key: 'underVoltageProtection',
    label: '单体欠压保护',
    defaultValue: 2.50,
    unit: 'V',
    min: 0.5,
    max: 4.0,
    step: 0.01,
    type: 'number',
    group: '电压参数',
  },
  {
    key: 'overVoltageRecovery',
    label: '过压恢复电压',
    defaultValue: 3.55,
    unit: 'V',
    min: 1.0,
    max: 5.0,
    step: 0.01,
    type: 'number',
    group: '电压参数',
  },
  {
    key: 'underVoltageRecovery',
    label: '欠压恢复电压',
    defaultValue: 2.80,
    unit: 'V',
    min: 0.5,
    max: 4.0,
    step: 0.01,
    type: 'number',
    group: '电压参数',
  },
  {
    key: 'maxChargeCurrent',
    label: '最大充电电流',
    defaultValue: 50,
    unit: 'A',
    min: 0,
    max: 500,
    step: 1,
    type: 'number',
    group: '电流参数',
  },
  {
    key: 'maxDischargeCurrent',
    label: '最大放电电流',
    defaultValue: 100,
    unit: 'A',
    min: 0,
    max: 1000,
    step: 1,
    type: 'number',
    group: '电流参数',
  },
  {
    key: 'chargeOverCurrentProtection',
    label: '充电过流保护',
    defaultValue: 60,
    unit: 'A',
    min: 0,
    max: 500,
    step: 1,
    type: 'number',
    group: '电流参数',
  },
  {
    key: 'dischargeOverCurrentProtection',
    label: '放电过流保护',
    defaultValue: 120,
    unit: 'A',
    min: 0,
    max: 1000,
    step: 1,
    type: 'number',
    group: '电流参数',
  },
  {
    key: 'overTempProtection',
    label: '过温保护阈值',
    defaultValue: 55,
    unit: '°C',
    min: 0,
    max: 100,
    step: 1,
    type: 'number',
    group: '温度参数',
  },
  {
    key: 'overTempRecovery',
    label: '过温恢复阈值',
    defaultValue: 45,
    unit: '°C',
    min: 0,
    max: 100,
    step: 1,
    type: 'number',
    group: '温度参数',
  },
  {
    key: 'underTempProtection',
    label: '低温保护阈值',
    defaultValue: -20,
    unit: '°C',
    min: -40,
    max: 10,
    step: 1,
    type: 'number',
    group: '温度参数',
  },
  {
    key: 'underTempRecovery',
    label: '低温恢复阈值',
    defaultValue: -10,
    unit: '°C',
    min: -40,
    max: 20,
    step: 1,
    type: 'number',
    group: '温度参数',
  },
  {
    key: 'balanceEnabled',
    label: '均衡使能',
    defaultValue: 1,
    unit: '',
    type: 'select',
    options: [
      { label: '关闭', value: 0 },
      { label: '开启', value: 1 },
    ],
    group: '均衡参数',
  },
  {
    key: 'balanceStartVoltage',
    label: '均衡启动电压',
    defaultValue: 3.30,
    unit: 'V',
    min: 1.0,
    max: 5.0,
    step: 0.01,
    type: 'number',
    group: '均衡参数',
  },
  {
    key: 'balanceVoltageDiff',
    label: '均衡压差阈值',
    defaultValue: 30,
    unit: 'mV',
    min: 0,
    max: 500,
    step: 5,
    type: 'number',
    group: '均衡参数',
  },
  {
    key: 'balanceCurrent',
    label: '均衡电流',
    defaultValue: 50,
    unit: 'mA',
    min: 0,
    max: 500,
    step: 10,
    type: 'number',
    group: '均衡参数',
  },
];

export function getParamDefinitions(): ParamItem[] {
  return PARAM_DEFINITIONS.map(def => ({
    key: def.key,
    label: def.label,
    value: def.defaultValue,
    unit: def.unit,
    min: def.min,
    max: def.max,
    step: def.step,
    type: def.type,
    options: def.options,
    group: def.group,
  }));
}

export function getParamGroups(): string[] {
  const groups = new Set(PARAM_DEFINITIONS.map(d => d.group));
  return Array.from(groups);
}
