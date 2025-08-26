import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  audioConnectionState,
  isAiSpeakingState,
  wavRecorderState,
  wavStreamPlayerState
} from './state';
import { useChatInteract } from './useChatInteract';

const useAudio = () => {
  const [audioConnection, setAudioConnection] =
    useRecoilState(audioConnectionState);

  const wavRecorder = useRecoilValue(wavRecorderState);
  const wavStreamPlayer = useRecoilValue(wavStreamPlayerState);
  const isAiSpeaking = useRecoilValue(isAiSpeakingState);

  const { startAudioStream, endAudioStream,passAudioType } = useChatInteract();

  const startConversation = useCallback(async (type) => {
    
    await passAudioType(type)
    setAudioConnection('connecting');
    await startAudioStream();
  }, [startAudioStream]);

  const endConversation = useCallback(async (end=true) => {
    setAudioConnection('off');
    await wavRecorder.end();
    await wavStreamPlayer.interrupt();
    if (end) {
      endAudioStream();
    }
  }, [endAudioStream, wavRecorder, wavStreamPlayer]);

  return {
    startConversation,
    endConversation,
    audioConnection,
    isAiSpeaking,
    wavRecorder,
    wavStreamPlayer
  };
};

export { useAudio };
