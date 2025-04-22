import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

interface Props {
  disabled?: boolean;
  onCommandSelect: (command: ICommand) => void;
  selectedCommand: ICommand;
}

export const CommandButton = ({
  disabled = false,
  onCommandSelect,
  selectedCommand,
}: Props) => {
  const commands = useRecoilValue(commandsState);
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ICommand[]>([]);
  const [hoveredCommand, setHoveredCommand] = useState<ICommand | null>(null);
  const [displayedCommand, setDisplayedCommand] = useState<ICommand | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    setSearchResults(commands);
  }, [commands]);

  useEffect(() => {
    setDisplayedCommand(
      hoveredCommand || selectedCommand || searchResults[0] || null
    );
  }, [hoveredCommand, selectedCommand, searchResults]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResults(commands);
      return;
    }

    const filtered = commands.filter(
      (command) =>
        command.id.toLowerCase().includes(value.toLowerCase()) ||
        command.description?.toLowerCase().includes(value.toLowerCase()) ||
        command.prompt_content?.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleMouseEnter = (command) => {
    setTimeout(() => {
      setHoveredCommand(command);
    }, 200);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open]);

  if (!commands.length) return null;

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        setHoveredCommand(null);
        setSearchResults(commands);
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                id="command-button"
                ref={buttonRef}
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
        align={isMobile ? 'center' : 'start'}
        side={isMobile ? 'top' : undefined}
        sideOffset={isMobile ? 5 : 12}
        className="focus:outline-none w-[52vw] min-w-[320px] w-md-[820px] w-lg-[950px] p-0"
        style={{
          position: isMobile ? 'fixed' : 'relative',
          bottom: isMobile ? '-82vh' : '42px',
          right: isMobile ? 'auto' : '48px',
          left: isMobile ? '45px' : 'auto',
          transform: 'none',
          zIndex: 50
        }}
      >
        <div className="w-full">
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center pb-0">
              <CommandInput
                placeholder="Search prompts..."
                className="h-12"
                ref={inputRef}
                autoFocus
                onValueChange={handleSearch}
              />
            </div>
            <CommandList className="max-h-[60vh] md:max-h-[300px] !overflow-hidden">
              <CommandEmpty>No results found.</CommandEmpty>
              <div className="flex flex-col md:flex-row">
                <CommandGroup className="w-full md:w-[250px] p-2 h-[280px] overflow-auto">
                  {searchResults.map((command) => (
                    <CommandItem
                      key={command.id}
                      onSelect={() => {
                        onCommandSelect(command);
                        setOpen(false);
                        setTimeout(() => {
                          if (buttonRef.current) {
                            buttonRef.current.blur();
                          }
                        }, 10);
                      }}
                      className="command-item cursor-pointer px-3 py-3 justify-between rounded-md"
                      onMouseEnter={() => handleMouseEnter(command)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{command.id}</div>
                        <div className="font-light text-xs truncate">
                          {command.description}
                        </div>
                      </div>
                      <div className="text-gray-400 ml-2 flex-shrink-0">
                        <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {searchResults.length > 0 && !isMobile &&(
                  <div className="border-t-2 md:border-t-0 md:border-l w-full h-[280px] overflow-auto">
                    <div className="flex-1 p-2 md:p-2">
                      <div className="bg-gray-50 rounded-md p-4 relative">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                          {displayedCommand?.prompt_content ||
                            'Select a command to view its content'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CommandButton;
