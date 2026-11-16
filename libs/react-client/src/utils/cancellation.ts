import type { IStep } from '../types/step';

import { getMessageTurn } from './message';

export const getCancellingToolCalls = (
  messages: IStep[],
  messageId: string
): IStep[] => {
  const collect = (steps: IStep[]): IStep[] =>
    steps.flatMap((step) => [
      ...(step.type === 'tool' && step.end == null && !step.isError
        ? [step]
        : []),
      ...collect(step.steps ?? [])
    ]);

  return collect(getMessageTurn(messages, messageId));
};
