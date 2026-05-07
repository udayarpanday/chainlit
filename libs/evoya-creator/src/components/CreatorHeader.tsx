import { Button } from '@chainlit/app/src/components/ui/button';
import { X } from 'lucide-react';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';

const CreatorHeader = (): JSX.Element => {
  const {
    closeCreatorOverlay,
    fileInfo,
  } = useEvoyaCreator();

  const handleCloseCreator = () => {
    document.getElementById('copilot-embedded-container')?.appendChild(window.cl_shadowRootElement_container)
    closeCreatorOverlay();
  };

  return (
    <div className="!py-4 pl-2 pr-3 flex items-center justify-between header-bar border-b">
      <div className="font-bold">
        <span>Creator</span>
        {fileInfo && (
          <>
            <span className='px-2'>-</span>
            <span>{fileInfo.name}</span>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={handleCloseCreator} className="!w-9 rounded-full">
          <X />
        </Button>
      </div>
    </div>
  )
};

export default CreatorHeader;
