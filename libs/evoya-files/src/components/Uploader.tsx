import {
  useContext,
  useState,
  useRef,
} from 'react';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

import { toast } from '@chainlit/app/src/lib/evoya-toast';

import {
  Upload,
  FolderPlus,
  ArrowLeft,
  ExternalLink,
  FilePen,
  PlusCircle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@chainlit/app/src/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@chainlit/app/src/components/ui/input-group';

import { useUpload } from '@chainlit/app/src/hooks/useUpload';

import { Input } from '@chainlit/app/src/components/ui/input';

type Props = {
  currentPath: string;
  isLoading: boolean;
  isSearch?: boolean;
  onFileUpload: (files: File[]) => void;
  setIsLoading: (value: boolean) => void;
  loadCurrentPath: () => void;
}

export default function Uploader({
  currentPath,
  isLoading,
  isSearch = false,
  setIsLoading,
  onFileUpload,
  loadCurrentPath,
}: Props) {
  const { apiBaseUrl, csrfToken, projectId, type } = useContext(FilePickerContext);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const folderNameInput = useRef<HTMLInputElement>(null);
  const [newMdName, setNewMdName] = useState('');
  const [newMdOpen, setNewMdOpen] = useState(false);
  const mdNameInput = useRef<HTMLInputElement>(null);

  const createFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewFolderOpen(false);
    setNewFolderName('');
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

  const createMdFile = async (e) => {
    e.preventDefault();
    setNewMdOpen(false);
    setNewMdName('');
    const blob = new Blob([' '], {
      type: 'text/markdown',
    });
    const newFile = new File([blob as BlobPart], newMdName + ".md");
    try {
      const data = new FormData();
      data.append('file', newFile)
      data.append('path', currentPath)
      const response = await fetch(`${apiBaseUrl}/api/files/upload/`, {
        method: 'POST',
        body: data,
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        toast.success('File created!');
        loadCurrentPath();
      } else {
        toast.error('Failed to create file!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to create file!')
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
    onResolved: (payloads: File[]) => onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: false, multiple: true }
  });

  return (
    <>
      {(projectId && type !== 'compact') && (
        <div className='mb-4'>
          <a href={`/projects/${projectId}/`} className='flex items-center mr-4 text-gray-400 hover:text-foreground text-sm'>
            <ArrowLeft className='h-4' />
            <span className='pl-1'><Translator path="evoyaFiles.actions.back_to_project.label" /></span>
          </a>
        </div>
      )}
      <div className="flex justify-between items-center mb-2">
        <div className={cn("font-bold", type === 'compact' ? 'text-xl' : 'text-2xl')}>
          <Translator path="evoyaFiles.common.files" />
        </div>
        {currentPath !== '/' && (
          <div className="flex gap-2">
            <input
              id="upload-button-input"
              className="hidden"
              {...upload2.getInputProps()}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size={type === 'compact' ? 'sm' : 'default'}
                  disabled={isLoading || isSearch}
                  className=""
                >
                  <PlusCircle />
                  <Translator path="evoyaFiles.actions.new.label" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent container={window.cl_files_shadowRootElement} align="end">
                <DropdownMenuItem
                  id='upload-button'
                  onClick={upload2.getRootProps().onClick}
                >
                  <Upload className="h-5" />
                  <Translator path="evoyaFiles.actions.upload.title" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNewMdOpen(true)} id='create-md-button'>
                  <FilePen className="h-5" />
                  <Translator path="evoyaFiles.actions.create_md.title" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNewFolderOpen(true)} id='create-folder-button'>
                  <FolderPlus className="h-5" />
                  <Translator path="evoyaFiles.actions.create_folder.title" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* {type !== 'compact' && (
              <Button
                id='create-folder-button'
                disabled={isLoading || isSearch}
                onClick={() => setNewFolderOpen(true)}
              >
                <FolderPlus className="h-5" />
                <Translator path="evoyaFiles.actions.create_folder.title" />
              </Button>
            )} */}
            {type === 'compact' && (
              <Button
                asChild
                variant="outline"
                className="text-[#7b809a] hover:text-[#7b809a] border-[#7b809a] hover:bg-[#7b809a]/10"
                size={type === 'compact' ? 'sm' : 'default'}
              >
                <a
                  href={`/files/manage/?path=${currentPath}&projectId=${projectId}`}
                  target="_blank"
                  className="text-[#7b809a]"
                >
                  <ExternalLink className="h-5" />
                  <Translator className="text-[#7b809a]" path="evoyaFiles.actions.open_folder.title" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
      <Dialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
      >
        <DialogContent container={window.cl_files_shadowRootElement} className="z-[9999]" onOpenAutoFocus={() => setTimeout(() => folderNameInput.current?.focus(), 200)}>
          <DialogHeader>
            <DialogTitle>
              <Translator path="evoyaFiles.actions.create_folder.title" />
            </DialogTitle>
          </DialogHeader>
          <div>
            <form onSubmit={createFolder} id="create-folder-form">
              <Input value={newFolderName} ref={folderNameInput} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name" autoFocus />
            </form>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNewFolderOpen(false)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button type="submit" form="create-folder-form">
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={newMdOpen}
        onOpenChange={setNewMdOpen}
      >
        <DialogContent container={window.cl_files_shadowRootElement} className="z-[9999]" onOpenAutoFocus={() => setTimeout(() => mdNameInput.current?.focus(), 200)}>
          <DialogHeader>
            <DialogTitle>
              <Translator path="evoyaFiles.actions.create_md.title" />
            </DialogTitle>
          </DialogHeader>
          <div>
            <form onSubmit={createMdFile} id="create-md-form">
              {/* <Input value={newMdName} ref={mdNameInput} onChange={(e) => setNewMdName(e.target.value)} placeholder="Name" autoFocus /> */}
              <InputGroup className="mb-4">
                <InputGroupInput
                  placeholder="Name"
                  value={newMdName}
                  onChange={(e) => setNewMdName(e.target.value)}
                  ref={mdNameInput}
                  autoFocus
                  isGroup
                />
                <InputGroupAddon align="inline-end">.md</InputGroupAddon>
              </InputGroup>
            </form>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNewMdOpen(false)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button type="submit" form="create-md-form">
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
