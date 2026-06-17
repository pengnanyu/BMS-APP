import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  text: string;
}

export function EmptyState({ icon, text }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      {icon && <span className="text-3xl mb-2">{icon}</span>}
      <span className="text-sm">{text}</span>
    </div>
  );
}
