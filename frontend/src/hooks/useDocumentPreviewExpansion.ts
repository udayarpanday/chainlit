import { useLayoutEffect, useRef, useState } from 'react';
import type { ImperativePanelGroupHandle } from 'react-resizable-panels';

export function useDocumentPreviewExpansion(active: boolean, docked: boolean) {
  const groupRef = useRef<ImperativePanelGroupHandle>(null);
  const previousLayout = useRef<number[]>();
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    if (!active) {
      setExpanded(false);
      previousLayout.current = undefined;
      return;
    }
    if (!docked || !groupRef.current) return;
    if (expanded) {
      previousLayout.current ??= groupRef.current.getLayout();
      groupRef.current.setLayout([0, 100]);
    } else if (previousLayout.current) {
      const layout = previousLayout.current;
      previousLayout.current = undefined;
      groupRef.current.setLayout(layout);
    }
  }, [active, docked, expanded]);

  return {
    groupRef,
    expanded,
    toggleExpanded: () => setExpanded((value) => !value)
  };
}
