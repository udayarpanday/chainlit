import { useState } from "react";
import { X, Mic } from "lucide-react";

import { useAudio, useConfig } from "@chainlit/react-client";

import AudioPresence from "@/components/AudioPresence";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Translator } from "components/i18n";

import { Loader } from "../../Loader";
import { VoiceLines } from "../../icons/VoiceLines";
import { Button } from "../../ui/button";

interface Props {
  disabled?: boolean;
}

const VoiceButton = ({ disabled }: Props) => {
  const { config } = useConfig();
  const { startConversation, endConversation, audioConnection } = useAudio();
  const [modalityType, setModalityType] = useState<"realtime" | "speech" | null>(null);

  const isEnabled = !!config?.features.audio.enabled;
  const isAudioOn = audioConnection === "on";
  const isAudioOff = audioConnection === "off";
  const isConnecting = audioConnection === "connecting";

  if (!isEnabled) return null;

  const handleToggle = (mode: "realtime" | "speech") => {
    if (isAudioOn) {
      setModalityType(null);
      endConversation();
    } else if (isAudioOff) {
      setModalityType(mode);
      startConversation(mode);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {isAudioOn && <AudioPresence type="client" height={18} width={36} barCount={4} barSpacing={2} />}
      
      {isAudioOn ? (
        <Button disabled={disabled} variant="ghost" size="icon" className="hover:bg-muted" onClick={endConversation}>
          <X className="!size-5" />
        </Button>
      ) : (
        <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted"
                    onClick={() => handleToggle("realtime")}
                  >
                    {isAudioOff && <VoiceLines className="!size-6" />}
                    {isConnecting && <Loader className="!size-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    <Translator
                      path={isAudioOn ? "chat.speech.stop" : isAudioOff ? "chat.speech.voiceMode" : "chat.speech.connecting"}
                    />
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          {/* Speech Mode Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted"
                    onClick={() => handleToggle("speech")}
                  >
                    {isAudioOff && <Mic className="!size-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    <Translator
                      path={isAudioOn ? "chat.speech.stop" : isAudioOff ? "chat.speech.speechText" : "chat.speech.connecting"}
                    />
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </>
      )}
    </div>
  );
};

export default VoiceButton;
