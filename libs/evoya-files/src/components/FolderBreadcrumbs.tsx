import type {
  FilePickerData,
} from '@/types';

import {
  Home,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';

type Props = {
  fetchDirectory: (path: string) => void;
  isLoading: boolean;
  attachmentMode: boolean;
  destinationMode: boolean;
  pathData: FilePickerData;
}

export default function FolderBreadcrumbs({
  pathData,
  isLoading = false,
  attachmentMode,
  destinationMode,
  fetchDirectory = () => {},
}: Props) {

  return (
    <div className={cn("flex items-center mb-4", (attachmentMode || destinationMode) ? 'text-xs' : 'text-sm')}>
      {pathData.path.length > 0 && pathData.path.map((item, index) => (
        <>
          {index > 0 && (
            <div className={(attachmentMode || destinationMode) ? 'px-1' : 'px-2'}>
              <ChevronRight className={cn((attachmentMode || destinationMode) ? 'h-3 w-3' : 'h-4 w-4', 'text-gray-400')} />
            </div>
          )}
          <div
            className={cn(
              'flex items-center',
              item.path ? 'hover:text-foreground transition-colors cursor-pointer' : '',
              index < pathData.path.length - 1 ? 'text-gray-400' : ''
            )}
            onClick={() => item.path && fetchDirectory(item.path)}
          >
            {index === 0 && <Home className={(attachmentMode || destinationMode) ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} />}
            <span>{item.name}</span>
          </div>
        </>
      ))}
      {(pathData.path.length === 0) && (
        <>
          <div className={cn('flex items-center','hover:text-foreground transition-colors cursor-pointer', 'text-gray-400')}>
            <Home className={(attachmentMode || destinationMode) ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} />
            <span>Home</span>
          </div>
          {/* <div className={(attachmentMode || destinationMode) ? 'px-1' : 'px-2'}>
            <ChevronRight className={cn((attachmentMode || destinationMode) ? 'h-3 w-3' : 'h-4 w-4', 'text-gray-400')} />
          </div>
          <div className={cn('flex items-center')}>
            <LoaderCircle className={cn("animate-spin", (attachmentMode || destinationMode) ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2')} />
          </div> */}
        </>
      )}
      {isLoading && (
        <>
          <div className={cn('flex items-center ml-4')}>
            <LoaderCircle className={cn("animate-spin", (attachmentMode || destinationMode) ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2')} />
          </div>
        </>
      )}
    </div>
  );
}