import { type ReactNode, isValidElement } from 'react';

// Markdown labels can contain emphasis, code, or privacy spans. Preserve their
// visible text when matching file references and inferring a document format.
export function linkLabel(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number')
    return String(children);
  if (Array.isArray(children)) return children.map(linkLabel).join('');
  if (isValidElement<{ children?: ReactNode }>(children))
    return linkLabel(children.props.children);
  return '';
}
