import { useMemo, useState } from 'react';
import type { IStep } from '@chainlit/react-client';
import { WebRequest } from './Content/Tools/WebRequest';
import { GoogleSearch } from './Content/Tools/GoogleSearch';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageGeneration } from './Content/Tools/ImageGeneration';
import { CustomTool } from './Content/Tools/CustomTool';
import { ImageAnalyzer } from './Content/Tools/ImageAnalyzer';
import { CodeInterpreter } from './Content/Tools/CodeInterpreter';
import { SessionFiles } from './Content/Tools/SessionFiles';
import { ProjectsList } from './Content/Tools/ProjectsList';
import { ProjectFile } from './Content/Tools/ProjectFile';

interface Props {
  toolCalls: IStep[];
}

export type StepInputToolCall = {
  args: any;
  id: string;
  name: string;
  type: string;
}
export type StepInput = {
  state: any;
  tool_call: StepInputToolCall;
}
export type StepOutputMessageArgs = {
  content: string;
  id: string;
  name: string;
  status: string;
}
export type StepOutputMessage = {
  id: string[];
  kwargs: StepOutputMessageArgs;
}
export type StepOutput = {
  messages: StepOutputMessage[];
}
// export type StepIO = {
//   input: StepInput;
//   output: StepOutput;
// }
export interface StepIO extends IStep {
  inputParsed: StepInput;
  outputParsed: StepOutput;
}

export default function ToolCallsInfo({
  toolCalls,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const flatToolCalls: StepIO[] = useMemo(() => {
    const mappedSteps = toolCalls.reduce((calls: StepIO[], step: IStep) => {
      if (step.type === 'tool' && step.name.includes('DocumentProcessor')) {
        return [
          ...calls,
          {
            ...step,
            ...(step.language === 'json' ? {
              inputParsed: JSON.parse(step.input ?? '{}'),
              outputParsed: JSON.parse(step.output ?? '{}'),
            } : {})
          } as StepIO
        ];
      }

      switch(step.name) {
        case 'tools':
          if (step.steps && step.steps.length > 0) {
            return [
              ...calls,
              {
                ...step,
                ...(step.language === 'json' ? {
                  inputParsed: JSON.parse(step.input ?? '{}'),
                  outputParsed: JSON.parse(step.output ?? '{}'),
                } : {})
              } as StepIO
            ];
          } else {
            return calls;
          }
        default:
          return calls;
      }
    }, []);
    return mappedSteps;
  }, [toolCalls]);

  console.log(flatToolCalls);

  const renderContent = (tool: StepIO) => {
    if (tool.inputParsed) {
      switch (tool.inputParsed.tool_call.name) {
        case "tool_Web_Request":
          return <WebRequest step={tool} />
        case "tool_Google_Search":
          return <GoogleSearch step={tool} />
        case "tool_Image_Generator":
          return <ImageGeneration step={tool} />
        case "tool_Image_to_Text":
          return <ImageAnalyzer step={tool} />
        case "list_session_files":
          return <SessionFiles step={tool} />
        case "tool_Code_Interpreter":
          return <CodeInterpreter step={tool} />
        case "write_project_file":
          return <ProjectFile step={tool} />
        case "list_selected_projects":
          return <ProjectsList step={tool} />
        default:
          return <CustomTool step={tool} />
      }
    }

    return null;
  };

  return (
    <div className="flex flex-col w-full gap-2">
      {flatToolCalls.map((tool) => (
        <div>{renderContent(tool)}</div>
      ))}
    </div>
  );

  return (
    <div className="max-w-full w-full">
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center hover:text-primary cursor-pointer">
        <div className="mr-2">Show Tool Use</div>
        <ChevronRight className={cn(isOpen ? 'rotate-90' : '')} />
      </div>
      {isOpen && (
        <div className="flex flex-col w-full gap-2 mt-2">
          {flatToolCalls.map((tool) => (
            <div>{renderContent(tool)}</div>
          ))}
        </div>
      )}
    </div>
  )
}