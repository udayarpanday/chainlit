import { cn } from '@/lib/utils';
import { WidgetContext } from 'context';
import { Check, X, Clock, Mic } from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { sttModelState, useAudio, useConfig } from '@chainlit/react-client';

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
  onDictationStart: () => void;
  onDictationCancel: () => void;
}

const VoiceButton = ({ disabled, onDictationStart, onDictationCancel }: Props) => {
  const { config } = useConfig();
  const sttModel = useRecoilValue(sttModelState);
  const { evoya } = useContext(WidgetContext);
  console.log(evoya, 'evoya');
  const { startConversation, endConversation, audioConnection } = useAudio();
  const [modalityType, setModalityType] = useState<
    'realtime' | 'speech' | null
  >(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(480);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const isEnabled = !!config?.features.audio.enabled;
  const isLive = (sttModel?.model || sttModel?.name || '')
    .toLowerCase()
    .includes('voxtral');
  const isAudioOn = audioConnection === 'on';
  const isAudioOff = audioConnection === 'off';
  const isConnecting = audioConnection === 'connecting';
  const confirmingRef = useRef(false);
  const confirmTranscription = useCallback(() => {
    if (disabled || confirmingRef.current) return;
    confirmingRef.current = true;
    setTimerActive(false);
    // The server applies the user's transcription submission preference.
    // Sending the editor draft here bypasses that preference for live models.
    void endConversation();
  }, [disabled, endConversation]);

  useEffect(() => {
    if (!isAudioOn) confirmingRef.current = false;
  }, [isAudioOn]);

  useEffect(() => {
    if (!isEnabled || !isAudioOn || modalityType !== 'speech' || disabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.isComposing || event.keyCode === 229 ||
        event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ||
        event.key !== 'Enter'
      ) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) confirmTranscription();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isEnabled, isAudioOn, modalityType, disabled, confirmTranscription]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isAudioOn && modalityType === 'speech' && timerActive && !isLive) {
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
  }, [isAudioOn, modalityType, timerActive, endConversation, isLive]);

  if (!isEnabled) return null;

  const handleToggle = (mode: 'realtime' | 'speech') => {
    if (isAudioOn) {
      setModalityType(null);
      setTimerActive(false);
      endConversation();
    } else if (isAudioOff) {
      onDictationStart();
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
            role={isLive ? 'status' : undefined}
            aria-label={isLive ? 'Live transcription is recording' : undefined}
            className={cn(
              'flex items-center border text-xs font-medium transition-colors',
              isLive
                ? 'gap-2 rounded-full border-red-200 bg-white px-2.5 py-1 text-red-700'
                : cn('gap-1 rounded-md bg-muted/50 px-2 py-1 tabular-nums', getTimerColor(timeRemaining)),
              !isLive && timeRemaining < 60 &&
                'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
            )}
          >
            {isLive ? (
              <span aria-hidden="true" className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full rounded-full bg-red-500 opacity-40 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500 dark:bg-red-400" />
              </span>
            ) : (
              <Clock className="size-3 mr-1" />
            )}
            <span>{isLive ? 'Live' : formatTime(timeRemaining)}</span>
          </div>
        </>
      )}
      {isAudioOn ? (
        <>
          {!isLive && <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={disabled}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted"
                  aria-label="Cancel transcription"
                  onClick={() => {
                    onDictationCancel();
                    endConversation(!(modalityType === 'speech'));
                  }}
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
          </TooltipProvider>}
          {modalityType === 'speech' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted"
                    onClick={confirmTranscription}
                    aria-label="Confirm transcription"
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
          {isConnecting && <Loader className="!size-5" />}
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
                    onMouseDown={(event) => event.preventDefault()}
                    aria-label="Start dictation"
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
