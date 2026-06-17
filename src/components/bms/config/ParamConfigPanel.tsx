import { useState, useCallback } from 'react';
import { useParamConfig } from '@/hooks/useParamConfig';
import { usePresetConfig } from '@/hooks/usePresetConfig';
import { ParamGroupList } from '@/components/bms/config/ParamGroupList';
import { PresetConfigBar } from '@/components/bms/config/PresetConfigBar';
import { ImportExportBar } from '@/components/bms/config/ImportExportBar';
import { ConfirmDialog } from '@/components/bms/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

export function ParamConfigPanel() {
  const {
    params,
    modifiedKeys,
    updateParam,
    readFromDevice,
    writeToDevice,
    applyPreset,
    importConfig,
    exportConfig,
    validateParam,
    hasModifications,
  } = useParamConfig();

  const { presets } = usePresetConfig();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reading, setReading] = useState(false);

  const handleRead = useCallback(async () => {
    setReading(true);
    await readFromDevice();
    setReading(false);
    toast({ description: '已从设备读取参数' });
  }, [readFromDevice, toast]);

  const handleWriteClick = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const handleWriteConfirm = useCallback(async () => {
    setConfirmOpen(false);
    const success = await writeToDevice();
    toast({
      description: success ? '参数已写入设备' : '写入失败，请重试',
    });
  }, [writeToDevice, toast]);

  const handleApplyPreset = useCallback((preset: typeof presets[0]) => {
    applyPreset(preset);
    toast({ description: `已应用预设: ${preset.name}` });
  }, [applyPreset, toast]);

  const handleImport = useCallback(async (file: File): Promise<boolean> => {
    const success = await importConfig(file);
    toast({
      description: success ? '参数已导入' : '导入失败：文件格式错误',
    });
    return success;
  }, [importConfig, toast]);

  return (
    <div className="p-3 space-y-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PresetConfigBar presets={presets} onApply={handleApplyPreset} />
        <div className="flex items-center gap-2">
          <ImportExportBar onImport={handleImport} onExport={exportConfig} />
          <button
            onClick={handleRead}
            disabled={reading}
            className="h-7 px-3 rounded-md bg-bms-info/15 text-bms-info text-xs font-medium hover:bg-bms-info/25 transition-colors disabled:opacity-50"
          >
            {reading ? '读取中...' : '读取'}
          </button>
          <button
            onClick={handleWriteClick}
            disabled={!hasModifications}
            className="h-7 px-3 rounded-md bg-bms-ok/15 text-bms-ok text-xs font-medium hover:bg-bms-ok/25 transition-colors disabled:opacity-50"
          >
            写入
          </button>
        </div>
      </div>

      <ParamGroupList
        params={params}
        modifiedKeys={modifiedKeys}
        onUpdate={updateParam}
        validateParam={validateParam}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="确认写入"
        message="确认将参数写入设备？请确保参数值正确，错误的参数可能导致设备异常。"
        onConfirm={handleWriteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
