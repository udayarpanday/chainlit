import {
  documentDisplayName,
  documentKind,
  safeDocumentUrl
} from '@/lib/documentPreview';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  IImageElement,
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal
} from '@/components/ui/dialog';

import { DocumentCard } from './DocumentCard';

const ImageElement = ({ element }: { element: IImageElement }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const setSideView = useSetRecoilState(sideViewState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const supported =
    documentKind(element) === 'image' && !!safeDocumentUrl(element.url);
  useEffect(() => setThumbnailFailed(false), [element.url]);

  if (!element.url) return null;
  if (creatorEnabled)
    return safeDocumentUrl(element.url) ? (
      <DocumentCard element={element} />
    ) : (
      <img className="max-w-full h-auto" src={element.url} alt={element.name} />
    );
  if (supported && (element.display !== 'inline' || thumbnailFailed))
    return <DocumentCard element={element} />;

  const handleClick = () => {
    if (supported) {
      setSideView({
        title: documentDisplayName(element),
        elements: [element],
        key: 'document-preview'
      });
      return;
    }
    setLightboxOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className="block w-full rounded-sm bg-accent overflow-hidden"
        onClick={handleClick}
        aria-label={`Preview ${element.name}`}
      >
        <img
          className={cn(
            'mx-auto block max-w-full h-auto',
            element.display === 'inline' && 'cursor-pointer',
            `${element.display}-image`
          )}
          src={element.url}
          alt={element.name}
          loading="lazy"
          onError={supported ? () => setThumbnailFailed(true) : undefined}
        />
      </button>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/80" />
          <DialogContent className="border-none bg-transparent shadow-none max-w-none p-0 max-h-screen overflow-auto [&>button]:hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close lightbox"
              >
                <X className="h-6 w-6" />
              </button>

              <img
                src={element.url}
                alt={element.name}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
};

export { ImageElement };
