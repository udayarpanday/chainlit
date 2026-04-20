import { FileSpec, useConfig } from '@chainlit/react-client';

import { Translator } from '@/components/i18n';
import { PaperClip } from '@/components/icons/PaperClip';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Monitor,
  Cloud,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { useUpload } from '@/hooks/useUpload';
import FilePicker from '@evoya/file-picker/src/components/FilePicker';
import { FilePickerItem as FilePickerItemType } from '@evoya/file-picker/src/types';
import { useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { EvoyaAttachment, evoyaAttachmentsState } from 'state/evoya';
import { v4 as uuidv4 } from 'uuid';

interface UploadButtonProps {
  disabled?: boolean;
  fileSpec: FileSpec;
  onFileUpload: (files: File[]) => void;
  onFileUploadError: (error: string) => void;
}

export const UploadButton = ({
  disabled = false,
  fileSpec,
  onFileUpload,
  onFileUploadError
}: UploadButtonProps) => {
  const { config } = useConfig();
  const upload = useUpload({
    spec: fileSpec,
    onResolved: (payloads: File[]) => onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: true }
  });

  const [evoyaAttachments, setEvoyaAttachments] = useRecoilState(evoyaAttachmentsState);
  const [filesOpen, setFilesOpen] = useState(false);
  const [cloudAttachments, setCloudAttachments] = useState<FilePickerItemType[]>([]);

  const attachFiles = () => {
    console.log(cloudAttachments);
    const attachements: EvoyaAttachment[] = cloudAttachments.map((item) => {
      const id = uuidv4();
      return {
        id,
        path: item.path,
        name: item.name,
        type: "size" in item ? item.mime : 'directory',
        remove: () => {
          setEvoyaAttachments((prev) =>
            prev.filter((attachment) => attachment.id !== id)
          );
        }
      }
    })
    setEvoyaAttachments((prev) => prev.concat(attachements));
    setFilesOpen(false);
  }

  if (!upload) return null;
  const { getRootProps, getInputProps } = upload;

  if (!config?.features.spontaneous_file_upload?.enabled) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  id="file-menu-toggle"
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted"
                  disabled={disabled}
                >
                  <PaperClip className="!size-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <input
                    id="upload-button-input"
                    className="hidden"
                    {...getInputProps()}
                  />
                  <div className="flex items-center gap-2" {...getRootProps()}>
                    <div className="rounded-md bg-muted p-2">
                      <Monitor className="!w-5 !h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span>
                        <Translator path="evoyaFiles.actions.upload.label" />
                      </span>
                      <span className="text-xs text-gray-400">
                        <Translator path="evoyaFiles.actions.upload.description" />
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilesOpen(true)}>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-muted p-2">
                      <Cloud className="!w-5 !h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span>
                        <Translator path="evoyaFiles.actions.attachments.label" />
                      </span>
                      <span className="text-xs text-gray-400">
                        <Translator path="evoyaFiles.actions.attachments.description" />
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </TooltipTrigger>
        <Dialog
          open={filesOpen}
          onOpenChange={setFilesOpen}
        >
          <DialogContent className="z-[9999] max-w-screen-sm">
            <DialogHeader>
              <DialogTitle>
                <Translator path="evoyaFiles.actions.attachments.title" />
              </DialogTitle>
            </DialogHeader>
            <div>
              <FilePicker 
                initialPath='/'
                selectedItemsChange={(items) => setCloudAttachments(items)}
                multiselect
                attachmentMode
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setFilesOpen(false)}>
                <Translator path="common.actions.cancel" />
              </Button>
              <Button onClick={attachFiles} disabled={cloudAttachments.length === 0}>
                <Translator path="common.actions.confirm" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <TooltipContent>
          <p>
            <Translator path="chat.input.actions.attachFiles" />
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UploadButton;
