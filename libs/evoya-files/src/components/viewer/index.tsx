import { EvoyaFile, PathItem } from "@/types";
import { MarkdownViewer } from "./markdown";
import { FilePickerContext } from '@/context/file-context';
import { useContext, useEffect, useState } from "react";
import { PdfViewer } from "./pdf";
import { TextViewer } from "./text";
import { toast } from '@chainlit/app/src/lib/evoya-toast';
import { Button } from '@chainlit/app/src/components/ui/button';
import { ArrowLeft, Download, LoaderCircle, Save } from 'lucide-react';
import { ImageViewer } from "./image";
import { Translator } from '@chainlit/app/src/components/i18n';
import { downloadBlobFromUrl } from "@/utils/file";
import { AudioPlayer } from "./audio";
import FolderBreadcrumbs from '../FolderBreadcrumbs';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@chainlit/app/src/components/ui/dialog';

export function ViewerWrapper({
  file,
  setOpenFile,
  pathItems = [],
  setSelectedPath = () => {}
}: {
  file: EvoyaFile;
  pathItems?: PathItem[];
  setOpenFile: (file: EvoyaFile | null) => void;
  setSelectedPath?: (path: string) => void;
}) {
  const { apiBaseUrl, csrfToken, projectId } = useContext(FilePickerContext);  
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [fileLoaded, setFileLoaded] = useState(false);
  const [leavePageOpen, setLeavePageOpen] = useState(false);
  const [pathLoaded, setPathLoaded] = useState(pathItems);
  const [canSave, setCanSave] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (
      file.mime.includes('text/')
      || file.mime.includes('application/json')
    ) {
      setCanSave(true);
    } else {
      setCanSave(false);
    }

    setFileLoaded(false);
    fetch(`${apiBaseUrl}/api/files/download/?path=${file.path}`).then(async (response) => {
      const blob = await response.blob();
      setBlobUrl(URL.createObjectURL(blob));
      const text = await blob.text();
      setContent(text);
      setOriginalContent(text);
      setFileLoaded(true);
    });
    if (pathLoaded.length === 0) {
      const filePath = file.path.split('/');
      filePath.pop();
      fetchDirectory(filePath.join('/') + "/");
    }
  }, [file]);

  useEffect(() => {
    if (content !== originalContent) {
      window.onbeforeunload = function() {return t('evoyaFiles.actions.leave_page.description')}
    } else {
      window.onbeforeunload = function() {}
    }
    return () => {
      window.onbeforeunload = function() {}
    }
  }, [content, originalContent]);

  const saveFile = async () => {
    const blob = new Blob([content], {
      type: file.mime,
    });
    const newFile = new File([blob as BlobPart], file.name);
    try {
      const data = new FormData();
      const filePath = file.path.split('/');
      filePath.pop();
      data.append('file', newFile)
      data.append('path', filePath.join('/') + "/")
      const response = await fetch(`${apiBaseUrl}/api/files/upload/`, {
        method: 'POST',
        body: data,
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        toast.success('File saved!');
      } else {
        toast.error('Failed to save file!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to save file!')
    }
  }

  const fetchDirectory = async (path: string) => {
    setPathLoaded([]);
    const response = await fetch(`${apiBaseUrl}/api/files?path=${path}`);
    const json = await response.json();
    setPathLoaded([
      {
        name: 'Home',
        path: '/',
        canOpen: true
      },
      ...json.breadcrumbs
    ]);
  }

  const fileRenderer = () => {
    if (file.mime === 'application/pdf') {
      return <PdfViewer path={blobUrl} />
    } else if (file.mime.includes('text/markdown') || file.mime.includes('text/x-markdown')) {
      return <MarkdownViewer content={content} isEditable={true} setContent={setContent} />
    } else if (file.mime.includes('application/json')) { // Code file types
      return <TextViewer mime={file.mime} content={content} isEditable={true} setContent={setContent} />
    } else if (file.mime.includes('text/')) { // Text file type fallback
      return <TextViewer mime={file.mime} content={content} isEditable={true} setContent={setContent} />
    } else if (file.mime.includes('image/')) { // Text file type fallback
      return <ImageViewer path={blobUrl} />
    } else if (file.mime.includes('audio/') || file.mime === 'video/webm') { // Text file type fallback
      return <AudioPlayer path={blobUrl} />
    }
  }

  const handleLeavePage = () => {
    setOpenFile(null);
    setLeavePageOpen(false);
  }

  const backHandler = () => {
    if (content !== originalContent) {
      setLeavePageOpen(true);
    } else {
      setOpenFile(null);
    }
  }

  return (
    <>
      {projectId && (
        <div className='mb-4'>
          <a href={`/projects/${projectId}/`} className='flex items-center mr-4 text-gray-400 hover:text-foreground text-sm'>
            <ArrowLeft className='h-4' />
            <span className='pl-1'>back to Project</span>
          </a>
        </div>
      )}
      <div className="flex items-center mb-4">
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => backHandler()}
            className="hover:bg-gray-200 rounded-full"
          >
            <ArrowLeft />
          </Button>
        </div>
        <div className="font-bold text-xl ml-4">{file.name}</div>
        {fileLoaded && (
          <div className="ml-auto flex gap-2">
            <Button onClick={() => downloadBlobFromUrl(blobUrl, file.name)}>
              <Download />
              <Translator path="evoyaFiles.actions.download.label" />
            </Button>
            {canSave && (
              <Button onClick={saveFile}>
                <Save />
                <span>Save</span>
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="mb-4">
        <FolderBreadcrumbs
          pathData={{path: pathLoaded, items: []}}
          fetchDirectory={(path) => {
            setOpenFile(null);
            setSelectedPath(path);
          }}
          isLoading={pathLoaded.length === 0}
          attachmentMode={false}
          destinationMode={false}
        />
      </div>
      <Dialog
        open={leavePageOpen}
        onOpenChange={setLeavePageOpen}
      >
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>
              <Translator path="evoyaFiles.actions.leave_page.title" />
            </DialogTitle>
            <DialogDescription>
              <Translator path="evoyaFiles.actions.leave_page.description" />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setLeavePageOpen(false)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button variant="destructive" onClick={handleLeavePage}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!fileLoaded && (
        <div className="flex items-center mb-4">
          <LoaderCircle className="animation-spin" />
        </div>
      )}
      {fileLoaded && fileRenderer()}
    </>
  );
}
