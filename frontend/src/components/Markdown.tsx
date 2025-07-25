import { cn } from '@/lib/utils';
import { omit } from 'lodash';
import { isValidElement, useContext, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { PluggableList } from 'react-markdown/lib';
import { VegaLite } from 'react-vega';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';

import ResponseTextItem from '@chainlit/copilot/src/evoya/privacyShield/ResponseTextItem';
import { ChainlitContext, type IMessageElement } from '@chainlit/react-client';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import BlinkingCursor from './BlinkingCursor';
import CodeSnippet from './CodeSnippet';
import { ElementRef } from './Elements/ElementRef';
import { MarkdownAlert, alertComponents } from './MarkdownAlert';
import { MermaidDiagram } from './Mermaid';
import Step from './chat/Messages/Message/Step';

interface Props {
  allowHtml?: boolean;
  latex?: boolean;
  refElements?: IMessageElement[];
  children: string;
  className?: string;
}

const cursorPlugin = () => {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index, parent) => {
      const placeholderPattern = /\u200B/g;
      const matches = [...(node.value?.matchAll(placeholderPattern) || [])];

      if (matches.length > 0) {
        const newNodes: any[] = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch] = match;
          const startIndex = match.index!;
          const endIndex = startIndex + fullMatch.length;

          if (startIndex > lastIndex) {
            newNodes.push({
              type: 'text',
              value: node.value!.slice(lastIndex, startIndex)
            });
          }

          newNodes.push({
            type: 'blinkingCursor',
            data: {
              hName: 'blinkingCursor',
              hProperties: { text: 'Blinking Cursor' }
            }
          });

          lastIndex = endIndex;
        });

        if (lastIndex < node.value!.length) {
          newNodes.push({
            type: 'text',
            value: node.value!.slice(lastIndex)
          });
        }

        parent!.children.splice(index, 1, ...newNodes);
      }
    });
  };
};

const fixDirectiveColonPlugin = () => {
  return (tree: any) => {
    visit(tree, (node: any, index: number, parent: any) => {
      if (
        (node.type === 'textDirective' ||
         node.type === 'leafDirective' ||
         node.type === 'containerDirective') &&
        !node.data?.hName &&
        /^[a-zA-Z0-9_-]+$/.test(node.name) 
      ) {
        const directiveText = `:${node.name}`;
        parent.children.splice(index, 1, {
          type: 'text',
          value: directiveText
        });
      }
    });
  };
};

const Markdown = ({
  allowHtml,
  latex,
  refElements,
  className,
  children
}: Props) => {
  const rawContent = children;
  const apiClient = useContext(ChainlitContext);

  const rehypePlugins = useMemo(() => {
    let rehypePlugins: PluggableList = [];
    if (allowHtml) {
      rehypePlugins = [rehypeRaw as any, ...rehypePlugins];
    }
    if (latex) {
      rehypePlugins = [
        [rehypeKatex as any, { output: 'mathml' }],
        ...rehypePlugins
      ];
    }
    return rehypePlugins;
  }, [allowHtml, latex]);

  const remarkPlugins = useMemo(() => {
    let remarkPlugins: PluggableList = [
      cursorPlugin,
      remarkGfm as any,
      remarkDirective as any,
      fixDirectiveColonPlugin,
      MarkdownAlert
    ];

    if (latex) {
      remarkPlugins = [...remarkPlugins, remarkMath as any];
    }
    return remarkPlugins;
  }, [latex]);

  return (
    <ReactMarkdown
      className={cn('prose lg:prose-xl', className)}
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={{
        ...alertComponents,
        span({ children, ...props }) {
          if (props.node?.properties.dataPrivacyComponent) {
            return (
              <ResponseTextItem
                sectionId={props.node?.properties.dataPrivacyComponent.toString()}
              />
            );
          }
          return <span {...omit(props, ['node'])}>{children}</span>;
        },
        code(props) {
          return (
            <code
              {...omit(props, ['node'])}
              className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
            />
          );
        },
        pre({ children, ...props }: any) {
          try {
            if (children && isValidElement(children)) {
              const { className, children: rawContent } = children?.props || {};
        
              if (className?.includes('-vega') || className?.includes('-json')) {
                const parsed = JSON.parse(rawContent);
                const isVega = parsed?.$schema?.includes('vega.github.io');
        
                if (isVega) {
                  if (!parsed.width) parsed.width = 'container';
                  if (!parsed.height) parsed.height = 'container';
        
                  return (
                    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
                      <VegaLite spec={parsed} data={parsed.data} />
                    </div>
                  );
                }
              }
        
              if (className?.includes('-mermaid')) {
                return <MermaidDiagram>{rawContent}</MermaidDiagram>;
              }
            }
          } catch (e) {
            console.error('Render error:', e);
            return <CodeSnippet {...props} />;
          }
        
          return <CodeSnippet {...props} />;
        },
        a({ children, ...props }) {
          const name = children as string;
          const element = refElements?.find((e) => e.name === name);
          if (element) {
            return <ElementRef element={element} />;
          } else {
            return (
              <a
                {...props}
                className="text-primary hover:underline"
                target="_blank"
              >
                {children}
              </a>
            );
          }
        },
        img: (image: any) => {
          return (
            <div className="relative">
              <AspectRatio
                ratio={16 / 9}
                className="bg-muted rounded-md overflow-hidden"
              >
                <img
                  src={
                    image.src.startsWith('/public')
                      ? apiClient.buildEndpoint(image.src)
                      : image.src
                  }
                  alt={image.alt}
                  className="h-full w-full object-contain"
                />
              </AspectRatio>
            </div>
          );
        },
        blockquote(props) {
          return (
            <blockquote
              {...omit(props, ['node'])}
              className="mt-6 border-l-2 pl-6 italic"
            />
          );
        },
        em(props) {
          return <span {...omit(props, ['node'])} className="italic" />;
        },
        strong(props) {
          return <span {...omit(props, ['node'])} className="font-bold" />;
        },
        hr() {
          return <Separator />;
        },
        ul(props) {
          return (
            <ul
              {...omit(props, ['node'])}
              className="my-3 ml-3 list-disc pl-2 [&>li]:mt-1"
            />
          );
        },
        ol(props) {
          return (
            <ol
              {...omit(props, ['node'])}
              className="my-3 ml-3 list-decimal pl-2 [&>li]:mt-1"
            />
          );
        },
        h1(props) {
          return (
            <h1
              {...omit(props, ['node'])}
              className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mt-8 first:mt-0"
            />
          );
        },
        h2(props) {
          return (
            <h2
              {...omit(props, ['node'])}
              className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-8 first:mt-0"
            />
          );
        },
        h3(props) {
          return (
            <h3
              {...omit(props, ['node'])}
              className="scroll-m-20 text-2xl font-semibold tracking-tight mt-6 first:mt-0"
            />
          );
        },
        h4(props) {
          return (
            <h4
              {...omit(props, ['node'])}
              className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 first:mt-0"
            />
          );
        },
        p(props) {
          const thinkEndIndex = rawContent.indexOf('</think>');
          const isBeforeThink =
            typeof props.children == 'string' &&
            thinkEndIndex !== -1 &&
            rawContent.indexOf(props.children) < thinkEndIndex;
          return (
            <div
              {...omit(props, ['node'])}
              style={{
                lineHeight: '28px',
                color: isBeforeThink ? 'gray' : 'inherit',
                fontStyle: isBeforeThink ? 'italic' : 'inherit',
                fontSize: isBeforeThink ? '12px' : 'inherit'
              }}
              className="leading-7 [&:not(:first-child)]:mt-4 break-words"
              role="article"
            >
              {props.children}
            </div>
          );
        },
        table({ children, ...props }) {
          return (
            <Card className="[&:not(:first-child)]:mt-2 [&:not(:last-child)]:mb-2">
              <Table {...(props as any)}>{children}</Table>
            </Card>
          );
        },
        li({ children, ...props }) {
          return <li {...omit(props, ['node'])} className="mb-2">{children}</li>
        },
        thead({ children, ...props }) {
          return <TableHeader {...(props as any)}>{children}</TableHeader>;
        },
        tr({ children, ...props }) {
          return <TableRow {...(props as any)}>{children}</TableRow>;
        },
        th({ children, ...props }) {
          return <TableHead {...(props as any)}>{children}</TableHead>;
        },
        td({ children, ...props }) {
          return <TableCell {...(props as any)}>{children}</TableCell>;
        },
        tbody({ children, ...props }) {
          return <TableBody {...(props as any)}>{children}</TableBody>;
        },
        // @ts-expect-error custom plugin
        blinkingCursor: () => <BlinkingCursor whitespace />
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default Markdown;
