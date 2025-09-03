import { cn } from '@/lib/utils';
import { WidgetContext } from 'context';
import { Check, X, Clock, Mic } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';

import { useAudio, useConfig } from '@chainlit/react-client';

import AudioPresence from '@/components/AudioPresence';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

import { Loader } from '../../Loader';
import { VoiceLines } from '../../icons/VoiceLines';
import { Button } from '../../ui/button';

interface Props {
  disabled?: boolean;
}

const VoiceButton = ({ disabled }: Props) => {
  const { config } = useConfig();
  const { evoya } = useContext(WidgetContext);
  const { startConversation, endConversation, audioConnection } = useAudio();
  const [modalityType, setModalityType] = useState<
    'realtime' | 'speech' | null
  >(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(480);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const isEnabled = !!config?.features.audio.enabled;
  const isAudioOn = audioConnection === 'on';
  const isAudioOff = audioConnection === 'off';
  const isConnecting = audioConnection === 'connecting';

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isAudioOn && modalityType === 'speech' && timerActive) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            endConversation();
            setTimerActive(false);
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isAudioOn || modalityType !== 'speech') {
      setTimeRemaining(480);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAudioOn, modalityType, timerActive, endConversation]);

  if (!isEnabled) return null;

  const handleToggle = (mode: 'realtime' | 'speech') => {
    if (isAudioOn) {
      setModalityType(null);
      setTimerActive(false);
      endConversation();
    } else if (isAudioOff) {
      setModalityType(mode);
      if (mode === 'speech') {
        setTimeRemaining(480);
        setTimerActive(true);
      }
      startConversation(mode);
    }
  };

  const getTimerColor = (seconds: number) => {
    if (seconds < 60) return 'text-red-500';
    return 'text-muted-foreground';
  };
  return (
    <div className="flex items-center gap-1">
      {isAudioOn && (
        <AudioPresence
          type="client"
          height={18}
          width={36}
          barCount={4}
          barSpacing={2}
        />
      )}
      {isAudioOn && modalityType === 'speech' && (
        <>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
              'bg-muted/50 border',
              getTimerColor(timeRemaining),
              timeRemaining < 60 &&
                'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
            )}
          >
            <Clock className="size-3 mr-1" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </>
      )}
      {isAudioOn ? (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={disabled}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted"
                  onClick={() => endConversation(!(modalityType === 'speech'))}
                >
                  <X className="!size-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  <Translator path={'chat.speech.stop'} />
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {modalityType === 'speech' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted"
                    onClick={endConversation}
                  >
                    <Check className="!size-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    <Translator path={'chat.speech.submit'} />
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      ) : (
        <>
          {/* {evoya && evoya.type == 'dashboard' ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted"
                    onClick={() => handleToggle('realtime')}
                  >
                    {isAudioOff && <VoiceLines className="!size-6" />}
                    {isConnecting && <Loader className="!size-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    <Translator
                      path={
                        isAudioOn
                          ? 'chat.speech.stop'
                          : isAudioOff
                          ? 'chat.speech.voiceMode'
                          : 'chat.speech.connecting'
                      }
                    />
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null} */}

          {/* Speech Mode Button */}
          {isAudioOff && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted"
                    onClick={() => handleToggle('speech')}
                  >
                    <Mic className="!size-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    <Translator
                      path={
                        isAudioOn
                          ? 'chat.speech.stop'
                          : isAudioOff
                          ? 'chat.speech.speechText'
                          : 'chat.speech.connecting'
                      }
                    />
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      )}
    </div>
  );
};

export default VoiceButton;
