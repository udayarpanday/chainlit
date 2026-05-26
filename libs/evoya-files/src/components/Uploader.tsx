import {
  useContext,
  useState,
} from 'react';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

import { toast } from '@chainlit/app/src/lib/evoya-toast';

import {
  Upload,
  FolderPlus,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';
import { FilePickerContext } from '../context/file-context';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@chainlit/app/src/components/ui/dialog';

import { useUpload } from '@chainlit/app/src/hooks/useUpload';

import { Input } from '@chainlit/app/src/components/ui/input';

type Props = {
  currentPath: string;
  isLoading: boolean;
  onFileUpload: (file: File) => void;
  setIsLoading: (value: boolean) => void;
  loadCurrentPath: () => void;
}

export default function Uploader({
  currentPath,
  isLoading,
  setIsLoading,
  onFileUpload,
  loadCurrentPath,
}: Props) {
  const { apiBaseUrl, csrfToken, projectId, type } = useContext(FilePickerContext);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const createFolder = async () => {
    setNewFolderOpen(false);
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/files/create-directory/`, {
        method: 'POST',
        body: JSON.stringify({
          path: currentPath,
          name: newFolderName
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        toast.success('Folder created!');
        loadCurrentPath();
      } else {
        toast.error('Failed to create folder!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to create folder!');
    } finally {
      setIsLoading(false);
    }
  }

  const onFileUploadError = () => {}

  const fileSpec = {
    max_size_mb: 500,
    max_files: 20,
    accept: ['*/*']
  };

  const upload2 = useUpload({
    spec: fileSpec,
    onResolved: (payloads: File[]) => onFileUpload(payloads[0]),
    onError: onFileUploadError,
    options: { noDrag: false, multiple: false }
  });

  return (
    <>
      {(projectId && type !== 'compact') && (
        <div className='mb-4'>
          <a href={`/projects/${projectId}/`} className='flex items-center mr-4 text-gray-400 hover:text-foreground text-sm'>
            <ArrowLeft className='h-4' />
            <span className='pl-1'>back to Project</span>
          </a>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div className={cn("font-bold", type === 'compact' ? 'text-xl' : 'text-2xl')}>Files</div>
        {currentPath !== '/' && (
          <div className="flex gap-2">
            <input
              id="upload-button-input"
              className="hidden"
              {...upload2.getInputProps()}
            />
            <Button
              variant="outline"
              id='upload-button'
              disabled={isLoading}
              size={type === 'compact' ? 'sm' : 'default'}
              className="text-[#7b809a] border-[#7b809a] hover:bg-[#7b809a]/10"
              {...upload2.getRootProps()}
            >
              <Upload className="h-5" />
              <Translator path="evoyaFiles.actions.upload.title" />
            </Button>
            {type !== 'compact' && (
              <Button
                id='create-folder-button'
                disabled={isLoading}
                onClick={() => setNewFolderOpen(true)}
              >
                <FolderPlus className="h-5" />
                <Translator path="evoyaFiles.actions.create_folder.title" />
              </Button>
            )}
          </div>
        )}
      </div>
      <Dialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
      >
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>
              <Translator path="evoyaFiles.actions.create_folder.title" />
            </DialogTitle>
          </DialogHeader>
          <div>
            <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name" />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNewFolderOpen(false)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button onClick={createFolder}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}