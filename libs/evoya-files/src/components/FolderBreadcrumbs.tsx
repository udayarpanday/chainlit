import type {
  FilePickerData,
} from '@/types';

import {
  Home,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

type Props = {
  fetchDirectory: (path: string) => void;
  isLoading: boolean;
  attachmentMode: boolean;
  destinationMode: boolean;
  compact?: boolean;
  singleMode?: boolean;
  isSearch?: boolean;
  pathData: FilePickerData;
}

export default function FolderBreadcrumbs({
  pathData,
  isLoading = false,
  isSearch = false,
  compact = false,
  attachmentMode,
  destinationMode,
  singleMode = false,
  fetchDirectory = () => {},
}: Props) {
  const renderCompact = attachmentMode || destinationMode || singleMode || compact;

  return (
    <div className={cn("flex items-center overflow-hidden", renderCompact ? 'text-xs' : 'text-sm')}>
      <TooltipProvider delayDuration={100}>
        {!isSearch && pathData.path.length > 0 && pathData.path.map((item, index) => (
          <>
            {index > 0 && (
              <div className={renderCompact ? 'px-1' : 'px-2'}>
                <ChevronRight className={cn(renderCompact ? 'h-2 w-2' : 'h-4 w-4', 'text-gray-400')} />
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-center overflow-hidden',
                    item.path ? 'hover:text-foreground transition-colors cursor-pointer' : '',
                    (index < pathData.path.length - 1 || isSearch) ? 'text-gray-400' : '',
                    (index === pathData.path.length - 1) ? 'flex-shrink-0' : ''
                  )}
                  onClick={() => item.path && fetchDirectory(item.path)}
                >
                  {index === 0 && <Home className={renderCompact ? 'h-3 w-3 mr-1 flex-shrink-0' : 'h-4 w-4 mr-2 flex-shrink-0'} />}
                  <span className='overflow-hidden overflow-ellipsis'>{item.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {item.name}
                </p>
              </TooltipContent>
            </Tooltip>
          </>
        ))}
        {(pathData.path.length === 0) && (
          <>
            <div className={cn('flex items-center','hover:text-foreground transition-colors cursor-pointer', 'text-gray-400')}>
              <Home className={renderCompact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} />
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
        {isSearch && (
          <>
            <div className={cn('flex items-center','hover:text-foreground transition-colors cursor-pointer', 'text-gray-400')}>
              <Home className={renderCompact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} />
              <span>Home</span>
            </div>
            <div className={renderCompact ? 'px-1' : 'px-2'}>
              <ChevronRight className={cn(renderCompact ? 'h-3 w-3' : 'h-4 w-4', 'text-gray-400')} />
            </div>
            <div className='flex items-center'>
              <span>Search Results</span>
            </div>
          </>
        )}
        {isLoading && (
          <>
            <div className={cn('flex items-center ml-4')}>
              <LoaderCircle className={cn("animate-spin", renderCompact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2')} />
            </div>
          </>
        )}
      </TooltipProvider>
    </div>
  );
}