import {
  useEffect,
  useMemo,
} from 'react';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import MarkdownEditor from './markdownEditor';

import CreatorHeader from './CreatorHeader';

export default function CreatorFrame() {
  const {
    active,
    creatorType,
    openCreatorWithContent,
    openCreatorWithFile,
  } = useEvoyaCreator();

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreator = openCreatorWithContent;
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreatorWithFile = openCreatorWithFile;
  }, [openCreatorWithContent, openCreatorWithFile]);

  const CreatorRenderer = useMemo(() => {
    switch(creatorType.toLowerCase()) {
      default:
      case 'markdown':
        return <MarkdownEditor />
      case 'vega':
        return <MarkdownEditor />
    }
  }, [creatorType]);

  if (!active) {
    return null;
  }

  return (
    <div className="overflow-hidden h-full flex flex-col">
      <CreatorHeader />
      {CreatorRenderer}
    </div>
  );
}