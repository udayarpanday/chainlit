import { useCellValue, usePublisher } from '@mdxeditor/gurx';
import React from 'react';
import {
  useTranslation,
  Separator,
  CodeToggle,
  InsertTable,
  InsertCodeBlock,
  InsertImage,
} from '@mdxeditor/editor';

import { cn } from '@chainlit/app/src/lib/utils';
import { Switch } from '@chainlit/app/src/components/ui/switch';
import { Label } from '@chainlit/app/src/components/ui/label';
import {
  showAdvancedToolbar$,
} from '../evoyaToolbar';

export const EvoyaAdvanced: React.FC = () => {
  const showAdvancedToolbar = useCellValue(showAdvancedToolbar$);

  if (!showAdvancedToolbar) return null;

  return (
    <>
      <InsertImage />
      <InsertTable />
      <CodeToggle />
      <InsertCodeBlock />
      <Separator />
    </>
  )
}

export const EvoyaAdvancedToggle: React.FC = () => {
  const showAdvancedToolbar = useCellValue(showAdvancedToolbar$);
  const setShowAdvancedToolbar = usePublisher(showAdvancedToolbar$);
  const t = useTranslation();

  return (
    <div className="flex items-center px-2">
      <Switch
        id="evoya-advanced-toolbar-toggle"
        size="sm"
        checked={showAdvancedToolbar}
        onCheckedChange={(checked: boolean) => {
          setShowAdvancedToolbar(checked);
        }}
        className={cn(
          'data-[state=checked]:bg-primary'
        )}
      />
      <Label htmlFor="evoya-advanced-toolbar-toggle" className="pl-2 text-xs mb-0 font-normal">
        {t('toolbar.detailedView.label', 'Detailed')}
      </Label>
    </div>
  )
}