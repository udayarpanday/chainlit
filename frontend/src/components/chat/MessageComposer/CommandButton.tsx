import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@radix-ui/react-popover';
import { useState, useEffect } from 'react';
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
import { ChevronDown } from "lucide-react";

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
  const [searchResults, setSearchResults] = useState<ICommand[]>([]);
  const [hoveredCommand, setHoveredCommand] = useState<ICommand | null>(null);
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResults(commands);
      return;
    }

    const filtered = commands.filter(
      command => 
        command.id.toLowerCase().includes(value.toLowerCase()) ||
        command.description?.toLowerCase().includes(value.toLowerCase()) ||
        command.prompt_content?.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(filtered);
  };

  // Get the currently displayed command (hovered, selected, or first available)
  const displayedCommand = hoveredCommand || selectedCommand || searchResults[0] || null;

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
        align={isMobile ? "center" : "start"}
        side={isMobile ? "top" : undefined}
        sideOffset={isMobile ? 5 : 12}
        className="focus:outline-none w-[52vw] min-w-[320px] max-w-[950px] p-0"
        style={{
          position: isMobile ? "fixed" : "relative",
          bottom: isMobile ? "-82vh" : "42px",
          right: isMobile ? "auto" : "48px",
          left: isMobile ? "45px" : "auto",
          transform: "none",
          zIndex: 50
        }}
      >
        <div className="w-full">
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center px-3 pt-3 pb-0">
              <CommandInput 
                placeholder="Search prompts..." 
                className="h-9"
                onValueChange={handleSearch}
              />
            </div>
            <CommandList className="max-h-[60vh] md:max-h-[500px] overflow-auto">
              <CommandEmpty>No results found.</CommandEmpty>
              <div className="flex flex-col md:flex-row">
                <CommandGroup className="w-full md:w-[250px] p-2">
                  {searchResults.map((command) => (
                    <CommandItem
                      key={command.id}
                      onSelect={() => {onCommandSelect(command); setOpen(false)}}
                      className="command-item cursor-pointer px-3 py-3 justify-between rounded-md"
                      onMouseEnter={() => setHoveredCommand(command)}
                      onMouseLeave={() => setHoveredCommand(null)}
                    > 
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{command.id}</div>
                        <div className="font-light text-xs truncate">{command.description}</div>
                      </div>
                      <div className="text-gray-400 ml-2 flex-shrink-0">
                        <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="border-t-2 md:border-t-0 md:border-l-2 w-full">
                  <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="bg-gray-50 rounded-md p-4 relative">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {displayedCommand?.prompt_content || "Select a command to view its content"}
                      </p>
                    </div>
                  </div>
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