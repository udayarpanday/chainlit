import { useRef, useState } from 'react';

import { Button } from '@chainlit/app/src/components/ui/button';
import { ExternalLink, X } from 'lucide-react';

import FilePicker from './components/FilePicker';
import { FilePickerContext } from './context/file-context';
import { FilePickerItem } from './types';

export type EvoyaFilesSelection = {
  path: string;
  isFolder: boolean;
};

const selectionKey = (path: string) => path.replace(/^\/+|\/+$/g, '');

interface Props {
  initialPath: string;
  apiBaseUrl: string;
  csrfToken: string;
  workspaceId?: string;
  brandColor?: string | null;
  initialSelections?: EvoyaFilesSelection[];
  onSelectionChange?: (selections: EvoyaFilesSelection[]) => void;
}

export default function WidgetPicker({
  initialPath,
  apiBaseUrl,
  csrfToken,
  workspaceId,
  brandColor,
  initialSelections,
  onSelectionChange,
}: Props) {
  const initialSelectionMap = () => new Map(
    (initialSelections ?? []).map((selection) => {
      const path = selectionKey(selection.path);
      return [path, { ...selection, path }];
    })
  );
  const selectionsRef = useRef<Map<string, EvoyaFilesSelection>>(initialSelectionMap());
  const [selections, setSelections] = useState(selectionsRef.current);
  const [currentPath, setCurrentPath] = useState(initialPath || '/');

  const changeSelection = (selection: EvoyaFilesSelection, checked: boolean) => {
    const next = new Map(selectionsRef.current);
    const path = selectionKey(selection.path);
    if (checked) {
      if (selection.isFolder) {
        for (const key of next.keys()) {
          if (key.startsWith(`${path}/`)) {
            next.delete(key);
          }
        }
      }
      next.set(path, { ...selection, path });
    } else {
      next.delete(path);
    }

    selectionsRef.current = next;
    setSelections(next);
    onSelectionChange?.([...next.values()]);
  };

  const changeItemSelection = (item: FilePickerItem, checked: boolean) => {
    changeSelection({
      path: item.path,
      isFolder: !("size" in item),
    }, checked);
  };

  const clearSelections = () => {
    const next = new Map<string, EvoyaFilesSelection>();
    selectionsRef.current = next;
    setSelections(next);
    onSelectionChange?.([]);
  };

  const filesManagerUrl = new URL('/files/manage/', apiBaseUrl);
  filesManagerUrl.searchParams.set('path', currentPath);

  return (
    <FilePickerContext.Provider value={{
      apiBaseUrl,
      csrfToken,
      workspaceId,
      type: 'picker',
      brandColor,
    }}>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="min-h-0 flex-1">
          <FilePicker
            initialPath={initialPath || '/'}
            multiselect
            selectedItemPaths={[...selections.keys()]}
            onItemSelectionChange={changeItemSelection}
            setSelectedPath={setCurrentPath}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline">
            <a href={filesManagerUrl.toString()} target="_blank" rel="noreferrer">
              <ExternalLink />
              Open in Files manager
            </a>
          </Button>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
            onClick={clearSelections}
            disabled={selections.size === 0}
          >
            <X />
            Clear selected
          </Button>
        </div>
      </div>
    </FilePickerContext.Provider>
  );
}
