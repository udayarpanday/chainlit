import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
  TooltipWrap
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@chainlit/app/src/components/ui/dropdown-menu';
import FilePicker from '@evoya/file-picker/src/components/FilePicker';
import { FilePickerContext } from '@evoya/file-picker/src/context/file-context';
import { WidgetContext } from '@/context';
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';
import { cn } from '@chainlit/app/src/lib/utils';

export const SaveContent: React.FC = () => {
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

  const saveDocument = useCallback((forceModal: boolean = false) => {
    if (fileInfo && !forceModal) {
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
      path: newPath + newFileName,
      folderPath: newPath
    })
    saveCreatorContent({
      name: newFileName,
      mime: "text/markdown",
      path: newPath + '/' + newFileName
    }).then(() => {
      setOpen(false);
      setSaving(false);
    });
  };
  
  if (!config?.isSuperUser) return null;

  return (
    <div className={cn('flex items-center gap-1 [&>span]:flex')} style={{
      '--accent': '230 10.71% 89.02%'
    } as React.CSSProperties}>
      {/* <ButtonWithTooltip
        title={t('toolbar.save.label', 'Save Document')}
        onClick={() => {
          saveDocument();
        }}
      >
        {iconComponentFor('floppy')}
      </ButtonWithTooltip> */}
      <DropdownMenu>
        <TooltipWrap title={t('toolbar.save.label', 'Save Document')}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("!w-auto text-sm !h-7 [&_svg]:!size-6 rounded-xs", styles.toolbarButton)}
            >
              <div className="flex">
                {iconComponentFor('floppy')}
                <span className='-ml-1'>{iconComponentFor('arrow_drop_down')}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
        </TooltipWrap>
        <DropdownMenuContent align="end" className="max-w-[300px]">
          <DropdownMenuItem onClick={() => saveDocument(false)}>
            {t('toolbar.save.label', 'Save')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => saveDocument(true)}>
            {t('toolbar.save_as.label', 'Save as')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
          <div className="max-h-[450px] flex flex-col">
            <InputGroup className="mb-4">
              <InputGroupInput
                placeholder={t('toolbar.save.input', 'File name')}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                isGroup
              />
              <InputGroupAddon align="inline-end">.md</InputGroupAddon>
            </InputGroup>
            <div className='grow'>
              <FilePickerContext.Provider value={{
                apiBaseUrl: window.location.origin,
                csrfToken: config?.csrfToken,
                type: 'default'
              }}>
                <FilePicker 
                  initialPath={fileInfo?.folderPath ?? '/'}
                  selectedItemsChange={(item) => setFilePath(item[0] ? item[0].path : '')}
                  setSelectedPath={(path) => {
                    console.log(path)
                    setCurrentPath(path)
                  }}
                  destinationMode
                />
              </FilePickerContext.Provider>
            </div>
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
    </div>
  )
}