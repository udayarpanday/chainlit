import { File, SquareArrowOutUpRight, FolderOpen } from 'lucide-react';
import { useMemo } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import { tryParseJSONObject } from '@/lib/evoya';

export const ProjectFile = ({ step }: { step: StepIO }) => {
  const hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);

  if (!jsonResponse) return null;

  return (
    <>
      {jsonResponse.results?.length > 0 && jsonResponse.results.map((res) => (
        <BaseToolCall
          title="Project File"
          icon={<File />}
          hasError={hasError}
        >
          <div className="overflow-hidden text-sm">
            <div className="flex items-center gap-2">
              {res.project && res.project.uuid && (
                <>
                  <Button variant="ghost" asChild>
                    <a href={`/project/${res.project.uuid}`} target="_blank">
                      <FolderOpen />
                      <span>{res.project.title}</span>
                      <SquareArrowOutUpRight />
                    </a>
                  </Button>
                  <span>-</span>
                </>
              )}
              <Button variant="ghost" asChild>
                <a href={`/file/${res.file.id}`} target="_blank">
                  <File />
                  <span>{res.file.name}</span>
                  <SquareArrowOutUpRight />
                </a>
              </Button>
            </div>
          </div>
        </BaseToolCall>
      ))}
    </>
  );
}