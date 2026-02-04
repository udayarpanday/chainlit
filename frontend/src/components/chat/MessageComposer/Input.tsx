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

import { ICommand, agentState, commandsState } from '@chainlit/react-client';

import { Translator } from '@/components/i18n';
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
  selectedAgents?: any[];
  setSelectedAgents?: (agents: any[]) => void;
}

export interface InputMethods {
  reset: () => void;
  getFullContent: () => string;
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
      onPaste,
      selectedAgents: propSelectedAgents,
      setSelectedAgents: propSetSelectedAgents
    },
    ref
  ) => {
    const commands = useRecoilValue(commandsState);
    const agents = useRecoilValue(agentState);
    const [isComposing, setIsComposing] = useState(false);
    const [showCommands, setShowCommands] = useState(false);
    const [showAgents, setShowAgents] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [commandInput, setCommandInput] = useState('');
    const [agentInput, setAgentInput] = useState('');
    const [_localSelectedAgents, _setLocalSelectedAgents] = useState<any[]>([]);

    // Use props if provided, otherwise use local state
    const selectedAgents =
      propSelectedAgents !== undefined
        ? propSelectedAgents
        : _localSelectedAgents;
    const setSelectedAgents =
      propSetSelectedAgents !== undefined
        ? propSetSelectedAgents
        : _setLocalSelectedAgents;

    const contentEditableRef = useRef<HTMLDivElement>(null);
    const lastCommandSpanRef = useRef<HTMLElement | null>(null);
    const lastAgentSpanRef = useRef<HTMLElement | null>(null);
    const mutationObserverRef = useRef<MutationObserver | null>(null);
    const isUpdatingRef = useRef(false);
    const [isCommandExpanded, setIsCommandExpanded] = useState(false);
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

    const getFullContent = () => {
      // Get base content
      const baseContent = getContentWithoutCommand();

      // Prepend agents to the message as part of the text with markdown-like formatting
      if (selectedAgents && selectedAgents.length > 0) {
        const agentMentions = selectedAgents
          .map((agent) => `**@${agent.name}**`)
          .join(' ');
        return `${agentMentions}\n${baseContent}`.trim();
      }

      return baseContent;
    };

    const reset = () => {
      setSelectedCommand(undefined);
      setSelectedIndex(0);
      setCommandInput('');
      setAgentInput('');
      setIsCommandExpanded(false);
      setShowAgents(false);
      setShowCommands(false);
      setSelectedAgents([]);
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = '';
      }
      onChange('');
    };

    useImperativeHandle(ref, () => ({
      reset,
      getFullContent
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

            // Check if the removed node was our agent span
            const wasAgentSpanRemoved = Array.from(mutation.removedNodes).some(
              (node) => (node as HTMLElement).classList?.contains('agent-span')
            );

            if (wasCommandSpanRemoved && !mutation.addedNodes.length) {
              handleCommandSelect(undefined);
            }

            if (wasAgentSpanRemoved && !mutation.addedNodes.length) {
              lastAgentSpanRef.current = null;
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

    // Monitor input changes to detect when expanded content is completely removed
    useEffect(() => {
      if (!selectedCommand || !isCommandExpanded) return;

      const content = contentEditableRef.current;
      if (!content) return;

      const handleContentChange = () => {
        if (isUpdatingRef.current) return;

        const currentText = content.textContent || '';

        // Only reset if the content is completely empty or just whitespace
        // This prevents interference with normal editing/backspacing
        if (!currentText.trim()) {
          setSelectedCommand(undefined);
          setIsCommandExpanded(false);
        }
      };

      content.addEventListener('input', handleContentChange);

      return () => {
        content.removeEventListener('input', handleContentChange);
      };
    }, [selectedCommand, isCommandExpanded]);

    // Handle selectedCommand prop changes
    useEffect(() => {
      const content = contentEditableRef.current;
      if (!content) return;

      isUpdatingRef.current = true;

      try {
        // Find existing command span
        const existingCommandSpan = content.querySelector('.command-span');

        if (selectedCommand) {
          if (isCommandExpanded) {
            // When expanded, replace the command with editable text content
            const promptContent =
              selectedCommand.prompt_content || selectedCommand.id;

            // Remove any existing command span
            if (existingCommandSpan) {
              existingCommandSpan.remove();
            }

            // Create a div to hold the formatted content
            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'inline';
            contentDiv.contentEditable = 'true';

            // Convert newlines to <br> tags and preserve other formatting
            const formattedContent = promptContent
              .replace(/\n/g, '<br>')
              .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;'); // Convert tabs to spaces

            contentDiv.innerHTML = formattedContent + ' ';

            // Insert the formatted content at the beginning
            if (content.firstChild) {
              content.insertBefore(contentDiv, content.firstChild);
            } else {
              content.appendChild(contentDiv);
            }

            lastCommandSpanRef.current = null; // No reference needed for expanded state

            // For expanded state, set cursor after the inserted content
            content.focus();

            // Move cursor to end of content
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(content);
            range.collapse(false);

            selection?.removeAllRanges();
            selection?.addRange(range);

            onChange(getContentWithoutCommand());
          } else {
            // When collapsed, show as command span with expand button

            const newCommandBlock = document.createElement('div');
            newCommandBlock.className =
              'command-span font-bold inline-flex text-[#08f] items-center mr-1';
            newCommandBlock.contentEditable = 'false';

            const commandContent = `
              <div class="command-clickable flex items-center gap-1 cursor-pointer hover:bg-blue-50 rounded px-1 transition-colors">
                <button class="command-toggle-btn flex-shrink-0 pointer-events-none" type="button">
                  <svg class="w-3 h-3 transition-transform rotate-[-90deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <span class="truncate max-w-[200px] pointer-events-none">${selectedCommand.id}</span>
              </div>
            `;

            newCommandBlock.innerHTML = commandContent;

            // Store reference to the command span
            lastCommandSpanRef.current = newCommandBlock;

            // Add click event listener for the entire command area
            const clickableArea =
              newCommandBlock.querySelector('.command-clickable');
            if (clickableArea) {
              clickableArea.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCommandExpanded(true);
              });
            }

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
            selection?.removeAllRanges();
            const range = document.createRange();

            // Set cursor position at the beginning of the text node
            range.setStart(textNode, 0);
            range.collapse(true);

            // Apply the selection
            selection?.addRange(range);

            // Force focus with delay to ensure it happens after any button close events
            content.focus();

            // Double-focus technique - helps in some browsers/situations
            setTimeout(() => {
              // Make sure caret is visible
              content.style.caretColor = 'black';

              // Re-focus and set cursor position again
              content.focus();

              if (selection?.rangeCount && selection.rangeCount > 0) {
                selection.removeAllRanges();
                selection.addRange(range);
              }

              // Trigger onChange with content excluding command
              onChange(getContentWithoutCommand());
            }, 10);
          }
        } else {
          // Remove existing command span
          if (existingCommandSpan) {
            existingCommandSpan.remove();
          }
          lastCommandSpanRef.current = null;

          // Ensure cursor is placed at start
          const range = document.createRange();
          range.setStart(content, 0);
          range.collapse(true);

          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);

          content.focus();
          onChange(getContentWithoutCommand());
        }
      } finally {
        // Use setTimeout to ensure all DOM updates are complete
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 20);
      }
    }, [selectedCommand, onChange, isCommandExpanded]);

    const normalizedInput = commandInput.toLowerCase().slice(1);

    const filteredCommands = commands
      ?.filter((command) => command.id.toLowerCase().includes(normalizedInput))
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

        // Process the text - convert newlines to <br> tags and escape HTML
        const escapedText = escapeHtml(textData || '');
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
        if (!selection?.rangeCount) return;

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
        selection?.removeAllRanges();
        selection?.addRange(range);
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
        setShowAgents(false);
        setAgentInput('');
      } else if (lastWord.startsWith('@')) {
        setShowAgents(true);
        setAgentInput(lastWord);
        setShowCommands(false);
        setCommandInput('');
      } else {
        setShowCommands(false);
        setShowAgents(false);
        setCommandInput('');
        setAgentInput('');
      }

      // If there's no real content, remove the <br>
      if (!fullContent.trim() || fullContent.trim() === '\u200B') {
        e.currentTarget.innerHTML = '';
      }
    };

    const normalizedAgentInput = agentInput.toLowerCase().slice(1);
    const filteredAgents =
      agents?.agents?.length > 0 &&
      agents?.agents
        .filter((agent) =>
          agent.name.toLowerCase().includes(normalizedAgentInput)
        )
        .sort((a, b) => {
          const indexA = a.name.toLowerCase().indexOf(normalizedAgentInput);
          const indexB = b.name.toLowerCase().indexOf(normalizedAgentInput);
          return indexA - indexB;
        });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!showCommands && !showAgents) {
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

      // Handle agent navigation
      if (showAgents) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredAgents.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && filteredAgents.length > 0) {
          e.preventDefault();
          const selectedAgent = filteredAgents[selectedIndex];
          handleAgentSelect(selectedAgent);
        } else if (e.key === 'Escape') {
          setShowAgents(false);
        }
        return;
      }

      // Handle command navigation
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
      setIsCommandExpanded(false); // Reset expansion state when selecting a new command

      // Set a small timeout to ensure state updates are processed
      setTimeout(() => {
        // If there's an existing command and we're selecting a new one, clear the content first
        if (selectedCommand && command && contentEditableRef.current) {
          contentEditableRef.current.innerHTML = '';
        }

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

    const handleAgentSelect = (agent: any) => {
      setShowAgents(false);
      setSelectedIndex(0);

      // Add agent to the list if not already present
      setSelectedAgents((prev) => {
        const agentExists = prev.some((a) => a.uuid === agent.uuid);
        if (agentExists) return prev;
        return [...prev, agent];
      });

      // Clean up the agent input text from contentEditable
      if (contentEditableRef.current) {
        const content = contentEditableRef.current;
        const textContent = content.textContent || '';
        const cleanedContent = textContent.replace(agentInput, '').trimStart();
        content.textContent = cleanedContent;

        // Set cursor at the end of the content
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(content);
        range.collapse(false); // false means collapse to the end
        selection?.removeAllRanges();
        selection?.addRange(range);

        content.focus();
        onChange(cleanedContent);
      }

      setAgentInput('');
    };

    const handleRemoveAgent = (agentId: string) => {
      setSelectedAgents((prev) => prev.filter((a) => a.uuid !== agentId));
      if (contentEditableRef.current) {
        contentEditableRef.current.focus();
      }
    };

    const handleMouseEnter = (index: number) => {
      // Small delay before changing the displayed command
      setTimeout(() => {
        setSelectedIndex(index);
      }, 100);
    };

    return (
      <div className="relative w-full">
        {selectedAgents.length > 0 && (
          <div className="mb-2 flex gap-2 flex-wrap">
            {selectedAgents.map((agent) => {
              if (agent?.name) {
                return (
                  <div
                    key={agent.uuid}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-red-400 text-white rounded-full text-sm font-medium"
                  >
                    <span className="truncate max-w-[150px]">
                      @{agent.name}
                    </span>
                    <button
                      onClick={() => handleRemoveAgent(agent.uuid)}
                      className="ml-1 hover:bg-red-500 rounded-full p-0.5 transition-colors"
                      type="button"
                      aria-label={`Remove ${agent.name}`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                );
              }
            })}
          </div>
        )}
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
          <div className="absolute z-50 -top-4 -left-[15px] -translate-y-full w-md-[820px] w-lg-[950px] w-[57vw]">
            <div className="w-full">
              <Command className="rounded-lg border shadow-none">
                <div className="flex items-center pb-0">
                  <CommandInput
                    placeholder="Search prompts..."
                    className="h-12"
                  />
                </div>
                <CommandList className="max-h-[60vh] md:max-h-[300px] !overflow-hidden">
                  <CommandEmpty>No results found.</CommandEmpty>
                  <div className="flex flex-col md:flex-row">
                    <CommandGroup className="w-full md:w-[500px] p-2 h-[280px] overflow-auto">
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
                              {filteredCommands[selectedIndex]?.description ||
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
        {showAgents && filteredAgents.length ? (
          <div className="absolute z-50 -top-4 -left-[15px] -translate-y-full w-md-[820px] w-lg-[950px] w-[57vw]">
            <div className="w-full">
              <Command className="rounded-lg border shadow-none">
                <div className="flex items-center pb-0">
                  <CommandInput
                    placeholder="Search agents..."
                    className="h-12"
                  />
                </div>
                <CommandList className="max-h-[60vh] md:max-h-[300px] !overflow-hidden">
                  <CommandEmpty>No agents found.</CommandEmpty>
                  <div className="flex flex-col md:flex-row">
                    <CommandGroup className="w-full md:w-[500px] p-2 h-[280px] overflow-auto">
                      {filteredAgents.map((agent, index) => (
                        <CommandItem
                          key={agent.uuid}
                          onSelect={() => {
                            handleAgentSelect(agent);
                            setShowAgents(false);
                          }}
                          onMouseEnter={() => handleMouseEnter(index)}
                          className={cn(
                            'command-item !bg-transparent cursor-pointer px-3 py-3 justify-between rounded-md',
                            index === selectedIndex ? '!bg-accent' : ''
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {agent.name}
                            </div>
                          </div>
                          <div className="text-gray-400 ml-2 flex-shrink-0">
                            <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {filteredAgents.length > 0 && !isMobile && (
                      <div className="border-t-2 md:border-t-0 md:border-l w-full h-[280px] overflow-auto">
                        <div className="flex-1 p-2 md:p-2">
                          <div className="bg-gray-50 rounded-md p-4 relative">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                              {filteredAgents[selectedIndex]?.description || (
                                <Translator
                                  path={
                                    'components.organisms.chat.inputBox.view_agent_details.text'
                                  }
                                />
                              )}
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
