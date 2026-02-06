import { cn } from '@/lib/utils';
import { useMemo } from 'react';

import type { IStep } from '@chainlit/react-client';
import { Translator } from 'components/i18n';
import { useTranslation } from 'components/i18n/Translator';

interface Props {
  toolCalls: IStep[];
  isRunning?: boolean;
}

const globalTools = [
  'tool_Web_Request',
  'tool_Google_Search',
  'tool_Task_Scheduler',
  'tool_Image_to_Text',
  'tool_Link_Checker',
  'tool_Image_Generator',
  'tool_Code_Interpreter'
];

function getToolStepInfo(step: IStep): string {
  if (globalTools.includes(step.name)) {
    return step.name.split('_').slice(1).join(' ')
  }
  return step.name.split('_').slice(1, -1).join(' ');
}

function getStepInfo(step: IStep, { thinkingText, toolText, processingText }: { thinkingText: string, toolText: string, processingText: string}): string {
  if (step.type === 'tool' && step.name.includes('DocumentProcessor')) {
    return processingText;
  }

  switch(step.name) {
    case 'tools':
      if (step.steps && step.steps.length > 0) {
        return `${toolText} ${getToolStepInfo(step.steps[0])}`;
      } else {
        return toolText;
      }
    default:
      return thinkingText;
  }
}

export default function ToolStepInfo({
  toolCalls,
}: Props) {
  const { t } = useTranslation();

  // const stepName = step.name;

  const stepInfo = useMemo(() => {
    // const isLangGraph = step.name === 'LangGraph' && step.type === 'run';

    // if (isLangGraph && step.steps && step.steps.length > 0) {
    //   const currentStepInfo = getStepInfo(step.steps[step.steps.length - 1], t('chat.evoya.cot.thinking'), t('chat.evoya.cot.using_tool'));

    //   return currentStepInfo;
    // }
    if (toolCalls.length > 0) {
      const currentStepInfo = getStepInfo(
        toolCalls[toolCalls.length - 1],
        {
          thinkingText: t('chat.evoya.cot.thinking'),
          toolText: t('chat.evoya.cot.using_tool'),
          processingText: t('chat.evoya.cot.processing_document')
        }
      );

      return currentStepInfo;
    }

    return <Translator path="chat.evoya.cot.thinking" />;
  }, [toolCalls]);

  return (
    <div className="flex flex-col flex-grow w-0">
      <p
        className={cn(
          'flex items-center gap-1 group/step loading-shimmer'
        )}
        id={`step-ToolCallInfo`}
      >
        {stepInfo}
      </p>
    </div>
  );
}
