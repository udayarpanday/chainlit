import { EvoyaFile } from "@/types";
import { MarkdownViewer } from "./markdown";
import DocViewer, {
  DocViewerRenderers,
} from "react-doc-viewer";
import { FilePickerContext } from '@/context/file-context';
import { useContext, useEffect, useState } from "react";
import { PdfViewer } from "./pdf";
import { TextViewer } from "./text";
import { toast } from 'sonner';
import { Button } from '@chainlit/app/src/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';


export function ViewerWrapper({ file, setOpenFile }: { file: EvoyaFile; setOpenFile: (file: EvoyaFile | null) => void }) {
  const { apiBaseUrl } = useContext(FilePickerContext);  
  const [content, setContent] = useState('');
  const [fileLoaded, setFileLoaded] = useState(false);

  useEffect(() => {
    fetch(`${apiBaseUrl}${file.path}`).then(async (response) => {
      const text = await response.text();
      setContent(text);
      setFileLoaded(true);
    })
  }, []);

  const saveFile = () => {
    fetch(`${apiBaseUrl}${file.path}`, {
      method: 'POST',
      body: JSON.stringify({ content: content })
    }).then((response) => {
      toast.success('File saved!')
    }).catch((err) => {
      toast.error('Failed to save file!')
    })
  }

  if (!fileLoaded) {
    return (
      <div
        style={{
          overflow: 'auto',
          height: '100%'
        }}
      >
        Loading
      </div>
    )
  }

  const fileRenderer = () => {
    if (file.mime === 'application/pdf') {
      return <PdfViewer path={file.path} />
    } else if (file.mime.includes('text/markdown') || file.mime.includes('text/x-markdown')) {
      return <MarkdownViewer content={content} isEditable={true} setContent={setContent} />
    } else if (file.mime.includes('application/json')) { // Code file types
      return <TextViewer file={file} isEditable={true} />
    } else if (file.mime.includes('text/')) { // Text file type fallback
      return <TextViewer file={file} isEditable={true} />
    }
  }

  // needs access to file, so doesnt properly work
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
        <div className="ml-auto">
          <Button onClick={saveFile}>
            <Save />
            <span>Save</span>
          </Button>
        </div>
      </div>
      {fileRenderer()}
    </>
  );
}
