import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
} from '@mdxeditor/editor';
import React from 'react';
import { useCellValue, } from '@mdxeditor/gurx';
import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import { X } from 'lucide-react';

export const CloseCreator: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$);
  const t = useTranslation();
  const {
    closeCreatorOverlay,
  } = useEvoyaCreator();

  const handleCloseCreator = () => {
    closeCreatorOverlay();
  };

  return (
    <ButtonWithTooltip
      className="text-xs !h-6 rounded-xs font-medium px-0.5 text-black"
      title={t('toolbar.close.label', 'Close Creator')}
      onClick={handleCloseCreator}
    >
      <X className="!h-5 !w-5" />
    </ButtonWithTooltip>
  )
}