import { cn } from '@/lib/utils';
import { useMemo } from 'react';

import type { IStep } from '@chainlit/react-client';
import { Translator } from 'components/i18n';
import { useTranslation } from 'components/i18n/Translator';

interface Props {
  toolCalls: IStep[];
  isRunning?: boolean;
}

function humanizeToolName(name: string): string {
  const normalizedName = name.replace(/^tool_/, '');

  if (normalizedName.includes('_')) {
    return normalizedName
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return normalizedName.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function getToolStepInfo(step: IStep): string {
  return humanizeToolName(step.name);
}

function getLatestToolStep(steps: IStep[]): IStep | undefined {
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];

    if (step.steps?.length) {
      const nestedStep = getLatestToolStep(step.steps);
      if (nestedStep) {
        return nestedStep;
      }
    }

    if (step.name === 'tools' || step.type === 'tool') {
      return step;
    }
  }
}

function getStepInfo(step: IStep, { thinkingText, toolText, processingText }: { thinkingText: string, toolText: string, processingText: string}): string {
  if (step.type === 'tool' && step.name.includes('DocumentProcessor')) {
    return processingText;
  }

  if (step.name === 'tools') {
    if (!step.steps?.length) {
      return toolText;
    }

    const latestToolStep = getLatestToolStep(step.steps);
    if (latestToolStep) {
      return getStepInfo(latestToolStep, {
        thinkingText,
        toolText,
        processingText
      });
    }

    return toolText;
  }

  if (step.type === 'tool') {
    return `${toolText} ${getToolStepInfo(step)}`;
  }

  return thinkingText;
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
    const latestToolStep = getLatestToolStep(toolCalls);

    if (latestToolStep) {
      const currentStepInfo = getStepInfo(
        latestToolStep,
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
