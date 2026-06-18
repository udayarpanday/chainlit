import { File, SquareArrowOutUpRight, FolderOpen } from 'lucide-react';
import { useMemo } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import { tryParseJSONObject } from '@/lib/evoya';

export const ProjectsList = ({ step }: { step: StepIO }) => {
  const hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);

  if (!jsonResponse) return null;

  return (
    <>
      {jsonResponse.projects?.length > 0 && jsonResponse.projects.map((res) => (
        <BaseToolCall
          title="Projects List"
          icon={<File />}
          hasError={hasError}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col items-start gap-2">
              {res.uuid && (
                <>
                  <Button variant="ghost" asChild>
                    <a href={`/project/${res.uuid}`} target="_blank">
                      <FolderOpen />
                      <span>{res.title}</span>
                      <SquareArrowOutUpRight />
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </BaseToolCall>
      ))}
    </>
  );
}