import { Eye, FileText, Globe2, Image, MessageSquare, Mic } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import type {
  EvoyaDataProcessingCategory,
  EvoyaDataProcessingRegion
} from '@chainlit/copilot/src/evoya/types';

import { useTranslation } from '@/components/i18n/Translator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

import ChFlag from '@/assets/ch.svg?react';
import EuFlag from '@/assets/eu.svg?react';
import UsFlag from '@/assets/us.svg?react';

import { useIsMobile } from '@/hooks/use-mobile';

type CategoryIcon = ComponentType<{ className?: string }>;
type FlagIcon = ComponentType<SVGProps<SVGSVGElement>>;

const categoryIcons: Record<string, CategoryIcon> = {
  language_model: MessageSquare,
  image_generation: Image,
  image_analysis: Eye,
  document_ocr: FileText,
  voice_speech_to_text: Mic
};

const regionLabels: Record<EvoyaDataProcessingRegion, string> = {
  CH: 'Switzerland',
  EU: 'Europe',
  US: 'United States',
  OTHER: 'Other'
};

const regionChipLabels: Record<EvoyaDataProcessingRegion, string> = {
  CH: 'CH',
  EU: 'EU',
  US: 'US',
  OTHER: 'Other'
};

const regionFlagIcons: Partial<Record<EvoyaDataProcessingRegion, FlagIcon>> = {
  CH: ChFlag,
  EU: EuFlag,
  US: UsFlag
};

const regionOrder: EvoyaDataProcessingRegion[] = ['CH', 'EU', 'US', 'OTHER'];

export function getUniqueDataProcessingRegions(
  categories: EvoyaDataProcessingCategory[]
) {
  const configuredRegions = new Set(categories.map(({ region }) => region));

  return regionOrder.filter((region) => configuredRegions.has(region));
}

interface Props {
  categories: EvoyaDataProcessingCategory[];
}

export default function DataProcessingPopover({ categories }: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const uniqueRegions = getUniqueDataProcessingRegions(categories);

  if (!uniqueRegions.length) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${t(
            'components.organisms.chat.dataProcessing.button'
          )}: ${uniqueRegions.map((region) => regionLabels[region]).join(', ')}`}
          className="group inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {uniqueRegions.map((region) => {
            const FlagIcon = regionFlagIcons[region];

            return (
              <span
                key={region}
                className="inline-flex h-6 items-center gap-1 rounded-full border bg-background px-1.5 text-[10px] font-medium leading-none text-muted-foreground shadow-sm transition-colors group-hover:bg-accent group-hover:text-accent-foreground"
              >
                {FlagIcon ? (
                  <FlagIcon
                    aria-hidden="true"
                    className="h-3.5 w-[18px] rounded-[2px] object-cover"
                  />
                ) : (
                  <Globe2 aria-hidden="true" className="!size-5" />
                )}
              </span>
            );
          })}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-72 overflow-hidden rounded-lg p-0"
        style={{
          position: isMobile ? 'fixed' : 'relative',
          bottom: isMobile ? '-92vh' : '5px',
          right: isMobile ? 'auto' : '0',
          left: isMobile ? '175px' : 'auto',
          transform: 'none',
          zIndex: 50
        }}
      >
        <div className="border-b px-4 py-3 text-sm font-medium">
          {t('components.organisms.chat.dataProcessing.title')}
        </div>
        <div className="space-y-1 p-2">
          {categories.map(({ key, region }, index) => {
            const Icon = categoryIcons[key] ?? MessageSquare;
            const FlagIcon = regionFlagIcons[region];
            const regionLabel = regionLabels[region];
            const translatedLabel = t(
              `components.organisms.chat.dataProcessing.categories.${key}`
            );

            return (
              <div
                key={`${key}-${index}`}
                className="flex min-h-9 items-center gap-3 rounded-md px-2 text-sm"
              >
                <Icon className="!size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {translatedLabel}
                </span>
                <span
                  aria-label={regionLabel}
                  className="flex min-w-5 shrink-0 items-center justify-center text-xs leading-none"
                >
                  {FlagIcon ? (
                    <FlagIcon className="h-4 w-5 rounded-[2px] object-cover" />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px]">
                      <Globe2 aria-hidden="true" className="!size-5" />
                    </span>
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
