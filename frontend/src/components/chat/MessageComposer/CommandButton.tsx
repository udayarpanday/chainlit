import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';

import { ICommand, commandsState } from '@chainlit/react-client';

import Icon from '@/components/Icon';
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
        className="focus:outline-none"
      >
        <Command className="rounded-lg border shadow-none">
          <div className="flex items-center px-3 pt-3 pb-2">
            <CommandInput placeholder="Search prompts..." className="h-9" />
          </div>
          <CommandList className="max-h-[400px] overflow-auto flex">
            <CommandEmpty>No results found.</CommandEmpty>
            <div className="flex">
              <CommandGroup>
                {commands.map((command) => (
                  <CommandItem
                    key={command.id}
                    onSelect={() => onCommandSelect(command)}
                    className="command-item cursor-pointer px-3 py-3 rounded-none"
                  >
                    <Icon
                      name={command.icon}
                      className="!size-5 text-muted-foreground"
                    />
                    <div>
                      <div className="font-medium">{command.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {command?.description ?? commands[0].description}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <div>
                <p>{selectedCommand?.description ?? commands[0].description}</p>
              </div>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CommandButton;
