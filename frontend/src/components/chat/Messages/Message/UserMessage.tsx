import { scrollToQuotedSelection } from '@/lib/quotedTextHighlight';
import { cn } from '@/lib/utils';
import { MessageContext } from 'contexts/MessageContext';
import { CornerDownRight } from 'lucide-react';
import { memo, useContext, useMemo, useState } from 'react';
import { useSetRecoilState } from 'recoil';

import {
  IMessageElement,
  IStep,
  messagesState,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';

import AutoResizeTextarea from '@/components/AutoResizeTextarea';
import { Pencil } from '@/components/icons/Pencil';
import { Button } from '@/components/ui/button';
import { Translator } from 'components/i18n';

import type { IQuotedSelection } from '@/state/chat';

import { InlinedElements } from './Content/InlinedElements';
import QuotableContent from './QuotableContent';

interface Props {
  message: IStep;
  elements: IMessageElement[];
}

const UserMessage = memo(function UserMessage({
  message,
  elements,
  children
}: React.PropsWithChildren<Props>) {
  const config = useConfig();
  const { askUser, loading } = useContext(MessageContext);
  const { editMessage } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);
  const disabled = loading || !!askUser;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const inlineElements = useMemo(() => {
    return elements.filter(
      (el) => el.forId === message.id && el.display === 'inline'
    );
  }, [message.id, elements]);

  const quotedSelection = message.metadata?.quotedSelection as
    IQuotedSelection | undefined;

  const isEditable = !!config.config?.features.edit_message;

  const handleEdit = () => {
    if (editValue) {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === message.id);
        if (index === -1) {
          return prev;
        }
        const slice = prev.slice(0, index + 1);
        slice[index].steps = [];
        return slice;
      });
      setIsEditing(false);
      editMessage({ ...message, output: editValue });
    }
  };
  return (
    <div className="flex flex-col w-full gap-1">
      <InlinedElements elements={inlineElements} className="items-end" />

      <div className="group flex w-full flex-row items-start gap-1">
        {!isEditing && isEditable && (
          <Button
            variant="ghost"
            size="icon"
            className="edit-message ml-auto invisible self-end group-hover:visible"
            onClick={() => {
              setEditValue(message.output);
              setIsEditing(true);
            }}
            disabled={disabled}
          >
            <Pencil />
          </Button>
        )}
        <div
          className={cn(
            'flex min-w-0 flex-col gap-1',
            isEditing ? 'w-full flex-grow' : 'w-fit max-w-[70%] flex-grow-0',
            isEditable ? '' : 'ml-auto'
          )}
        >
          {!isEditing && quotedSelection?.text ? (
            <button
              type="button"
              title={quotedSelection.text}
              onClick={(event) =>
                scrollToQuotedSelection(quotedSelection, event.currentTarget)
              }
              className="quoted-selection flex min-w-0 max-w-full items-center gap-2 self-start text-left text-sm text-muted-foreground hover:text-foreground"
            >
              <CornerDownRight className="size-4 shrink-0" />
              <span className="block min-w-0 truncate">
                {quotedSelection.text.replace(/\s+/g, ' ')}
              </span>
            </button>
          ) : null}

          <div
            className={cn(
              'relative rounded-3xl bg-accent px-5 py-2.5',
              inlineElements.length ? 'rounded-tr-lg' : '',
              isEditing ? 'w-full flex-grow' : 'w-fit max-w-full'
            )}
          >
            {isEditing ? (
              <div className="flex flex-col bg-accent">
                <AutoResizeTextarea
                  id="edit-chat-input"
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="mt-1 bg-transparent placeholder:text-base placeholder:font-medium text-base"
                  maxHeight={250}
                />
                <div className="flex justify-end gap-4">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    <Translator path="common.actions.cancel" />
                  </Button>
                  <Button
                    className="confirm-edit"
                    disabled={disabled}
                    onClick={handleEdit}
                  >
                    <Translator path="common.actions.confirm" />
                  </Button>
                </div>
              </div>
            ) : (
              <QuotableContent
                messageId={message.id}
                author={message.name}
                disabled={loading}
              >
                <div
                  className={`flex ${
                    message.command ? 'flex-col gap-1' : 'flex-col'
                  }`}
                >
                  {message.command ? (
                    <div className="command-span font-bold text-[#08f]">
                      {message.command}
                    </div>
                  ) : null}
                  {children}
                </div>
              </QuotableContent>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default UserMessage;
