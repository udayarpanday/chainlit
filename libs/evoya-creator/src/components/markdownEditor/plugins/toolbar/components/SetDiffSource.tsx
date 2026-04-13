import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
} from '@mdxeditor/editor';
import React, { useCallback } from 'react';
import { useCellValue } from '@mdxeditor/gurx';

export const SetDiffSource: React.FC<{ setMdDiffContent: (md: string) => void }> = ({ setMdDiffContent }) => {
  const iconComponentFor = useCellValue(iconComponentFor$);
  const markdownContent = useCellValue(markdownSourceEditorValue$);
  const t = useTranslation();

  const setDiffSource = useCallback(() => {
    setMdDiffContent(markdownContent);
  }, [markdownContent]);

  return (
    <ButtonWithTooltip
      title={t('toolbar.diffsource', 'Update diff source')}
      onClick={() => {
        setDiffSource();
      }}
    >
      {iconComponentFor('arrow-right-from-line')}
    </ButtonWithTooltip>
  )
}