import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';

import { ICommand, commandsState } from '@chainlit/react-client';

import { ToolBox } from '@/components/icons/ToolBox';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { ChevronDown } from "lucide-react"

interface Props {
  disabled?: boolean;
  onCommandSelect: (command: ICommand) => void;
  selectedCommand: ICommand;
}

export const CommandButton = ({
  disabled = false,
  onCommandSelect,
  selectedCommand
}: Props) => {
  const commands = useRecoilValue(commandsState);
  const [open, setOpen] = useState(false);

  if (!commands.length) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                id="command-button"
                variant="ghost"
                size="icon"
                className="hover:bg-muted"
                disabled={disabled}
              >
                <ToolBox className="!size-6" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Commands</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        align="start"
        sideOffset={12}
        className="focus:outline-none md:w-[950px]"
        style={{
          position: 'relative',
          bottom: '42px',
          right: '48px'
        }}
      >
        <div>
          <Command className="rounded-lg border shadow-none">
            <div className="flex items-center px-3 pt-3 pb-0">
              <CommandInput placeholder="Search prompts..." className="h-9" />
            </div>
            <CommandList className="max-h-[500px] overflow-auto flex">
              <CommandEmpty>No results found.</CommandEmpty>
              <div className="flex">
                <CommandGroup className='w-[200px] p-2'>
                  {commands.map((command) => (
                    <CommandItem
                      key={command.id}
                      onSelect={() => {onCommandSelect(command);setOpen(false)}}
                      className="command-item cursor-pointer px-3 py-3 justify-between rounded-md"
                    >
                      <div>
                        <div className="font-medium">{command.id}</div>
                      </div>
                      <div className="text-gray-400">
                        <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className='border-l-2 md:w-[580px] hidden md:block'>
                  <div class="flex-1 overflow-y-auto p-6">
                    <div class="bg-gray-50 rounded-md p-4 relative">
                      <p class="text-sm text-gray-700 whitespace-pre-wrap font-sans">{selectedCommand?.description ?? commands[0].description}</p>
                    </div>
                  </div>
                  <p></p>
                </div>
              </div>
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CommandButton;
