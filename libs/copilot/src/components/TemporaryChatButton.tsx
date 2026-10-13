import { MessageCircleDashed } from 'lucide-react';
import { useContext } from 'react';
import { useRecoilValue } from 'recoil';

import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';
import { firstUserInteraction, useChatSession } from '@chainlit/react-client';

import { WidgetContext } from '../context';

export default function TemporaryChatButton() {
  const { evoya } = useContext(WidgetContext);
  const firstInteraction = useRecoilValue(firstUserInteraction);
  const { temporaryChat, setTemporaryChat } = useChatSession();
  const { t } = useTranslation();

  if (evoya?.type !== 'dashboard' || firstInteraction) return null;

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
                setTemporaryChat(!temporaryChat);
              }}
            >
              <MessageCircleDashed className="!size-5" />
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
