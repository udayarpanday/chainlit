import type {
  FilePickerData,
} from '@/types';

import {
  Home,
  ChevronRight,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';
import { Input } from '@chainlit/app/src/components/ui/input';
import { useState } from 'react';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { Button } from '@chainlit/app/src/components/ui/button';
import { Translator } from '@chainlit/app/src/components/i18n';

type Props = {
  searchFiles: (query: string) => void;
  clearSearch: () => void;
  isLoading?: boolean;
  attachmentMode?: boolean;
  destinationMode?: boolean;
  singleMode?: boolean;
}

export default function FileSearch({
  isLoading = false,
  attachmentMode = false,
  destinationMode = false,
  singleMode = false,
  searchFiles = () => {},
  clearSearch = () => {},
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const clearSearchHandler = () => {
    clearSearch();
    setSearchQuery('');
  }

  return (
    <div className="relative flex-shrink-0">
      <form className="flex items-center" onSubmit={(e) => {e.preventDefault();searchFiles(searchQuery)}}>
        <Button type='button' size={(attachmentMode || destinationMode || singleMode) ? 'sm' : 'icon'} variant="ghost" onClick={clearSearchHandler} className='shrink-0 hover:text-primary hover:bg-transparent!'>
          <X />
        </Button>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('evoyaFiles.actions.search.label')}
          className={(attachmentMode || destinationMode || singleMode) ? 'text-xs h-9' : ''}
          readOnly={isLoading}
        />
        <Button
          type='submit'
          variant={attachmentMode ? "secondary" : "outline"}
          className={cn('ml-2', attachmentMode ? '' : 'text-[#7b809a] border-[#7b809a] hover:bg-[#7b809a]/10')}
          size={(attachmentMode || destinationMode || singleMode) ? 'sm' : 'default'}
          disabled={isLoading}
        >
          {isLoading ? 
            <LoaderCircle className={cn("animate-spin h-4 w-4", (!destinationMode && !attachmentMode && !singleMode) ? "mr-1" : "")} />
            : <Search className={cn('h-4 w-4', (!destinationMode && !attachmentMode && !singleMode) ? "mr-1" : "")} />
          }
          {(!destinationMode && !attachmentMode && !singleMode) &&<span>
            <Translator path="evoyaFiles.actions.search.label" />
          </span>}
        </Button> 
      </form>
    </div>
  );
}