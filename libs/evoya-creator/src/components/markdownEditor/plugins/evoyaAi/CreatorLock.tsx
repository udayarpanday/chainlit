import {
  inFocus$,
  readOnly$,
} from "@mdxeditor/editor";

import {
  useCellValues,
} from "@mdxeditor/gurx";

import {
  evoyaAiState$,
  scrollOffset$,
  editorContainerRef$,
} from './index';

import { useEffect, useState } from "react";

export const CreatorLock = () => {
  const [
    readOnly
  ] = useCellValues(
    readOnly$
  );

  if (!readOnly) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,.2)'
    }}>

    </div>
  )
}