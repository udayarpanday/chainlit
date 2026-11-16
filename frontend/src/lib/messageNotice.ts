import type { IStep } from '@chainlit/react-client';

export const defaultMessageNotices = {
  taskStopped: 'Task manually stopped.',
  cancellationRequested:
    'Cancellation requested. The current step is being completed first to avoid incomplete or broken data.',
  stepCompleted: 'The step has been completed. New messages can now be sent.'
} as const;

export type MessageNotice = keyof typeof defaultMessageNotices;

export function getMessageNotice(
  message: Pick<IStep, 'type' | 'metadata'> & { output?: string }
): MessageNotice | undefined {
  if (!['assistant_message', 'system_message'].includes(message.type)) return;
  const notice = message.metadata?.avaiaNotice;
  if (notice === 'cancellationRequested' || notice === 'stepCompleted')
    return notice;
  // Older servers and the stop_message handler may send only the English text.
  if (
    notice === 'taskStopped' ||
    (!notice && message.output === defaultMessageNotices.taskStopped)
  )
    return 'taskStopped';
}
