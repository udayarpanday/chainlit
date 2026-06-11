import { ButtonWithTooltip } from '@mdxeditor/editor';
import { useCellValue, usePublisher } from '@mdxeditor/gurx';
import { WandSparkles } from 'lucide-react';
import React from 'react';

import { pasteNormalizerEnabled$ } from '../../pasteNormalizer';

export const PasteSanitizerToggle: React.FC = () => {
  const pasteNormalizerEnabled = useCellValue(pasteNormalizerEnabled$);
  const setPasteNormalizerEnabled = usePublisher(pasteNormalizerEnabled$);

  return (
    <ButtonWithTooltip
      aria-pressed={pasteNormalizerEnabled}
      data-state={pasteNormalizerEnabled ? 'on' : 'off'}
      title={
        pasteNormalizerEnabled
          ? 'Disable paste sanitizer'
          : 'Enable paste sanitizer'
      }
      onClick={() => setPasteNormalizerEnabled(!pasteNormalizerEnabled)}
    >
      <WandSparkles size={18} strokeWidth={1.75} />
    </ButtonWithTooltip>
  );
};
