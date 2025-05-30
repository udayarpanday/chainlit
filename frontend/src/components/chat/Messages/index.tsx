import { MessageContext } from 'contexts/MessageContext';
import React, { memo, useContext, useState, useEffect } from 'react';

import {
  type IAction,
  type IMessageElement,
  type IStep
} from '@chainlit/react-client';

import BlinkingCursor from '@/components/BlinkingCursor';

import { Message } from './Message';
import { WidgetContext } from '@chainlit/copilot/src/context';
import { firstUserInteraction, } from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';

interface Props {
  messages: IStep[];
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
  scorableRun?: IStep;
}

const CL_RUN_NAMES = ['on_chat_start', 'on_message', 'on_audio_end'];

const hasToolStep = (step: IStep): boolean => {
  return (
    step.steps?.some(
      (s) => s.type === 'tool' || s.type.includes('message') || hasToolStep(s)
    ) || false
  );
};

const hasAssistantMessage = (step: IStep): boolean => {
  return (
    step.steps?.some(
      (s) => s.type === 'assistant_message' || hasAssistantMessage(s)
    ) || false
  );
};

const checkToolStep = (step: IStep): boolean => {
  return step.steps?.some((s) => s.type === 'tool' && s.end == null || checkToolStep(s)) || false;
};

const Messages = memo(
  ({ messages, elements, actions, indent, isRunning, scorableRun }: Props) => {
    const { evoya } = useContext(WidgetContext);
    const messageContext = useContext(MessageContext);
    const firstInteraction = useRecoilValue(firstUserInteraction);
    const [isToolLoading, setToolLoading] = useState(false);

    useEffect(() => {
      const getLoaderState = messages.some(checkToolStep);
      if (isToolLoading || getLoaderState) {
        setToolLoading(false);
      }
      const timeout = setTimeout(() => {
        setToolLoading(getLoaderState);
      }, 700);
      return () => clearTimeout(timeout);

    }, [messages]);

    return (
      <>
        {messages.map((m) => {
          // Handle chainlit runs
          if (CL_RUN_NAMES.includes(m.name)) {
            const isRunning = !m.end && !m.isError && messageContext.loading;
            const isToolCallCoT = messageContext.cot === 'tool_call';
            const isHiddenCoT = messageContext.cot === 'hidden';

            const showToolCoTLoader = isToolCallCoT
              ? isRunning && !hasToolStep(m)
              : false;

            const showHiddenCoTLoader = isHiddenCoT
              ? isRunning && !hasAssistantMessage(m)
              : false;
            // Ignore on_chat_start for scorable run
            const scorableRun =
              !isRunning && m.name !== 'on_chat_start' ? m : undefined;
            return (
              <React.Fragment key={m.id}>
                {m.steps?.length ? (
                  <Messages
                    messages={m.steps}
                    elements={elements}
                    actions={actions}
                    indent={indent}
                    isRunning={isRunning}
                    scorableRun={scorableRun}
                  />
                ) : null}
                {showToolCoTLoader || showHiddenCoTLoader ? (
                  <div className={(!!evoya === false && !!firstInteraction == false) && 'absolute'}>
                    <BlinkingCursor />
                  </div>

                ) : null}

              </React.Fragment>
            );
          } else {
            // Score the current run
            const _scorableRun = m.type === 'run' ? m : scorableRun;
            // The message is scorable if it is the last assistant message of the run

            const isRunLastAssistantMessage =
              m ===
              _scorableRun?.steps?.findLast(
                (_m) => _m.type === 'assistant_message'
              );

            const isLastAssistantMessage =
              messages.findLast((_m) => _m.type === 'assistant_message') === m;

            const isScorable =
              isRunLastAssistantMessage || isLastAssistantMessage;

            return (
              <Message
                message={m}
                elements={elements}
                actions={actions}
                key={m.id}
                indent={indent}
                isRunning={isRunning}
                scorableRun={_scorableRun}
                isScorable={isScorable}
              />
            );
          }
        })}
      </>
    );
  }
);

export { Messages };
