import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { ParamItem } from '@/types/bms';
import { ParamInput } from './ParamInput';

interface ParamGroupListProps {
  params: ParamItem[];
  modifiedKeys: Set<string>;
  onUpdate: (key: string, value: number | string) => void;
  validateParam: (param: ParamItem, value: number | string) => boolean;
}

export function ParamGroupList({ params, modifiedKeys, onUpdate, validateParam }: ParamGroupListProps) {
  const groups = new Map<string, ParamItem[]>();
  params.forEach(p => {
    const list = groups.get(p.group) ?? [];
    list.push(p);
    groups.set(p.group, list);
  });

  return (
    <Accordion type="multiple" defaultValue={Array.from(groups.keys())} className="w-full">
      {Array.from(groups.entries()).map(([group, items]) => (
        <AccordionItem key={group} value={group}>
          <AccordionTrigger className="text-xs font-medium py-2">{group}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {items.map(param => (
                <div key={param.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground min-w-[100px]">{param.label}</span>
                  <ParamInput
                    param={param}
                    isModified={modifiedKeys.has(param.key)}
                    isInvalid={!validateParam(param, param.value)}
                    onUpdate={onUpdate}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
