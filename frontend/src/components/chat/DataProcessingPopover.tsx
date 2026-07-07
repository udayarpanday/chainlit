import { Eye, FileText, Image, MessageSquare, Mic } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import type { EvoyaDataProcessingCategory } from '@chainlit/copilot/src/evoya/types';

import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

import ChFlag from '@/assets/ch.svg?react';
import EuFlag from '@/assets/eu.svg?react';
import UsFlag from '@/assets/us.svg?react';

type CategoryIcon = ComponentType<{ className?: string }>;
type FlagIcon = ComponentType<SVGProps<SVGSVGElement>>;

const categoryIcons: Record<string, CategoryIcon> = {
  language_model: MessageSquare,
  image_generation: Image,
  image_analysis: Eye,
  document_ocr: FileText,
  voice_speech_to_text: Mic
};

const regionLabels: Record<EvoyaDataProcessingCategory['region'], string> = {
  CH: 'Switzerland',
  EU: 'Europe',
  US: 'US',
  OTHER: 'Other'
};

const regionFlagIcons: Partial<
  Record<EvoyaDataProcessingCategory['region'], FlagIcon>
> = {
  CH: ChFlag,
  EU: EuFlag,
  US: UsFlag
};

interface Props {
  categories: EvoyaDataProcessingCategory[];
}

export default function DataProcessingPopover({ categories }: Props) {
  const { t } = useTranslation();

  if (!categories.length) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
        >
          {t('components.organisms.chat.dataProcessing.button')}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-72 overflow-hidden rounded-lg p-0"
      >
        <div className="border-b px-4 py-3 text-sm font-medium">
          {t('components.organisms.chat.dataProcessing.title')}
        </div>
        <div className="space-y-1 p-2">
          {categories.map(({ key, label, region, flag }) => {
            const Icon = categoryIcons[key] ?? MessageSquare;
            const FlagIcon = regionFlagIcons[region];
            const translatedLabel = t(
              `components.organisms.chat.dataProcessing.categories.${key}`
            );

            return (
              <div
                key={key}
                className="flex min-h-9 items-center gap-3 rounded-md px-2 text-sm"
              >
                <Icon className="!size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {translatedLabel}
                </span>
                <span
                  aria-label={regionLabels[region]}
                  className="flex size-5 shrink-0 items-center justify-center text-base leading-none"
                >
                  {FlagIcon ? (
                    <FlagIcon className="h-4 w-5 rounded-[2px] object-cover" />
                  ) : (
                    flag
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
