import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
  editorRootElementRef$,
} from '@mdxeditor/editor';
import React, { useCallback, useState, useContext } from 'react';
import { useCellValue, } from '@mdxeditor/gurx';
import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@chainlit/app/src/components/ui/dialog';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@chainlit/app/src/components/ui/input-group';
import {
  Button
} from '@chainlit/app/src/components/ui/button';
import {
  Spinner
} from '@chainlit/app/src/components/ui/spinner';
import FilePicker from '@evoya/file-picker/src/components/FilePicker';
import { FilePickerContext } from '@evoya/file-picker/src/context/file-context';
import { WidgetContext } from '@/context';

export const SaveContent: React.FC = () => {
  const editorRootElementRef = useCellValue(editorRootElementRef$);
  const { config } = useContext(WidgetContext);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState('');
  const [filePath, setFilePath] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const iconComponentFor = useCellValue(iconComponentFor$);
  const markdownContent = useCellValue(markdownSourceEditorValue$);
  const t = useTranslation();
  const {
    saveCreatorContent,
    fileInfo,
    setFileInfo,
  } = useEvoyaCreator();

  const saveDocument = useCallback(() => {
    if (fileInfo) {
      saveCreatorContent();
    } else {
      setFileName('');
      setFilePath('');
      setCurrentPath('/');
      setOpen(true);
    }
  }, [markdownContent, fileInfo]);

  const saveDocumentNew = () => {
    console.log(fileName, filePath || currentPath);
    const newFileName = fileName + ".md";
    const newPath = filePath || currentPath;
    setSaving(true);
    setFileInfo({
      name: newFileName,
      mime: "text/markdown",
      path: newPath + newFileName
    })
    saveCreatorContent({
      name: newFileName,
      mime: "text/markdown",
      path: newPath + newFileName
    }).then(() => {
      setOpen(false);
      setSaving(false);
    });
  };

  return (
    <>
      <ButtonWithTooltip
        title={t('toolbar.save.label', 'Save Document')}
        onClick={() => {
          saveDocument();
        }}
      >
        {iconComponentFor('floppy')}
      </ButtonWithTooltip>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="z-[9999] max-w-screen-sm">
          <DialogHeader>
            <DialogTitle>
              {t('toolbar.save.label', 'Save')}
            </DialogTitle>
          </DialogHeader>
          <div>
            <InputGroup className="mb-4">
              <InputGroupInput
                placeholder={t('toolbar.save.input', 'File name')}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                isGroup
              />
              <InputGroupAddon align="inline-end">.md</InputGroupAddon>
            </InputGroup>
            <FilePickerContext.Provider value={{
              apiBaseUrl: window.location.origin,
              csrfToken: config?.csrfToken,
              type: 'default'
            }}>
              <FilePicker 
                initialPath='/'
                selectedItemsChange={(item) => setFilePath(item[0] ? item[0].path : '')}
                setSelectedPath={(path) => {
                  console.log(path)
                  setCurrentPath(path)
                }}
                destinationMode
              />
            </FilePickerContext.Provider>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('action.cancel', 'Cancel')}
            </Button>
            <Button onClick={() => saveDocumentNew()} disabled={!fileName || !(filePath || currentPath !== '/')}>
              {saving ? <Spinner data-icon="inline-start" /> : iconComponentFor('floppy')}
              {t('toolbar.save.label', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}