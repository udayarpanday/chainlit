import { useCellValue, usePublisher } from '@mdxeditor/gurx';
import React, { useState, useCallback } from 'react';
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';
import fileDownload from 'js-file-download';
import {
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
  TooltipWrap,
} from '@mdxeditor/editor';

import { Button } from '@chainlit/app/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@chainlit/app/src/components/ui/dropdown-menu';
import { cn } from '@chainlit/app/src/lib/utils';
import { ResetModal } from './ResetDocument';
import {
  selectDocument$,
} from '../../evoyaAi';

export const EvoyaDropdown: React.FC<{ setMdDiffContent: (md: string) => void; }> = ({
  setMdDiffContent,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const iconComponentFor = useCellValue(iconComponentFor$);
  const markdownContent = useCellValue(markdownSourceEditorValue$);
  const selectDocument = usePublisher(selectDocument$);
  const t = useTranslation();

  const exportDocument = useCallback(() => {
    const exportFile = new Blob([markdownContent]);

    fileDownload(exportFile, `export.md`)
  }, [markdownContent]);

  const setDiffSource = useCallback(() => {
    setMdDiffContent(markdownContent);
  }, [markdownContent]);

  return (
    <div className={cn('flex items-center gap-1 [&>span]:flex')} style={{
      '--accent': '230 10.71% 89.02%'
    } as React.CSSProperties}>

      <DropdownMenu>
        <TooltipWrap title={t('toolbar.documentActions.label', 'Document')}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("!w-auto text-sm !h-7 [&_svg]:!size-6 rounded-xs", styles.toolbarButton)}
            >
              <div className="flex">
                {iconComponentFor('file')}
                <span className='-ml-1'>{iconComponentFor('arrow_drop_down')}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
        </TooltipWrap>
        <DropdownMenuContent align="end" className="max-w-[300px]">
          <DropdownMenuItem onClick={() => selectDocument()}>
            {/* {iconComponentFor('handPointer')} */}
            <div className="flex flex-col">
              <span>{t('toolbar.selectAll.label', 'Select All')}</span>
              <span className="text-xs text-gray-400">{t('toolbar.selectAll.description', 'Select All')}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDiffSource()}>
            {/* {iconComponentFor('arrow-right-from-line')} */}
            <div className="flex flex-col">
              <span>{t('toolbar.diffSource.label', 'Update diff source')}</span>
              <span className="text-xs text-gray-400">{t('toolbar.diffSource.description', 'Update diff source')}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowResetModal(true)}>
            {/* {iconComponentFor('filePlus')} */}
            <div className="flex flex-col">
              <span>{t('toolbar.newDocument.label', 'Start new document')}</span>
              <span className="text-xs text-gray-400">{t('toolbar.newDocument.description', 'Start new document')}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportDocument()}>
            {/* {iconComponentFor('save')} */}
            <div className="flex flex-col">
              <span>{t('toolbar.downloadText.label', 'Download Document')}</span>
              <span className="text-xs text-gray-400">{t('toolbar.downloadText.description', 'Download Document')}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResetModal setShow={setShowResetModal} show={showResetModal} />
    </div>
  )
}