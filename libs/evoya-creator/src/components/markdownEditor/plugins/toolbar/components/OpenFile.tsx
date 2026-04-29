import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
} from '@mdxeditor/editor';
import React, { useState } from 'react';
import { useCellValue, } from '@mdxeditor/gurx';
import {
  FilePickerDialog
} from '@chainlit/app/src/components/FilePickerDialog';
import { EvoyaFile } from '@evoya/file-picker/src/types';

export const OpenFile: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const t = useTranslation();

  const openDocument = (file: EvoyaFile) => {
  };

  return (
    <>
      <ButtonWithTooltip
        title={t('toolbar.open.label', 'Open File')}
        onClick={() => {
          setFileDialogOpen(true);
        }}
      >
        {iconComponentFor('folder-open')}
      </ButtonWithTooltip>
      <FilePickerDialog
        open={fileDialogOpen}
        setOpen={setFileDialogOpen}
        selectFile={openDocument}
      />
    </>
  )
}