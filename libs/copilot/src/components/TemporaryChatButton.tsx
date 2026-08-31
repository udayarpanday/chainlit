import { MessageCircleDashed } from 'lucide-react';
import { useRecoilValue } from 'recoil';

import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';
import {
  firstUserInteraction,
  useChatInteract,
  useChatSession
} from '@chainlit/react-client';

export default function TemporaryChatButton() {
  const firstInteraction = useRecoilValue(firstUserInteraction);
  const { temporaryChat, setTemporaryChat } = useChatSession();
  const { clear } = useChatInteract();
  const { t } = useTranslation();

  if (firstInteraction) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              id="temporary-chat-button"
              size="icon"
              variant="ghost"
              aria-label={t('chat.temporary.title')}
              aria-pressed={temporaryChat}
              className={
                temporaryChat
                  ? 'bg-muted text-foreground hover:text-foreground'
                  : 'text-muted-foreground hover:text-muted-foreground'
              }
              onClick={() => {
                clear();
                setTemporaryChat(!temporaryChat);
              }}
            >
              <MessageCircleDashed className="!size-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('chat.temporary.title')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
