import { useCellValues, usePublisher } from '@mdxeditor/gurx';
import React from 'react';
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';
import {
  iconComponentFor$,
  useTranslation,
  SingleChoiceToggleGroup,
  ViewMode,
  viewMode$,
  TooltipWrap,
  ButtonWithTooltip,
} from '@mdxeditor/editor';

import { Button } from '@chainlit/app/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@chainlit/app/src/components/ui/dropdown-menu';

import {
  EllipsisVertical,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';
import { approveDiffNode$, comparisonNodeKeys$, evoyaViewType$, rejectDiffNode$ } from '../../evoyaAi';

export const EvoyaDiffSourceToggleWrapper: React.FC<{ children: React.ReactNode; options?: ViewMode[]; SourceToolbar?: React.ReactNode }> = ({
  children,
  SourceToolbar,
  options = ['rich-text', 'diff', 'source']
}) => {
  const [viewMode, iconComponentFor, evoyaViewType, comparisonNodeKeys] = useCellValues(viewMode$, iconComponentFor$, evoyaViewType$, comparisonNodeKeys$)
  const changeViewMode = usePublisher(viewMode$)
  const approveChange = usePublisher(approveDiffNode$)
  const rejectChange = usePublisher(rejectDiffNode$)
  const t = useTranslation()

  const approveAllChanges = () => {
    comparisonNodeKeys.forEach((key) => approveChange({ key }))
  }

  const rejectAllChanges = () => {
    comparisonNodeKeys.forEach((key) => rejectChange({ key }))
  }

  const toggleGroupItems: {
    title: string
    contents: React.ReactNode
    value: ViewMode
  }[] = []

  const toggleGroupItemsDropdown: {
    title: string
    subTitle: string
    contents: React.ReactNode
    value: ViewMode
  }[] = []

  if (options.includes('rich-text')) {
    toggleGroupItems.push({ title: t('toolbar.editMode.label', 'Rich text'), contents: t('toolbar.editMode.label', 'Rich text'), value: 'rich-text' })
    toggleGroupItemsDropdown.push({ title: t('toolbar.editMode.label', 'Rich text'), subTitle: t('toolbar.editMode.description', 'Visual Text Editor'), contents: iconComponentFor('rich_text'), value: 'rich-text' })
  }
  if (options.includes('diff')) {
    toggleGroupItems.push({ title: t('toolbar.compareMode.label', 'Diff mode'), contents: t('toolbar.compareMode.label', 'Diff mode'), value: 'diff' })
    toggleGroupItemsDropdown.push({ title: t('toolbar.compareMode.label', 'Diff mode'), subTitle: t('toolbar.compareMode.description', 'Compare content'), contents: iconComponentFor('difference'), value: 'diff' })
  }
  if (options.includes('source')) {
    toggleGroupItemsDropdown.push({ title: t('toolbar.sourceMode.label', 'Source mode'), subTitle: t('toolbar.sourceMode.description', 'Edit Mrakdown directly'), contents: iconComponentFor('markdown'), value: 'source' })
  }

  return (
    <>
      {viewMode === 'rich-text' ? (
        children
      ) : viewMode === 'diff' ? (
        <span className={styles.toolbarTitleMode}>{t('toolbar.diffMode', 'Diff mode')}</span>
      ) : (
        SourceToolbar ?? <span className={styles.toolbarTitleMode}>{t('toolbar.source', 'Source mode')}</span>
      )}

      {evoyaViewType === "default" && (
        <div className={cn(styles.diffSourceToggleWrapper, 'flex items-center gap-1 [&>span]:flex')} style={{
          '--accent': '230 10.71% 89.02%'
        } as React.CSSProperties}>
          <SingleChoiceToggleGroup
            className={cn(styles.diffSourceToggle, 'text-xs [&>button]:p-0.5')}
            ggClassName={cn(styles.ggDiffSourceToggle, 'mr-0')}
            value={viewMode}
            items={toggleGroupItems}
            onChange={(value) => {
              changeViewMode(value === '' ? 'rich-text' : value)
            }}
          />

          <DropdownMenu>
            <TooltipWrap title={t('toolbar.advancedView.label', 'Advanced View')}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("!w-7 !h-7 text-gray-400 rounded-xs", styles.toolbarButton)}
                >
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
            </TooltipWrap>
            <DropdownMenuContent align="end">
              {toggleGroupItemsDropdown.map((item) => (
                <DropdownMenuItem onClick={() => changeViewMode(item.value)}>
                  <div className='flex flex-col'>
                    <span>{item.title}</span>
                    <span className="text-gray-400 text-xs">{item.subTitle}</span>
                  </div>
                  {viewMode === item.value && (
                    iconComponentFor('check')
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {evoyaViewType === "approve" && (
        <div className={cn(styles.diffSourceToggleWrapper, 'flex items-center gap-1 [&>span]:flex')} style={{
          '--accent': '230 10.71% 89.02%'
        } as React.CSSProperties}>
          <ButtonWithTooltip
            title={t('toolbar.reject.label', 'Reject All')}
            className="text-destructive py-1 [&>span]:flex [&>span]:items-center [&>span>svg]:!size-5 [&>span>svg]:text-destructive"
            onClick={() => {
              rejectAllChanges();
            }}
          >
            {iconComponentFor('close')}
            <span className="text-xs font-bold px-1">{t('toolbar.reject.label', 'Reject All')}</span>
          </ButtonWithTooltip>
          <ButtonWithTooltip
            title={t('toolbar.accept.label', 'Approve All')}
            className="text-success py-1 [&>span]:flex [&>span]:items-center [&>span>svg]:!size-5 [&>span>svg]:text-success"
            onClick={() => {
              approveAllChanges();
            }}
          >
            {iconComponentFor('check')}
            <span className="text-xs font-bold px-1">{t('toolbar.accept.label', 'Approve All')}</span>
          </ButtonWithTooltip>
        </div>
      )}
    </>
  )
}