import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { useRecoilValue } from 'recoil';

import { ICommand, commandsState } from '@chainlit/react-client';

import Icon from '@/components/Icon';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';

import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  id?: string;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  selectedCommand?: ICommand;
  setSelectedCommand: (command: ICommand | undefined) => void;
  onChange: (value: string) => void;
  onPaste?: (event: any) => void;
  onEnter?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export interface InputMethods {
  reset: () => void;
}

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const Input = forwardRef<InputMethods, Props>(
  (
    {
      placeholder,
      id,
      className,
      autoFocus,
      selectedCommand,
      setSelectedCommand,
      onChange,
      onEnter,
      onPaste
    },
    ref
  ) => {
    const commands = useRecoilValue(commandsState);
    const [isComposing, setIsComposing] = useState(false);
    const [showCommands, setShowCommands] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [commandInput, setCommandInput] = useState('');
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const lastCommandSpanRef = useRef<HTMLElement | null>(null);
    const mutationObserverRef = useRef<MutationObserver | null>(null);
    const isUpdatingRef = useRef(false);
    const [searchResults, setSearchResults] = useState<ICommand[]>([]);
    const [hoveredCommand, setHoveredCommand] = useState<ICommand | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const isMobile = useIsMobile();

    const getContentWithoutCommand = () => {
      if (!contentEditableRef.current) return '';

      // Create a clone of the content
      const clone = contentEditableRef.current.cloneNode(
        true
      ) as HTMLDivElement;

      // Remove command span from clone
      const commandSpan = clone.querySelector('.command-span');
      if (commandSpan) {
        commandSpan.remove();
      }

      return (
        clone.innerHTML
          ?.replace(/<br\s*\/?>/g, '\n') // Convert <br> to newlines
          .replace(/<div>/g, '\n') // Convert <div> to newlines
          .replace(/<\/div>/g, '') // Remove closing div tags
          .replace(/&nbsp;/g, ' ') // Convert &nbsp; to spaces
          .replace(/<[^>]*>/g, '') // Remove any other HTML tags
          .replace('\u200B', '') || ''
      );
    };

    const reset = () => {
      setSelectedCommand(undefined);
      setSelectedIndex(0);
      setCommandInput('');
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = '';
      }
      onChange('');
    };

    useImperativeHandle(ref, () => ({
      reset
    }));

    // Set up mutation observer to detect command span removal
    useEffect(() => {
      if (!contentEditableRef.current) return;

      contentEditableRef.current.focus();

      mutationObserverRef.current = new MutationObserver((mutations) => {
        if (isUpdatingRef.current) return;

        mutations.forEach((mutation) => {
          if (
            mutation.type === 'childList' &&
            mutation.removedNodes.length > 0
          ) {
            // Check if the removed node was our command span
            const wasCommandSpanRemoved = Array.from(
              mutation.removedNodes
            ).some((node) =>
              (node as HTMLElement).classList?.contains('command-span')
            );

            if (wasCommandSpanRemoved && !mutation.addedNodes.length) {
              handleCommandSelect(undefined);
            }
          }
        });
      });

      mutationObserverRef.current.observe(contentEditableRef.current, {
        childList: true,
        subtree: true
      });

      return () => {
        mutationObserverRef.current?.disconnect();
      };
    }, []);

    // Handle selectedCommand prop changes
    useEffect(() => {
      const content = contentEditableRef.current;
      if (!content) return;

      isUpdatingRef.current = true;

      try {
        // Find existing command span
        const existingCommandSpan = content.querySelector('.command-span');

        if (selectedCommand) {
          // Create new command block
          const newCommandBlock = document.createElement('div');
          newCommandBlock.className =
            'command-span font-bold inline-flex text-[#08f] items-center mr-1';
          newCommandBlock.contentEditable = 'false';
          newCommandBlock.innerHTML = `<span>${selectedCommand.id}</span>`;

          // Store reference to the command span
          lastCommandSpanRef.current = newCommandBlock;

          if (existingCommandSpan) {
            existingCommandSpan.replaceWith(newCommandBlock);
          } else {
            // Add new command span at the start
            if (content.firstChild) {
              content.insertBefore(newCommandBlock, content.firstChild);
            } else {
              content.appendChild(newCommandBlock);
            }
          }

          // Ensure there's a text node after the command block for cursor positioning
          let textNode = newCommandBlock.nextSibling;
          if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
            textNode = document.createTextNode('\u200B'); // Zero-width space
            content.appendChild(textNode);
          }

          // Create and set the selection range
          const selection = window.getSelection();
          selection.removeAllRanges();
          const range = document.createRange();

          // Set cursor position at the beginning of the text node
          range.setStart(textNode, 0);
          range.collapse(true);

          // Apply the selection
          selection.addRange(range);

          // Force focus with delay to ensure it happens after any button close events
          content.focus();

          // Double-focus technique - helps in some browsers/situations
          setTimeout(() => {
            // Make sure caret is visible
            content.style.caretColor = 'black';

            // Re-focus and set cursor position again
            content.focus();

            if (selection.rangeCount > 0) {
              selection.removeAllRanges();
              selection.addRange(range);
            }

            // Trigger onChange with content excluding command
            onChange(getContentWithoutCommand());
          }, 10);
        } else if (existingCommandSpan) {
          // Remove existing command span
          existingCommandSpan.remove();
          lastCommandSpanRef.current = null;

          // Ensure cursor is placed at start
          const range = document.createRange();
          range.setStart(content, 0);
          range.collapse(true);

          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);

          content.focus();
          onChange(getContentWithoutCommand());
        }
      } finally {
        // Use setTimeout to ensure all DOM updates are complete
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 20);
      }
    }, [selectedCommand, onChange]);

    const normalizedInput = commandInput.toLowerCase().slice(1);

    const filteredCommands = commands
      .filter((command) => command.id.toLowerCase().includes(normalizedInput))
      .sort((a, b) => {
        const indexA = a.id.toLowerCase().indexOf(normalizedInput);
        const indexB = b.id.toLowerCase().indexOf(normalizedInput);
        return indexA - indexB;
      });

    // Improved paste handler that works across browsers
    useEffect(() => {
      const textarea = contentEditableRef.current;
      if (!textarea || !onPaste) return;

      const handlePaste = (event: ClipboardEvent) => {
        // Prevent the default paste behavior
        event.preventDefault();

        // Get plain text from clipboard
        const textData = event.clipboardData?.getData('text/plain');
        
        if (!textData) return;
        
        // Process the text - convert newlines to <br> tags and escape HTML
        const escapedText = escapeHtml(textData);
        const textWithNewLines = escapedText.replace(/\n/g, '<br>');
        
        // Handle insertion into the DOM
        // Use execCommand for better cross-browser compatibility
        if (document.queryCommandSupported('insertHTML')) {
          document.execCommand('insertHTML', false, textWithNewLines);
        } else {
          // Fallback method for browsers that don't support execCommand
          insertTextAtCursor(textWithNewLines);
        }
        
        // Ensure the textarea has focus
        textarea.focus();
        
        // Call the onPaste callback
        onPaste(event);
        
        // Trigger input event to update state
        setTimeout(() => {
          const inputEvent = new Event('input', { bubbles: true });
          textarea.dispatchEvent(inputEvent);
        }, 0);
      };
      
      // Helper function to insert text at cursor position
      const insertTextAtCursor = (html: string) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create a fragment with our HTML
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Move nodes from temp div to fragment
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        // Insert the fragment
        range.insertNode(fragment);
        
        // Move cursor to end of inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      };

      textarea.addEventListener('paste', handlePaste);

      return () => {
        textarea.removeEventListener('paste', handlePaste);
      };
    }, [onPaste]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      if (isUpdatingRef.current) return;

      const textContent = getContentWithoutCommand();
      onChange(textContent);

      // For command detection, use the full content including command input
      const fullContent = e.currentTarget.textContent || '';
      const lastWord = fullContent.split(' ').pop() || '';

      if (lastWord.startsWith('/')) {
        setShowCommands(true);
        setCommandInput(lastWord);
      } else {
        setShowCommands(false);
        setCommandInput('');
      }

      // If there's no real content, remove the <br>
      if (!fullContent.trim() || fullContent.trim() === '\u200B') {
        e.currentTarget.innerHTML = '';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!showCommands) {
        if (e.key === 'Enter' && !e.shiftKey && onEnter && !isComposing) {
          // Check if on mobile device
          if (isMobile) {
            // On mobile, only send if there's a special modifier key pressed
            // This allows normal Enter presses to create new lines
            if (e.ctrlKey) {
              e.preventDefault();
              onEnter(e);
            }
            // Otherwise let the default behavior happen (create new line)
          } else {
            // On desktop, maintain current behavior
            e.preventDefault();
            onEnter(e);
          }
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedIndex];
        handleCommandSelect(selectedCommand);
      } else if (e.key === 'Escape') {
        setShowCommands(false);
      }
    };

    const handleCommandSelect = (command?: ICommand) => {
      setShowCommands(false);

      // Set a small timeout to ensure state updates are processed
      setTimeout(() => {
        setSelectedCommand(command);

        // Clean up the command input from contentEditable
        if (contentEditableRef.current && command && commandInput) {
          const content = contentEditableRef.current.textContent || '';
          const cleanedContent = content.replace(commandInput, '').trimStart();
          contentEditableRef.current.textContent = cleanedContent;
        }

        setSelectedIndex(0);
        setCommandInput('');
      }, 0);
    };

    // Initialize search results with all commands
    useEffect(() => {
      setSearchResults(commands);
    }, [commands]);

    // Handle search input changes
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

    const handleMouseEnter = (index) => {
      // Small delay before changing the displayed command
      setTimeout(() => {
        setSelectedIndex(index);
      }, 100);
    };

    return (
      <div className="relative w-full">
        <div
          id={id}
          autoFocus={autoFocus}
          ref={contentEditableRef}
          contentEditable
          data-placeholder={placeholder}
          className={cn(
            'min-h-10 max-h-[250px] overflow-y-auto w-full focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground',
            className
          )}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        />
        {/* Add a send button for mobile users
        {isMobile && (
          <button
            onClick={handleSendOnMobile}
            className="absolute right-2 bottom-2 p-2 rounded-full bg-blue-500 text-white"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        )} */}
        {showCommands && filteredCommands.length ? (
          <div className="absolute z-50 -top-4 -left-[15px] -translate-y-full w-md-[820px] w-lg-[950px] w-[52vw]">
            <div className="w-full">
              <Command className="rounded-lg border shadow-none">
                <div className="flex items-center pb-0">
                  <CommandInput
                    placeholder="Search prompts..."
                    className="h-12"
                    onValueChange={handleSearch}
                  />
                </div>
                <CommandList className="max-h-[60vh] md:max-h-[300px] !overflow-hidden">
                  <CommandEmpty>No results found.</CommandEmpty>
                  <div className="flex flex-col md:flex-row">
                    <CommandGroup className="w-full md:w-[250px] p-2 h-[280px] overflow-auto">
                      {filteredCommands.map((command, index) => (
                        <CommandItem
                          key={command.id}
                          onSelect={() => {
                            handleCommandSelect(command);
                            setShowCommands(false);
                          }}
                          onMouseEnter={() => handleMouseEnter(index)}
                          className={cn(
                            'command-item !bg-transparent cursor-pointer px-3 py-3 justify-between rounded-md',
                            index === selectedIndex ? '!bg-accent' : ''
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {command.id}
                            </div>
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
                    {filteredCommands.length > 0 && !isMobile && (
                      <div className="border-t-2 md:border-t-0 md:border-l w-full h-[280px] overflow-auto">
                        <div className="flex-1 p-2 md:p-2">
                          <div className="bg-gray-50 rounded-md p-4 relative">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                              {filteredCommands[selectedIndex]
                                ?.prompt_content ||
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
          </div>
        ) : null}
      </div>
    );
  }
);

export default Input;
