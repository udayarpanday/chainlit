import {
  inFocus$,
  rootEditor$,
  viewMode$,
} from "@mdxeditor/editor";

import {
  useCellValues,
} from "@mdxeditor/gurx";

import {
  evoyaAiState$,
  scrollOffset$,
  editorContainerRef$,
} from './index';

export const TextSelection = () => {
  const [
    evoyaAiState,
    scrollOffset,
    editorContainerRef,
    isFocus,
    viewMode,
    rootEditor,
  ] = useCellValues(
    evoyaAiState$,
    scrollOffset$,
    editorContainerRef$,
    inFocus$,
    viewMode$,
    rootEditor$,
  );

  if (!rootEditor) return null;
  if (!evoyaAiState) return null;
  if (viewMode !== 'rich-text') return null;
  console.log("evoyaAiState", evoyaAiState)
  if (isFocus) return null;

  const rectCompensation = 3.5;

  return (
    <>
      {(evoyaAiState.rectangles ?? []).map((rect) => (
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'highlight',
            zIndex: '-1',
            top: `${(rect?.top ?? 0) + 43 - rectCompensation}px`,
            left: `${(rect?.left ?? 0) - rectCompensation}px`,
            width: `${(rect?.width ?? 0) + rectCompensation * 2}px`,
            height: `${(rect?.height ?? 0) + rectCompensation * 2}px`
          }}
        ></div>
      ))}
    </>
  )
}