import {
  FilePickerData,
  FilePickerItem as FilePickerItemType,
} from '@/types';
import {
  useContext,
  useEffect,
  useState,
} from 'react';

import { Checkbox } from '@chainlit/app/src/components/ui/checkbox';
import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

import FilePickerItem from './FilePickerItem'
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/utils/evoya-toast';

import {
  Home,
  ChevronRight,
  Download,
  Trash2,
  LoaderCircle,
  Upload,
  FolderPlus,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';
import { FilePickerContext } from '@/context/file-context';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
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
  const { apiBaseUrl, csrfToken } = useContext(FilePickerContext);
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
      <div className="flex justify-between items-center mb-4">
        <div className="font-bold text-2xl">Files</div>
        {currentPath !== '/' && (
          <div className="flex gap-2">
            <input
              id="upload-button-input"
              className="hidden"
              {...upload2.getInputProps()}
            />
            <Button
              id='upload-button'
              disabled={isLoading}
              {...upload2.getRootProps()}
            >
              <Upload className="h-5" />
              <Translator path="evoyaFiles.actions.upload.title" />
            </Button>
            <Button
              id='create-folder-button'
              disabled={isLoading}
              onClick={() => setNewFolderOpen(true)}
            >
              <FolderPlus className="h-5" />
              <Translator path="evoyaFiles.actions.create_folder.title" />
            </Button>
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