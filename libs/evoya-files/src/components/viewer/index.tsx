import { EvoyaFile } from "@/types";
import { MarkdownViewer } from "./markdown";
import DocViewer, {
  DocViewerRenderers,
} from "react-doc-viewer";
import { FilePickerContext } from '@/context/file-context';
import { useContext, useEffect, useState } from "react";
import { PdfViewer } from "./pdf";
import { TextViewer } from "./text";

const dummyContent = `
## Installation

Open a terminal and run:

\`\`\`sh
pip install chainlit
chainlit hello
\`\`\`

If this opens the \`hello app\` in your browser, you're all set!

### Development version

The latest in-development version can be installed straight from GitHub with:

\`\`\`sh
pip install git+https://github.com/Chainlit/chainlit.git#subdirectory=backend/
\`\`\`

(Requires Node and pnpm installed on the system.)

## 🚀 Quickstart

### 🐍 Pure Python

Create a new file \`demo.py\` with the following code:

\`\`\`python
import chainlit as cl


@cl.step(type="tool")
async def tool():
    # Fake tool
    await cl.sleep(2)
    return "Response from the tool!"


@cl.on_message  # this function will be called every time a user inputs a message in the UI
async def main(message: cl.Message):
    """
    This function is called every time a user inputs a message in the UI.
    It sends back an intermediate response from the tool, followed by the final answer.

    Args:
        message: The user's message.

    Returns:
        None.
    """


    # Call the tool
    tool_res = await tool()

    await cl.Message(content=tool_res).send()
\`\`\`
`;


export function ViewerWrapper({ file }: { file: EvoyaFile }) {
  const { apiBaseUrl } = useContext(FilePickerContext);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBaseUrl}${file.path}`).then(async (response) => {
      const blob = await response.blob();
      setBlobUrl(URL.createObjectURL(blob));
    })
  }, []);

  if (file.mime === 'application/pdf') {
    return <PdfViewer path={file.path} />
  } else if (file.mime.includes('text/markdown') || file.mime.includes('text/x-markdown')) {
    return <MarkdownViewer content={dummyContent} isEditable={true} />
  } else if (file.mime.includes('application/json')) { // Code file types
    return <TextViewer file={file} isEditable={true} />
  } else if (file.mime.includes('text/')) { // Text file type fallback
    return <TextViewer file={file} isEditable={true} />
  }

  if (!blobUrl) return null;

  const docs = [
    { uri: blobUrl },
  ];

  // needs access to file, so doesnt properly work
  return (
    <DocViewer
      pluginRenderers={DocViewerRenderers}
      documents={docs}
    />
  );
}