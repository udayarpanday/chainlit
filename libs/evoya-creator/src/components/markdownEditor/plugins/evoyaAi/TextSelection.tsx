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

import { useEffect, useState } from "react";
import { getActiveEditor } from "lexical";

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
  const [scrollComp, setScrollComp] = useState(0);

  useEffect(() => {
    if (editorContainerRef) {
      const updateScrollOffset = () => {
        if (editorContainerRef) {
          setScrollComp(editorContainerRef.current?.scrollTop ?? 0);
        }
      }

      window.addEventListener('resize', updateScrollOffset, true);
      window.addEventListener('scroll', updateScrollOffset, true);
    }
  }, []);

  console.log("evoyaAiState", evoyaAiState)
  console.log("isFocus", isFocus)

  // console.log('evoyaAiState', evoyaAiState);
  if (isFocus) return null;
  if (!rootEditor) return null;
  if (!evoyaAiState) return null;
  if (viewMode !== 'rich-text') return null;

  const rectCompensation = 3.5;
  // const scrollCompensation = (evoyaAiState.scrollOffset ?? 0) - scrollOffset;
  const scrollCompensation = (evoyaAiState.scrollOffset ?? 0) - scrollComp;
  const theRect = evoyaAiState.rect;

  // const containerOffset = editorContainerRef?.current?.getBoundingClientRect().top;
  // const containerHeight = editorContainerRef?.current?.getBoundingClientRect().height;

  // const nodeRects = (evoyaAiState.lexical?.getNodes() ?? []).map((node) => {
  //   const domNode = rootEditor.getElementByKey(node.getKey());
  //   return {
  //     height: domNode?.offsetHeight,
  //     width: domNode?.offsetWidth,
  //     top: domNode?.offsetTop,
  //     left: domNode?.offsetLeft
  //   }
  // });

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
            // top: `${(rect?.top ?? 0) + 43}px`,
            // left: `${rect?.left ?? 0}px`,
            // width: `${rect?.width ?? 0}px`,
            // height: `${(rect?.height ?? 0)}px`
          }}
        ></div>
      ))}
    </>
  )

  return (
    <>
      {(evoyaAiState.rectangles ?? []).map((rect: DOMRect) => (
        <div
          style={{
            position: 'fixed',
            backgroundColor: 'highlight',
            zIndex: '-1',
            top: `${(rect?.top ?? 0) - rectCompensation + scrollCompensation}px`,
            left: `${rect?.left ?? 0}px`,
            width: `${rect?.width ?? 0}px`,
            height: `${(rect?.height ?? 0) + rectCompensation * 2}px`
          }}
        ></div>
      ))}
      {theRect && (
        <div
        style={{
          position: 'fixed',
          backgroundColor: 'highlight',
          zIndex: '-1',
          top: `${(theRect?.top ?? 0) - rectCompensation + scrollCompensation}px`,
          left: `${(theRect?.left ?? 0) - rectCompensation}px`,
          width: `${(theRect?.width ?? 0) + rectCompensation * 2}px`,
          height: `${(theRect?.height ?? 0) + rectCompensation * 2}px`
        }}
        ></div>
      )}
    </>
  )
}