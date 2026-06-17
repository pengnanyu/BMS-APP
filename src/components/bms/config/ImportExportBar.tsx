import { useRef } from 'react';

interface ImportExportBarProps {
  onImport: (file: File) => Promise<boolean>;
  onExport: () => void;
}

export function ImportExportBar({ onImport, onExport }: ImportExportBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onImport(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleImportClick}
        className="h-7 px-2.5 rounded-md border border-border bg-muted/50 text-xs hover:bg-muted transition-colors"
      >
        导入
      </button>
      <button
        onClick={onExport}
        className="h-7 px-2.5 rounded-md border border-border bg-muted/50 text-xs hover:bg-muted transition-colors"
      >
        导出
      </button>
    </div>
  );
}
