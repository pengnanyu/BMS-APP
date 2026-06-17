import type { PresetConfig } from '@/types/bms';

const PRESET_CONFIGS: PresetConfig[] = [
  {
    name: '三元锂 (NCM)',
    code: 'NCM',
    description: '三元锂电池标准配置，标称电压3.7V，工作电压范围2.5V~4.2V',
    params: {
      nominalVoltage: 3.70,
      overVoltageProtection: 4.25,
      underVoltageProtection: 2.50,
      overVoltageRecovery: 4.15,
      underVoltageRecovery: 2.80,
      maxChargeCurrent: 50,
      maxDischargeCurrent: 100,
      chargeOverCurrentProtection: 60,
      dischargeOverCurrentProtection: 120,
      overTempProtection: 55,
      overTempRecovery: 45,
      underTempProtection: -20,
      underTempRecovery: -10,
      balanceEnabled: 1,
      balanceStartVoltage: 3.50,
      balanceVoltageDiff: 30,
      balanceCurrent: 50,
    },
  },
  {
    name: '磷酸铁锂 (LFP)',
    code: 'LFP',
    description: '磷酸铁锂电池标准配置，标称电压3.2V，工作电压范围2.0V~3.65V',
    params: {
      nominalVoltage: 3.20,
      overVoltageProtection: 3.65,
      underVoltageProtection: 2.00,
      overVoltageRecovery: 3.55,
      underVoltageRecovery: 2.30,
      maxChargeCurrent: 50,
      maxDischargeCurrent: 100,
      chargeOverCurrentProtection: 60,
      dischargeOverCurrentProtection: 120,
      overTempProtection: 55,
      overTempRecovery: 45,
      underTempProtection: -20,
      underTempRecovery: -10,
      balanceEnabled: 1,
      balanceStartVoltage: 3.30,
      balanceVoltageDiff: 30,
      balanceCurrent: 50,
    },
  },
  {
    name: '钠离子 (Na-ion)',
    code: 'Na-ion',
    description: '钠离子电池标准配置，标称电压3.0V，工作电压范围1.5V~3.8V',
    params: {
      nominalVoltage: 3.00,
      overVoltageProtection: 3.80,
      underVoltageProtection: 1.50,
      overVoltageRecovery: 3.70,
      underVoltageRecovery: 1.80,
      maxChargeCurrent: 40,
      maxDischargeCurrent: 80,
      chargeOverCurrentProtection: 50,
      dischargeOverCurrentProtection: 100,
      overTempProtection: 55,
      overTempRecovery: 45,
      underTempProtection: -30,
      underTempRecovery: -20,
      balanceEnabled: 1,
      balanceStartVoltage: 3.10,
      balanceVoltageDiff: 30,
      balanceCurrent: 40,
    },
  },
];

export function getPresetConfigs(): PresetConfig[] {
  return [...PRESET_CONFIGS];
}

export function getPresetByCode(code: string): PresetConfig | undefined {
  return PRESET_CONFIGS.find(p => p.code === code);
}
