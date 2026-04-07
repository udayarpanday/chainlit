import { prepareContent } from '@/lib/message';
import { memo, useMemo } from 'react';
import { isEqual } from 'lodash';

import { IMessageElement, IStep, evoyaDiffSourceContentState, evoyaDiffSourceEnabledState } from '@chainlit/react-client';

import { CURSOR_PLACEHOLDER } from '@/components/BlinkingCursor';
import Markdown from '@/components/Markdown';

import { InlinedElements } from './InlinedElements';

import { usePrivacyShield } from '@chainlit/copilot/src/evoya/privacyShield/usePrivacyShield';

import { diffChars, diffLines, diffWords } from "diff";
import { useRecoilState, useRecoilValue } from 'recoil';

export interface Props {
  elements: IMessageElement[];
  message: IStep;
  allowHtml?: boolean;
  latex?: boolean;
  isRunning?: boolean;
  diffEnabled?: boolean;
}

const getMessageRenderProps = (message: IStep) => ({
  id: message.id,
  output: message.output,
  input: message.input,
  language: message.language,
  streaming: message.streaming,
  showInput: message.showInput,
  type: message.type
});

const MessageContent = memo(
  ({ message, elements, allowHtml, latex, isRunning, diffEnabled }: Props) => {
    const outputContent =
      message.streaming && message.output
        ? message.output + CURSOR_PLACEHOLDER
        : message.output;

    const {
      transformOutput,
    } = usePrivacyShield();

    const isUserMessage = message.type === 'user_message';

    const diffSource = useRecoilValue(evoyaDiffSourceContentState);
    // const isDiffEnabled = useRecoilValue(evoyaDiffSourceEnabledState);
    console.log(isUserMessage, diffEnabled, isRunning);
    const messageTransDiff = useMemo<string>(() => {
      if (isUserMessage || !diffEnabled || isRunning) {
        return outputContent;
      }

      return diffWords(diffSource, outputContent).map((part) => {
        if (part.added) {
          // return `<span data-diff-state="added">${part.value}</span>`;
          return part.value.split('\n').map(split => `<span data-diff-state="added">${split}</span>`).join('\n');
        }
        if (part.removed) {
          // return `<span data-diff-state="removed">${part.value}</span>`;
          return part.value.split('\n').map(split => `<span data-diff-state="removed">${split}</span>`).join('\n');
        }
        return part.value;
      }).join('');
    }, [diffSource, outputContent, isUserMessage, diffEnabled, isRunning]);

    const messageTrans = useMemo<string>(() => {
      return transformOutput(messageTransDiff);
    }, [messageTransDiff])

    const {
      preparedContent: output,
      inlinedElements: outputInlinedElements,
      refElements: outputRefElements
    } = prepareContent({
      elements,
      id: message.id,
      content: messageTrans,
      language: message.language
    });

    const displayInput = message.input && message.showInput;

    const isMessage = message.type.includes('message');

    const outputMarkdown = (
      <div className="flex flex-col gap-2">
        {!isMessage && displayInput ? (
          <div className="text-lg font-semibold leading-none tracking-tight">
            Output
          </div>
        ) : null}
        <Markdown
          allowHtml={true}
          latex={latex}
          refElements={outputRefElements}
        >
          {output}
        </Markdown>
      </div>
    );

    let inputMarkdown;

    if (displayInput) {
      const inputContent =
        message.streaming && message.input
          ? message.input + CURSOR_PLACEHOLDER
          : message.input;
      const { preparedContent: input, refElements: inputRefElements } =
        prepareContent({
          elements,
          id: message.id,
          content: inputContent,
          language:
            typeof message.showInput === 'string'
              ? message.showInput
              : undefined
        });

      inputMarkdown = (
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold leading-none tracking-tight">
            Input
          </div>
          <Markdown
            allowHtml={allowHtml}
            latex={latex}
            refElements={inputRefElements}
          >
            {input}
          </Markdown>
        </div>
      );
    }

    const markdownContent = (
      <div className="flex flex-col gap-4">
        {inputMarkdown}
        {outputMarkdown}
      </div>
    );

    return (
      <div className="message-content w-full flex flex-col gap-2">
        {!!inputMarkdown || output ? markdownContent : null}
        <InlinedElements elements={outputInlinedElements} />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.allowHtml === nextProps.allowHtml &&
      prevProps.latex === nextProps.latex &&
      prevProps.elements === nextProps.elements &&
      prevProps.isRunning === nextProps.isRunning &&
      prevProps.diffEnabled === nextProps.diffEnabled &&
      // isEqual(
      //   prevProps.sections ?? ['input', 'output'],
      //   nextProps.sections ?? ['input', 'output']
      // ) &&
      isEqual(
        getMessageRenderProps(prevProps.message),
        getMessageRenderProps(nextProps.message)
      )
    );
  }
);

export { MessageContent };
