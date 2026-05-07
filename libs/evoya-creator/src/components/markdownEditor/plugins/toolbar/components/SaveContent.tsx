import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
} from '@mdxeditor/editor';
import React, { useCallback } from 'react';
import { useCellValue, } from '@mdxeditor/gurx';
import useEvoyaCreator from '@/hooks/useEvoyaCreator';

export const SaveContent: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$);
  const markdownContent = useCellValue(markdownSourceEditorValue$);
  const t = useTranslation();
  const {
    saveCreatorContent
  } = useEvoyaCreator();

  const saveDocument = useCallback(() => {
    saveCreatorContent()
  }, [markdownContent]);

  return (
    <ButtonWithTooltip
      title={t('toolbar.save.label', 'Save Document')}
      onClick={() => {
        saveDocument();
      }}
    >
      {iconComponentFor('floppy')}
    </ButtonWithTooltip>
  )
}