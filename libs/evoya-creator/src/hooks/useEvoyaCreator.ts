import {
  useContext,
} from 'react';
import {
  useRecoilValue,
  useSetRecoilState
} from 'recoil';

import {
  creatorActiveState,
  creatorContentState,
  creatorTypeState,
  creatorMessageState,
  creatorFileState,
} from '@/state';

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
  
  const openCreatorWithFile = (file: { path: string; name: string; mime: string; }, openConfig: any) => {
    window.dispatchEvent(new CustomEvent('open-evoya-creator', { detail: { config: openConfig }}));
    setCreatorType(openConfig.type ?? 'markdown');
    setFileInfo(file);

    fetch(`${config.apiBaseUrl}/api/files/download/?path=${file.path}`).then(async (response) => {
      const text = await response.text();
      setCreatorContent(text);
      // @ts-expect-error is not a valid prop
      if (window.setEvoyaCreatorContent) {
        // @ts-expect-error is not a valid prop
        window.setEvoyaCreatorContent(text)
      }
      window.dispatchEvent(new CustomEvent('enable-creator-mode'));
      setActive(true);
      // @ts-expect-error is not a valid prop
      window.evoyaCreatorEnabled = true;
    })
  }

  const saveCreatorContent = async () => {
    if (!fileInfo || !config) return;
    const blob = new Blob([creatorContent], {
      type: fileInfo?.mime,
    });
    const newFile = new File([blob as BlobPart], fileInfo?.name ?? 'file');
    try {
      const data = new FormData();
      const filePath = fileInfo.path.split('/');
      filePath.pop();
      data.append('file', newFile)
      data.append('path', filePath.join('/') + "/")
      const response = await fetch(`${config.apiBaseUrl}/api/files/upload/`, {
        method: 'POST',
        body: data,
        headers: {
          'X-CSRFToken': config.csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        toast.success('File saved!');
      } else {
        toast.error('Failed to save file!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to save file!')
    }
  }

  const closeCreatorOverlay = () => {
    window.dispatchEvent(new CustomEvent('disable-creator-mode'));
    setActive(false);
    // @ts-expect-error is not a valid prop
    window.evoyaCreatorEnabled = false;
  }
  
  return {
    enabled: config?.enabled ?? false,
    fileInfo,
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