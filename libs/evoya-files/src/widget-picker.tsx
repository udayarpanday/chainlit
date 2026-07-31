import { ExternalLink } from 'lucide-react';
import { useRef, useState } from 'react';

import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

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
  onSelectionChange
}: Props) {
  const { t } = useTranslation();
  const initialSelectionMap = () =>
    new Map(
      (initialSelections ?? []).map((selection) => {
        const path = selectionKey(selection.path);
        return [path, { ...selection, path }];
      })
    );
  const selectionsRef = useRef<Map<string, EvoyaFilesSelection>>(
    initialSelectionMap()
  );
  const [selections, setSelections] = useState(selectionsRef.current);
  const [currentPath, setCurrentPath] = useState(initialPath || '/');

  const changeSelection = (
    selection: EvoyaFilesSelection,
    checked: boolean
  ) => {
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
    changeSelection(
      {
        path: item.path,
        isFolder: !('size' in item)
      },
      checked
    );
  };

  const filesManagerUrl = new URL('/files/manage/', apiBaseUrl);
  filesManagerUrl.searchParams.set('path', currentPath);

  return (
    <FilePickerContext.Provider
      value={{
        apiBaseUrl,
        csrfToken,
        workspaceId,
        type: 'picker',
        brandColor
      }}
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="min-h-0 flex-1">
          <FilePicker
            initialPath={initialPath || '/'}
            multiselect
            selectedItemPaths={[...selections.keys()]}
            onItemSelectionChange={changeItemSelection}
            setSelectedPath={setCurrentPath}
            searchTrailingAction={
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="ml-2 p-5 border-[#7b809a] text-[#7b809a] hover:bg-[#7b809a]/10 hover:text-[#7b809a]"
                    >
                      <a
                        href={filesManagerUrl.toString()}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t(
                          'evoyaFiles.actions.open_in_file_manager.label'
                        )}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('evoyaFiles.actions.open_in_file_manager.label')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
          />
        </div>
      </div>
    </FilePickerContext.Provider>
  );
}
