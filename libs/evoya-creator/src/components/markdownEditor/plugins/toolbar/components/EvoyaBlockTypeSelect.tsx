import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { useCellValue, usePublisher } from '@mdxeditor/gurx';
import {
  useTranslation,
  Select,
  allowedHeadingLevels$,
  BlockType,
  activePlugins$,
  convertSelectionToNode$,
  currentBlockType$,
  iconComponentFor$,
  TooltipWrap,
} from '@mdxeditor/editor';
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';
import { $createParagraphNode } from 'lexical';
import React, { JSX, ReactNode } from 'react';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@chainlit/app/src/components/ui/dropdown-menu';
import { cn } from '@chainlit/app/src/lib/utils';

/**
 * A toolbar component that allows the user to change the block type of the current selection.
 * Supports paragraphs, headings and block quotes.
 * @group Toolbar Components
 */
export const EvoyaBlockTypeSelect = () => {
  const convertSelectionToNode = usePublisher(convertSelectionToNode$);
  const currentBlockType = useCellValue(currentBlockType$);
  const activePlugins = useCellValue(activePlugins$);
  const hasQuote = activePlugins.includes('quote');
  const hasHeadings = activePlugins.includes('headings');
  const iconComponentFor = useCellValue(iconComponentFor$);
  const t = useTranslation();

  if (!hasQuote && !hasHeadings) {
    return null
  }
  const baseItems: { label: string | JSX.Element; value: BlockType; icon: ReactNode }[] = [
    { label: t('toolbar.blockTypes.paragraph', 'Paragraph'), icon: iconComponentFor('letters'), value: 'paragraph' }
  ]
  const headingItems: { label: string | JSX.Element; value: BlockType; icon: ReactNode }[] = []

  if (hasQuote) {
    baseItems.push({ label: t('toolbar.blockTypes.quote', 'Quote'), icon: iconComponentFor('quote'), value: 'quote' })
  }

  if (hasHeadings) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const allowedHeadingLevels = useCellValue(allowedHeadingLevels$)
    headingItems.push(
      ...allowedHeadingLevels.map(
        (n) => ({ label: t('toolbar.blockTypes.heading', 'Heading {{level}}', { level: n }), icon: iconComponentFor('heading-' + n), value: `h${n}` }) as const
      )
    )
  }

  const selectedItem = [...baseItems, ...headingItems].find((el) => el.value === currentBlockType);

  const onTypeSelect = (blockType: BlockType) => {
    switch (blockType) {
      case 'quote':
        convertSelectionToNode(() => $createQuoteNode())
        break
      case 'paragraph':
        convertSelectionToNode(() => $createParagraphNode())
        break
      case '':
        break
      default:
        if (blockType.startsWith('h')) {
          convertSelectionToNode(() => $createHeadingNode(blockType))
        } else {
          throw new Error(`Unknown block type: ${blockType}`)
        }
    }
  }

  return (
    <div className={cn('flex items-center gap-1 [&>span]:flex')} style={{
      '--accent': '230 10.71% 89.02%'
    } as React.CSSProperties}>

      <DropdownMenu>
        <TooltipWrap title={t('toolbar.textFormatting.label', 'Text format')}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("!w-auto !h-7 [&_svg]:!size-6 rounded-xs", styles.toolbarButton)}
            >
              <div className='flex'>
                {selectedItem ? selectedItem.icon : iconComponentFor('text-type')}
                <span className='-ml-1'>{iconComponentFor('arrow_drop_down')}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
        </TooltipWrap>
        <DropdownMenuContent align="end">
          {baseItems.map((item) => (
            <DropdownMenuItem onClick={() => onTypeSelect(item.value)}>
              {item.icon}
              <span>{item.label}</span>
              {currentBlockType === item.value && (
                iconComponentFor('check')
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {headingItems.map((item) => (
            <DropdownMenuItem onClick={() => onTypeSelect(item.value)}>
              {item.icon}
              <span>{item.label}</span>
              {currentBlockType === item.value && (
                iconComponentFor('check')
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <Select<BlockType>
      value={currentBlockType}
      onChange={(blockType) => {
        switch (blockType) {
          case 'quote':
            convertSelectionToNode(() => $createQuoteNode())
            break
          case 'paragraph':
            convertSelectionToNode(() => $createParagraphNode())
            break
          case '':
            break
          default:
            if (blockType.startsWith('h')) {
              convertSelectionToNode(() => $createHeadingNode(blockType))
            } else {
              throw new Error(`Unknown block type: ${blockType}`)
            }
        }
      }}
      triggerTitle={t('toolbar.blockTypeSelect.selectBlockTypeTooltip', 'Select block type')}
      placeholder={t('toolbar.blockTypeSelect.placeholder', 'Block type')}
      items={items}
    />
  )
}