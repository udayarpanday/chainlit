import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
} from '@mdxeditor/editor';
import React from 'react';
import { useCellValue, usePublisher } from '@mdxeditor/gurx';
import {
  selectDocument$,
} from '../../evoyaAi';

export const SelectDocument: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$);
  const selectDocument = usePublisher(selectDocument$);
  const t = useTranslation();

  return (
    <ButtonWithTooltip
      title={t('toolbar.selectAll', 'Select All')}
      onClick={() => {
        selectDocument();
      }}
    >
      {/* <HandPointer /> */}
      {iconComponentFor('handPointer')}
    </ButtonWithTooltip>
  )
}