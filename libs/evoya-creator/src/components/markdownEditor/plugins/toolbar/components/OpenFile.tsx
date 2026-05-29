import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
} from '@mdxeditor/editor';
import React, { useState, useContext } from 'react';
import { useCellValue, } from '@mdxeditor/gurx';
import {
  FilePickerDialog
} from '@chainlit/app/src/components/FilePickerDialog';
import { EvoyaFile } from '@evoya/file-picker/src/types';
import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import { WidgetContext } from '@/context';

export const OpenFile: React.FC = () => {
  const { config } = useContext(WidgetContext);
  const iconComponentFor = useCellValue(iconComponentFor$);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const t = useTranslation();
  const {
    openCreatorWithFile
  } = useEvoyaCreator();

  const openDocument = (file: EvoyaFile) => {
    if (file.mime) {
      setFileDialogOpen(false);
      openCreatorWithFile(file, { type: file.mime.indexOf('markdown') > -1 ? 'markdown' : 'text' });
    }
  };

  if (!config?.isSuperUser) return null;

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