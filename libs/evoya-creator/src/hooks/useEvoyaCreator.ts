import {
  useMemo,
  useCallback,
  useContext,
} from 'react';
import {
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';

import {
  creatorActiveState,
  creatorContentState,
  creatorTypeState,
  creatorMessageState,
  creatorFileState,
} from '@/state';

// import { EvoyaConfig } from 'evoya/types';
import { WidgetContext } from '@/context';

import type { IStep } from 'client-types/';

import { toast } from 'sonner';

export default function useEvoyaCreator() {
  const { config } = useContext(WidgetContext);
  const active = useRecoilValue(creatorActiveState);
  const setActive = useSetRecoilState(creatorActiveState);
  const fileInfo = useRecoilValue(creatorFileState);
  const setFileInfo = useSetRecoilState(creatorFileState);
  const creatorType = useRecoilValue(creatorTypeState);
  const setCreatorType = useSetRecoilState(creatorTypeState);
  const creatorContent = useRecoilValue(creatorContentState);
  const setCreatorContent = useSetRecoilState(creatorContentState);
  const creatorMessage = useRecoilValue(creatorMessageState);
  const setCreatorMessage = useSetRecoilState(creatorMessageState);

  const openCreatorWithContent = (message: IStep, openConfig: any) => {
    window.dispatchEvent(new CustomEvent('open-evoya-creator', { detail: { config: openConfig }}));
    setCreatorType(openConfig.type ?? 'markdown');
    setCreatorMessage(message);
    setCreatorContent(message.output);
    window.dispatchEvent(new CustomEvent('enable-creator-mode'));
    setActive(true);
    // @ts-expect-error is not a valid prop
    window.evoyaCreatorEnabled = true;
  }
  
  const openCreatorWithFile = (file: { path: string; name: string; }, openConfig: any) => {
    window.dispatchEvent(new CustomEvent('open-evoya-creator', { detail: { config: openConfig }}));
    setCreatorType(openConfig.type ?? 'markdown');
    setFileInfo(file);

    fetch(`${config.apiBaseUrl}${file.path}`).then(async (response) => {
      const text = await response.text();
    
      setCreatorContent(text);
      window.dispatchEvent(new CustomEvent('enable-creator-mode'));
      setActive(true);
      // @ts-expect-error is not a valid prop
      window.evoyaCreatorEnabled = true;
    })
  }

  const saveCreatorContent = () => {
    fetch(`${config.apiBaseUrl}${fileInfo.path}`, {
      method: 'POST',
      body: JSON.stringify({ content: creatorContent })
    }).then((response) => {
      toast.success('File saved!')
    }).catch((err) => {
      toast.error('Failed to save file!')
    })
  }

  const closeCreatorOverlay = () => {
    window.dispatchEvent(new CustomEvent('disable-creator-mode'));
    setActive(false);
    // @ts-expect-error is not a valid prop
    window.evoyaCreatorEnabled = false;
  }
  
  return {
    enabled: config?.enabled ?? false,
    creatorType,
    active,
    setActive,
    creatorContent,
    setCreatorContent,
    creatorMessage,
    setCreatorMessage,
    openCreatorWithContent,
    openCreatorWithFile,
    saveCreatorContent,
    closeCreatorOverlay,
  };
}