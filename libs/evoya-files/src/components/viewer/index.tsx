import { EvoyaFile } from "@/types";
import { MarkdownViewer } from "./markdown";
import { FilePickerContext } from '@/context/file-context';
import { useContext, useEffect, useState } from "react";
import { PdfViewer } from "./pdf";
import { TextViewer } from "./text";
import { toast } from '@/utils/evoya-toast';
import { Button } from '@chainlit/app/src/components/ui/button';
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react';


export function ViewerWrapper({ file, setOpenFile }: { file: EvoyaFile; setOpenFile: (file: EvoyaFile | null) => void }) {
  const { apiBaseUrl, csrfToken } = useContext(FilePickerContext);  
  const [content, setContent] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [fileLoaded, setFileLoaded] = useState(false);

  useEffect(() => {
    // if (
    //   file.mime.includes('text/')
    //   || file.mime.includes('application/json')
    // ) {
      setFileLoaded(false);
      fetch(`${apiBaseUrl}/api/files/download/?path=${file.path}`).then(async (response) => {
        const blob = await response.blob();
        setBlobUrl(URL.createObjectURL(blob));
        const text = await blob.text();
        setContent(text);
        setFileLoaded(true);
      })
    // } else {
    //   setFileLoaded(true);
    // }
  }, [file]);

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

  const fileRenderer = () => {
    if (file.mime === 'application/pdf') {
      return <PdfViewer path={blobUrl} />
    } else if (file.mime.includes('text/markdown') || file.mime.includes('text/x-markdown')) {
      return <MarkdownViewer content={content} isEditable={true} setContent={setContent} />
    } else if (file.mime.includes('application/json')) { // Code file types
      return <TextViewer mime={file.mime} content={content} isEditable={true} setContent={setContent} />
    } else if (file.mime.includes('text/')) { // Text file type fallback
      return <TextViewer mime={file.mime} content={content} isEditable={true} setContent={setContent} />
    }
  }

  return (
    <>
      <div className="flex items-center mb-4">
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenFile(null)}
            className="hover:bg-gray-200 rounded-full"
          >
            <ArrowLeft />
          </Button>
        </div>
        <div className="font-bold text-xl ml-4">{file.name}</div>
        {fileLoaded && (
          <div className="ml-auto">
            <Button onClick={saveFile}>
              <Save />
              <span>Save</span>
            </Button>
          </div>
        )}
      </div>
      {!fileLoaded && (
        <div className="flex items-center mb-4">
          <LoaderCircle className="animation-spin" />
        </div>
      )}
      {fileLoaded && fileRenderer()}
    </>
  );
}
